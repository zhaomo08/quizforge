import { Question } from '@/types';

export interface AIGenerateRequest {
  category: string;
  count: number;
  difficulty?: string;
  apiKey: string;
}

export class AIService {
  // 免费模型列表，按性能和稳定性排序
  private static readonly FREE_MODELS = [
    {
      id: 'deepseek/deepseek-chat-v3.1:free',
      name: 'DeepSeek V3.1',
      description: 'DeepSeek免费模型',
      maxTokens: 4000,
    },
    {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.5 Flash',
      description: 'Google免费模型',
      maxTokens: 3500,
    },
    {
      id: 'moonshotai/kimi-k2:free',
      name: 'Kimi K2',
      description: 'Moonshot免费模型',
      maxTokens: 3000,
    },
    {
      id: 'mistralai/mistral-small-3.1-24b-instruct:free',
      name: 'Mistral small',
      description: 'Mistral免费模型',
      maxTokens: 3000,
    },
    {
      id: 'openai/gpt-oss-120b:free',
      name: 'GPT-OSS-120B',
      description: 'OpenRouter免费模型',
      maxTokens: 2500,
    },
  ];

  private static currentModelIndex = 0;
  private static modelFailureCount = new Map<string, number>();
  private static lastSuccessfulModel = '';

  private static async callOpenRouter(prompt: string, apiKey: string, retryCount = 0): Promise<{ content: string; modelUsed: string }> {
    const maxRetries = this.FREE_MODELS.length * 2; // 允许每个模型重试一次

    if (retryCount >= maxRetries) {
      throw new Error('所有模型都不可用，请稍后重试或检查网络连接');
    }

    // 选择模型：优先使用上次成功的模型，否则按顺序轮询
    let modelToUse = this.FREE_MODELS[this.currentModelIndex];

    // 如果当前模型失败次数过多，跳过它
    const failureCount = this.modelFailureCount.get(modelToUse.id) || 0;
    if (failureCount >= 3) {
      this.currentModelIndex = (this.currentModelIndex + 1) % this.FREE_MODELS.length;
      modelToUse = this.FREE_MODELS[this.currentModelIndex];
    }

    console.log(`🤖 尝试使用模型: ${modelToUse.name} (${modelToUse.id})`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45秒超时

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // 忽略JSON解析错误
        }

        throw new Error(`模型 ${modelToUse.name} 请求失败: ${errorMessage}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content || content.trim().length === 0) {
        throw new Error(`模型 ${modelToUse.name} 返回空内容`);
      }

      // 成功时重置失败计数并记录成功模型
      this.modelFailureCount.set(modelToUse.id, 0);
      this.lastSuccessfulModel = modelToUse.id;

      console.log(`✅ 模型 ${modelToUse.name} 生成成功`);

      return {
        content,
        modelUsed: modelToUse.name
      };

    } catch (error) {
      const currentFailures = this.modelFailureCount.get(modelToUse.id) || 0;
      this.modelFailureCount.set(modelToUse.id, currentFailures + 1);

      console.warn(`❌ 模型 ${modelToUse.name} 失败 (第${currentFailures + 1}次):`, error);

      // 切换到下一个模型
      this.currentModelIndex = (this.currentModelIndex + 1) % this.FREE_MODELS.length;

      // 如果是网络错误、超时、服务器错误或编码错误，立即重试下一个模型
      if (error instanceof Error && (
        error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('503') ||
        error.message.includes('502') ||
        error.message.includes('500') ||
        error.message.includes('ISO-8859-1') ||
        error.message.includes('non ISO-8859-1')
      )) {
        return this.callOpenRouter(prompt, apiKey, retryCount + 1);
      }

      // 其他错误稍作延迟后重试
      const delay = Math.min(1000 * Math.pow(2, Math.floor(retryCount / this.FREE_MODELS.length)), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.callOpenRouter(prompt, apiKey, retryCount + 1);
    }
  }

  static async generateQuestions({
    category,
    count,
    difficulty = 'medium',
    apiKey,
  }: AIGenerateRequest): Promise<Question[]> {
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
      const { content, modelUsed } = await this.callOpenRouter(prompt, apiKey);

      // 清理 JSON 响应
      let cleanedResponse = content.trim();

      // 移除可能的markdown标记
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // 移除可能的前后文本
      const jsonStart = cleanedResponse.indexOf('[');
      const jsonEnd = cleanedResponse.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      let questionsData;
      try {
        questionsData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON解析失败，原始响应:', cleanedResponse);
        throw new Error(`模型${modelUsed}返回的JSON格式无效，请重试`);
      }

      if (!Array.isArray(questionsData)) {
        throw new Error(`模型${modelUsed}返回的不是数组格式，请重试`);
      }

      if (questionsData.length === 0) {
        throw new Error(`模型${modelUsed}没有生成任何题目，请重试`);
      }

      const questions: Question[] = questionsData.map((q: any, index: number) => {
        // 验证题目格式
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
          typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`模型${modelUsed}生成的第${index + 1}题格式不正确`);
        }

        return {
          id: `ai_${category}_${Date.now()}_${index}`,
          category,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '暂无解释',
          difficulty: q.difficulty || difficulty,
          createdAt: new Date().toISOString(),
        };
      });

      console.log(`✅ 成功使用${modelUsed}生成${questions.length}道题目`);
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
    const currentModel = this.FREE_MODELS[this.currentModelIndex];
    return {
      model: currentModel.id,
      name: currentModel.name,
      description: currentModel.description,
      index: this.currentModelIndex,
      total: this.FREE_MODELS.length
    };
  }

  // 获取所有可用模型
  static getAllModels() {
    return this.FREE_MODELS.map((model, index) => ({
      ...model,
      isActive: index === this.currentModelIndex,
      failureCount: this.modelFailureCount.get(model.id) || 0,
      isLastSuccessful: model.id === this.lastSuccessfulModel
    }));
  }

  // 手动切换模型
  static switchToNextModel(): void {
    this.currentModelIndex = (this.currentModelIndex + 1) % this.FREE_MODELS.length;
  }

  // 切换到指定模型
  static switchToModel(modelId: string): boolean {
    const modelIndex = this.FREE_MODELS.findIndex(model => model.id === modelId);
    if (modelIndex !== -1) {
      this.currentModelIndex = modelIndex;
      return true;
    }
    return false;
  }

  // 重置模型失败计数
  static resetModelFailures(): void {
    this.modelFailureCount.clear();
  }

  // 获取模型健康状态
  static getModelHealth() {
    return {
      totalModels: this.FREE_MODELS.length,
      currentModel: this.getCurrentModelInfo(),
      failedModels: Array.from(this.modelFailureCount.entries())
        .filter(([_, count]) => count > 0)
        .map(([modelId, count]) => ({
          modelId,
          name: this.FREE_MODELS.find(m => m.id === modelId)?.name || modelId,
          failureCount: count
        })),
      lastSuccessful: this.lastSuccessfulModel
    };
  }
}