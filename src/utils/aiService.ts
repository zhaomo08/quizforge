import { Question } from '@/types';
import { parseModelResponse } from '@/utils/ai/responseParser';
import { modelRegistry, PROVIDER_MODELS, ModelConfig } from '@/utils/ai/modelRegistry';
import { resolveApiKey, getProjectApiKey, ResolvedApiKey } from '@/utils/ai/apiKeyResolver';

export interface AIGenerateRequest {
  category: string;
  count: number;
  difficulty?: string;
  apiKey?: string;
  userId?: string;
  keyId?: string;   // 用户选择的具体 key ID（付费模型）
  strategy?: 'fast' | 'reasoning';
}

// API base URL per provider
const PROVIDER_BASE_URL: Record<string, string> = {
  builtin:  'https://openrouter.ai/api/v1',
  custom:   'https://openrouter.ai/api/v1',
  deepseek: 'https://api.deepseek.com/v1',
  qwen:     'https://dashscope.aliyuncs.com/compatible-mode/v1',
  kimi:     'https://api.moonshot.cn/v1',
};

// OpenRouter free 路由器：自动选择可用的免费模型
const STRATEGY_OPENROUTER: Record<'fast' | 'reasoning', string> = {
  fast:      'openrouter/free',
  reasoning: 'openrouter/free',
};

// 策略到各原生厂商首选模型的映射
const STRATEGY_NATIVE: Record<string, Record<'fast' | 'reasoning', string>> = {
  deepseek: { fast: 'deepseek-chat',     reasoning: 'deepseek-reasoner' },
  qwen:     { fast: 'qwen-plus',         reasoning: 'qwen-max'          },
  kimi:     { fast: 'moonshot-v1-8k',    reasoning: 'moonshot-v1-32k'   },
};

export class AIService {
  static getProjectApiKey(): string {
    return getProjectApiKey();
  }

  private static resolveKey(userApiKey?: string, userId?: string, keyId?: string): ResolvedApiKey {
    const opts: Parameters<typeof resolveApiKey>[0] = { validate: this.validateApiKey };
    if (userApiKey !== undefined) opts.userApiKey = userApiKey;
    if (userId !== undefined) opts.userId = userId;
    if (keyId !== undefined) opts.keyId = keyId;
    return resolveApiKey(opts);
  }

