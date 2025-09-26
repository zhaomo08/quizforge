import { Question } from '@/types';
import { parseModelResponse } from '@/utils/ai/responseParser';
import { modelRegistry, ModelConfig } from '@/utils/ai/modelRegistry';
import { resolveApiKey, getProjectApiKey } from '@/utils/ai/apiKeyResolver';

export interface AIGenerateRequest {
  category: string;
  count: number;
  difficulty?: string;
  apiKey?: string; // 现在是可选的
  userId?: string; // 用户ID，用于判断是否使用内置API Key
  // 任务型模型路由：
  // fast - 速度优先/大多数出题任务（默认）
  // reasoning - 推理优先/更复杂解析任务
  strategy?: 'fast' | 'reasoning';
}

export class AIService {
  // 调试方法：获取当前 API Key
  static getProjectApiKey(): string {
    const key = getProjectApiKey();
    console.log(
      '🔑 当前项目 API Key:',
      key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : '未设置'
    );
    return key;
  }

  // 获取要使用的 API Key
  private static getApiKey(userApiKey?: string, userId?: string): string {
    const logger = (message: string, value?: unknown) => {
      if (typeof value !== 'undefined') {
        console.log(message, value);
      } else {
        console.log(message);
      }
    };

    const key = resolveApiKey({
      userApiKey,
      userId,
      validate: this.validateApiKey,
      logger,
    });

    logger('import.meta.env:', (import.meta as any).env);

    return key;
  }

  // 根据策略选择首选模型（若该模型不存在于 registry，则忽略）
  private static selectPreferredModelByStrategy(strategy: 'fast' | 'reasoning'): void {
    // 若用户已手动选择模型，则不再用策略覆盖
    try {
      // modelRegistry 暴露 hasUserSelection（在 modelRegistry.ts 中新增）
      // @ts-ignore - 访问可选方法以兼容旧实现
      if (modelRegistry.hasUserSelection && modelRegistry.hasUserSelection()) {
        return;
      }
    } catch {}
    const mapping: Record<'fast' | 'reasoning', string> = {
      // 优先中文与稳定的 DeepSeek 3.1 作为速度优先的默认
      fast: 'deepseek/deepseek-chat-v3.1:free',
      // 推理优先使用 DeepSeek R1 0528
      reasoning: 'deepseek/deepseek-r1-0528:free',
    };
    const preferredId = mapping[strategy];
    if (!preferredId) return;
    const ok = modelRegistry.setActiveModel(preferredId);
    if (ok) {
      console.log(`🎯 策略(${strategy})已选择首选模型: ${preferredId}`);
    } else {
      console.log(`ℹ️ 策略(${strategy})的首选模型 ${preferredId} 不在注册表中，使用当前轮询模型`);
    }
  }