  private static async callApi(
    prompt: string,
    apiKeyData: ResolvedApiKey,
    retryCount = 0
  ): Promise<{ content: string; modelUsed: ModelConfig }> {
    const provider = apiKeyData.provider;

    // 同步 registry 到当前 provider，然后立刻恢复用户指定的模型
    modelRegistry.switchProvider(provider);
    if (apiKeyData.preferredModel) {
      modelRegistry.upsertAndActivate(apiKeyData.preferredModel);
    }

    const models = PROVIDER_MODELS[provider] ?? PROVIDER_MODELS['builtin']!;
    // maxRetries 要包含可能动态追加的自定义模型（至少 2 次）
    const maxRetries = Math.max(models.length, 1) * 2;

    if (retryCount >= maxRetries) {
      throw new Error('所有模型都不可用，请稍后重试或检查网络连接');
    }

    let modelToUse = modelRegistry.getActiveModel();
    if (modelRegistry.shouldSkip(modelToUse.id)) {
      modelToUse = modelRegistry.advance();
    }

    const baseURL = PROVIDER_BASE_URL[provider] ?? PROVIDER_BASE_URL['builtin']!;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeyData.key}`,
    };
    if (provider === 'builtin' || provider === 'custom') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'QuizForge AI';
    }

    console.log(`🤖 [${provider}] ${modelToUse.name} (${modelToUse.id})`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let response: Response;
      try {
        response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelToUse.id,
            messages: [
              {
                role: 'system',
                content: '你是专业的技术面试官，负责生成高质量面试题。只返回有效的JSON格式，不要包含任何其他文字或Markdown标记。',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.8,
            max_tokens: modelToUse.maxTokens,
            top_p: 0.9,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMsg = `HTTP ${response.status}`;
        try {
          errorMsg = JSON.parse(errorText).error?.message ?? errorMsg;
        } catch {}

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          let wait = 1500 + Math.random() * 600;
          if (retryAfter) {
            const sec = parseInt(retryAfter, 10);
            if (!isNaN(sec)) wait = sec * 1000;
          }
          console.warn(`⏳ 限流 429，等待 ${Math.round(wait)}ms`);
          await new Promise(r => setTimeout(r, wait));
          return this.callApi(prompt, apiKeyData, retryCount + 1);
        }

        if (response.status === 401) {
          throw new Error(`API Key 无效 (401)。请在「API Key 管理」中检查您的密钥。`);
        }

        throw new Error(`${modelToUse.name} 请求失败: ${errorMsg}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content?.trim()) {
        throw new Error(`${modelToUse.name} 返回空内容`);
      }

      modelRegistry.markSuccess(modelToUse.id);
      console.log(`✅ ${modelToUse.name} 生成成功`);
      return { content, modelUsed: modelToUse };

    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) throw error;

      const failures = modelRegistry.markFailure(modelToUse.id);
      console.warn(`❌ ${modelToUse.name} 失败(第${failures}次):`, error);
      modelRegistry.advance();

      const isNetworkError = error instanceof Error && (
        error.name === 'AbortError' ||
        /fetch|network|timeout|503|502|500/i.test(error.message)
      );
      if (!isNetworkError) {
        const delay = Math.min(1000 * 2 ** Math.floor(retryCount / Math.max(models.length, 1)), 5000);
        await new Promise(r => setTimeout(r, delay));
      }

      return this.callApi(prompt, apiKeyData, retryCount + 1);
    }
  }

  static async generateQuestions({
    category,
    count,
    difficulty = 'medium',
    apiKey,
    userId,
    keyId,
    strategy,
  }: AIGenerateRequest): Promise<Question[]> {
    const keyData = this.resolveKey(apiKey, userId, keyId);
    const provider = keyData.provider;

    // 同步 registry 到正确 provider，然后按优先级设置模型
    modelRegistry.switchProvider(provider);
    if (keyData.preferredModel) {
      // 用户在 API Key 管理里指定了具体模型，最高优先级（支持不在预设列表中的自定义 ID）
      modelRegistry.upsertAndActivate(keyData.preferredModel);
    } else if (!modelRegistry.hasUserSelection()) {
      // 按难度/策略选择首选模型
      const effectiveStrategy: 'fast' | 'reasoning' = strategy ?? (difficulty === 'hard' ? 'reasoning' : 'fast');
      const preferredId = (STRATEGY_NATIVE[provider] ?? STRATEGY_OPENROUTER)[effectiveStrategy];
      if (preferredId) modelRegistry.setActiveModel(preferredId);
    }

    const categoryMap: Record<string, string> = {
      java: 'Java编程', python: 'Python编程', javascript: 'JavaScript编程',
      database: '数据库', algorithm: '算法与数据结构',
      'system-design': '系统设计', 'operating-system': '操作系统',
    };
    const difficultyMap: Record<string, string> = { easy: '初级', medium: '中级', hard: '高级' };

    const prompt = `请生成${count}道${difficultyMap[difficulty] ?? difficulty}难度的${categoryMap[category] ?? category}面试题，严格按照以下JSON格式返回：

[
  {
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": 0,
    "explanation": "详细解释为什么这个答案是正确的，以及其他选项为什么错误",
    "difficulty": "${difficulty}"
  }
]

要求：
- 每道题必须有4个选项（A、B、C、D）
- correctAnswer是正确答案的索引（0-3）
- 提供详细的中文解释
- 题目清晰，选项有区分度
- 所有内容使用中文
- 只返回有效的JSON数组，不要包含任何其他文本或markdown标记

请直接返回JSON数组：`;

    try {
      const { content, modelUsed } = await this.callApi(prompt, keyData);
      const questions = parseModelResponse(content, { category, difficulty, modelName: modelUsed.name });
      console.log(`✅ 使用 ${modelUsed.name} 生成了 ${questions.length} 道题目`);
      return questions;
    } catch (error) {
      if (error instanceof Error) throw new Error(`生成题目失败: ${error.message}`);
      throw new Error('生成题目失败，请检查网络连接或稍后重试');
    }
  }

  static validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length >= 20;
  }

  static getCurrentModelInfo() {
    const m = modelRegistry.getActiveModel();
    const snap = modelRegistry.getHealthSnapshot();
    return { model: m.id, name: m.name, description: m.description, index: snap.currentModel.index, total: modelRegistry.total };
  }

  static getAllModels() { return modelRegistry.getAllModels(); }
  static switchToNextModel(): void { modelRegistry.advance(); }
  static switchToModel(modelId: string): boolean { return modelRegistry.setUserSelectedModel(modelId); }
  static resetModelFailures(): void { modelRegistry.resetFailures(); }
  static getModelHealth() { return modelRegistry.getHealthSnapshot(); }
}