  private static async callOpenRouter(
    prompt: string,
    apiKey: string,
    retryCount = 0
  ): Promise<{ content: string; modelUsed: ModelConfig }> {
    const maxRetries = modelRegistry.total * 2; // 允许每个模型重试一次

    if (retryCount >= maxRetries) {
      throw new Error('所有模型都不可用，请稍后重试或检查网络连接');
    }

    // 选择模型：优先使用上次成功的模型，否则按顺序轮询
    let modelToUse = modelRegistry.getActiveModel();

    if (modelRegistry.shouldSkip(modelToUse.id)) {
      modelToUse = modelRegistry.advance();
    }

    console.log(`🤖 尝试使用模型: ${modelToUse.name} (${modelToUse.id})`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45秒超时

      let response: Response;

      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Interview Assistant',
        },
        body: JSON.stringify({
          model: modelToUse.id,
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical interviewer. Generate high-quality interview questions with clear explanations. Always respond in Chinese and return valid JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
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
        let errorMessage = `HTTP ${response.status}`;
        let parsedError: any = null;

        try {
          parsedError = JSON.parse(errorText);
          errorMessage = parsedError.error?.message || errorMessage;
        } catch {
          // 忽略 JSON 解析错误，保留原始文本
        }

        // 429 友好重试：尊重 Retry-After 头，不计失败、不轮换模型
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          let waitMs = 0;
          if (retryAfterHeader) {
            const asInt = parseInt(retryAfterHeader, 10);
            if (!Number.isNaN(asInt)) {
              waitMs = asInt * 1000; // 秒
            } else {
              const asDate = Date.parse(retryAfterHeader);
              if (!Number.isNaN(asDate)) {
                waitMs = Math.max(asDate - Date.now(), 0);
              }
            }
          }
          // 默认等待 1.5s，加入±300ms 抖动
          if (waitMs <= 0) {
            waitMs = 1500 + Math.floor((Math.random() - 0.5) * 600);
          }
          console.warn(`⏳ 命中限流 429，等待 ${waitMs}ms 后重试（不轮换模型）`);
          await new Promise(r => setTimeout(r, waitMs));
          return this.callOpenRouter(prompt, apiKey, retryCount + 1);
        }

        // 针对 OpenRouter 返回的 401 "User not found." 给出更友好的提示
        if (response.status === 401 && parsedError?.error?.message && parsedError.error.message.toLowerCase().includes('user not found')) {
          const safeKeyHint = apiKey && typeof apiKey === 'string' && apiKey.length > 10 ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : '（未提供）';
          throw new Error(`OpenRouter 返回 401: User not found. 这通常表示所使用的 API Key 无效或未正确关联到 OpenRouter 帐号。\n使用的 Key（部分）：${safeKeyHint}\n解决办法：确保在项目环境变量 VITE_OPENROUTER_API_KEY 中配置了有效的 OpenRouter API Key，或在“API Key 管理”中添加有效 Key；如仍有问题，请登录 OpenRouter 控制台确认 Key 状态。`);
        }

        throw new Error(`模型 ${modelToUse.name} 请求失败: ${errorMessage}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content || content.trim().length === 0) {
        throw new Error(`模型 ${modelToUse.name} 返回空内容`);
      }

      // 成功时重置失败计数并记录成功模型
      modelRegistry.markSuccess(modelToUse.id);

      console.log(`✅ 模型 ${modelToUse.name} 生成成功`);

      return {
        content,
        modelUsed: modelToUse
      };

    } catch (error) {
  const failureCount = modelRegistry.markFailure(modelToUse.id);

  console.warn(`❌ 模型 ${modelToUse.name} 失败 (第${failureCount}次):`, error);

  modelRegistry.advance();

      const immediateRetry =
        error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('503') ||
          error.message.includes('502') ||
          error.message.includes('500') ||
          error.message.includes('ISO-8859-1') ||
          error.message.includes('non ISO-8859-1')
        );

      if (!immediateRetry) {
        const delay = Math.min(
          1000 * Math.pow(2, Math.floor(retryCount / Math.max(modelRegistry.total, 1))),
          5000
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return this.callOpenRouter(prompt, apiKey, retryCount + 1);
    }
  }

  static async generateQuestions({
    category,
    count,
    difficulty = 'medium',
    apiKey,
    userId,
    strategy,
  }: AIGenerateRequest): Promise<Question[]> {
    // 获取要使用的 API Key
    const effectiveApiKey = this.getApiKey(apiKey, userId);
    const categoryMap: Record<string, string> = {
      'java': 'Java编程',
      'python': 'Python编程',
      'javascript': 'JavaScript编程',
      'database': '数据库',
      'algorithm': '算法与数据结构',
      'system-design': '系统设计',
      'operating-system': '操作系统',
    };

    const categoryName = categoryMap[category] || category;
    const difficultyMap: Record<string, string> = {
      'easy': '初级',
      'medium': '中级',
      'hard': '高级'
    };
    const difficultyName = difficultyMap[difficulty] || difficulty;

    // 任务型模型路由：若未显式指定 strategy，则按难度推断（hard -> reasoning，其它 -> fast）
    const effectiveStrategy: 'fast' | 'reasoning' = strategy
      ? strategy
      : (difficulty === 'hard' ? 'reasoning' : 'fast');

    // 在调用前设置策略对应的首选模型，失败时由 callOpenRouter 内的轮询与重试接管
    try {
      this.selectPreferredModelByStrategy(effectiveStrategy);
    } catch (e) {
      console.warn('设置策略首选模型失败，继续使用当前模型轮询:', e);
    }

    const prompt = `请生成${count}道${difficultyName}难度的${categoryName}面试题，严格按照以下JSON格式返回：

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
- 题目应该是${categoryName}领域常见的面试问题
- 每道题必须有4个选项（A、B、C、D）
- correctAnswer是正确答案的索引（0-3）
- 提供详细的解释说明
- 涵盖${categoryName}的不同方面
- 确保题目清晰明确，选项有区分度
- 所有内容使用中文
- 只返回有效的JSON格式，不要包含任何其他文本或markdown标记

请直接返回JSON数组：`;

    try {
      const { content, modelUsed } = await this.callOpenRouter(prompt, effectiveApiKey);
      const questions = parseModelResponse(content, {
        category,
        difficulty,
        modelName: modelUsed.name,
      });

      console.log(`✅ 成功使用${modelUsed.name}生成${questions.length}道题目`);
      return questions;

    } catch (error) {
      console.error('生成题目失败:', error);

      if (error instanceof Error) {
        // 如果错误信息包含模型名称，直接抛出
        if (error.message.includes('模型')) {
          throw error;
        }
        throw new Error(`生成题目失败: ${error.message}`);
      }

      throw new Error('生成题目失败，请检查网络连接或稍后重试');
    }
  }

  static validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length >= 20 && apiKey.trim().length > 0;
  }

  // 获取当前使用的模型信息
  static getCurrentModelInfo(): { model: string; name: string; description: string; index: number; total: number } {
    const currentModel = modelRegistry.getActiveModel();
    return {
      model: currentModel.id,
      name: currentModel.name,
      description: currentModel.description,
      index: modelRegistry.getHealthSnapshot().currentModel.index,
      total: modelRegistry.total
    };
  }

  // 获取所有可用模型
  static getAllModels() {
    return modelRegistry.getAllModels();
  }

  // 手动切换模型
  static switchToNextModel(): void {
    modelRegistry.advance();
  }

  // 切换到指定模型
  static switchToModel(modelId: string): boolean {
    // 优先标记为用户选择的模型，以避免被策略覆盖
    // @ts-ignore - 使用新增的 API，旧实现回退到 setActiveModel
    if (modelRegistry.setUserSelectedModel) {
      // @ts-ignore
      return modelRegistry.setUserSelectedModel(modelId);
    }
    return modelRegistry.setActiveModel(modelId);
  }

  // 重置模型失败计数
  static resetModelFailures(): void {
    modelRegistry.resetFailures();
  }

  // 获取模型健康状态
  static getModelHealth() {
    return modelRegistry.getHealthSnapshot();
  }
}