export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
}

export interface ModelHealthSnapshot {
  totalModels: number;
  currentModel: {
    model: string;
    name: string;
    description: string;
    index: number;
    total: number;
  };
  failedModels: Array<{
    modelId: string;
    name: string;
    failureCount: number;
  }>;
  lastSuccessful: string;
}

class ModelRegistry {
  private currentIndex = 0;
  private readonly failureCount = new Map<string, number>();
  private lastSuccessful = '';
  private userSelectedModelId: string | null = null;

  constructor(private readonly models: ModelConfig[]) {}

  get total(): number {
    return this.models.length;
  }

  getActiveModel(): ModelConfig {
    return this.models[this.currentIndex];
  }

  getModelById(modelId: string): ModelConfig | undefined {
    return this.models.find(model => model.id === modelId);
  }

  shouldSkip(modelId: string, threshold = 3): boolean {
    return (this.failureCount.get(modelId) || 0) >= threshold;
  }

  advance(): ModelConfig {
    this.currentIndex = (this.currentIndex + 1) % this.models.length;
    return this.getActiveModel();
  }

  setActiveModel(modelId: string): boolean {
    const targetIndex = this.models.findIndex(model => model.id === modelId);
    if (targetIndex === -1) {
      return false;
    }

    this.currentIndex = targetIndex;
    return true;
  }

  // 标记用户手动选择的模型，并切换到该模型
  setUserSelectedModel(modelId: string): boolean {
    const ok = this.setActiveModel(modelId);
    if (ok) {
      this.userSelectedModelId = modelId;
    }
    return ok;
  }

  clearUserSelectedModel(): void {
    this.userSelectedModelId = null;
  }

  hasUserSelection(): boolean {
    return !!this.userSelectedModelId;
  }

  markSuccess(modelId: string): void {
    this.failureCount.set(modelId, 0);
    this.lastSuccessful = modelId;
  }

  markFailure(modelId: string): number {
    const currentFailures = (this.failureCount.get(modelId) || 0) + 1;
    this.failureCount.set(modelId, currentFailures);
    return currentFailures;
  }

  resetFailures(): void {
    this.failureCount.clear();
  }

  getFailureCount(modelId: string): number {
    return this.failureCount.get(modelId) || 0;
  }

  getHealthSnapshot(): ModelHealthSnapshot {
    const currentModel = this.getActiveModel();

    return {
      totalModels: this.total,
      currentModel: {
        model: currentModel.id,
        name: currentModel.name,
        description: currentModel.description,
        index: this.currentIndex,
        total: this.total,
      },
      failedModels: Array.from(this.failureCount.entries())
        .filter(([, count]) => count > 0)
        .map(([modelId, count]) => ({
          modelId,
          name: this.getModelById(modelId)?.name || modelId,
          failureCount: count,
        })),
      lastSuccessful: this.lastSuccessful,
    };
  }

  getAllModels(): Array<ModelConfig & {
    isActive: boolean;
    failureCount: number;
    isLastSuccessful: boolean;
  }> {
    return this.models.map((model, index) => ({
      ...model,
      isActive: index === this.currentIndex,
      failureCount: this.getFailureCount(model.id),
      isLastSuccessful: model.id === this.lastSuccessful,
    }));
  }
}

// 推荐优先顺序：中文质量/稳定性优先，其次速度与推理能力
const freeModels: ModelConfig[] = [
  {
    // 用户指定：DeepSeek 3.1（免费档）。注意：若该 slug 在 OpenRouter 调整，请在此处更新。
    id: 'deepseek/deepseek-chat-v3.1:free',
    name: 'DeepSeek 3.1 (free)',
    description: '中文与推理均衡，作为首选模型。',
    maxTokens: 2048,
  },
  {
    id: 'qwen/qwen3-8b:free',
    name: 'Qwen3 8B (free)',
    description: '中文表现稳健、速度快，适合题干/选项批量生成。',
    maxTokens: 1536,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (free)',
    description: '轻量快速，英文/通用任务稳定输出。',
    maxTokens: 1536,
  },
  {
    id: 'meta-llama/llama-3.3-8b-instruct:free',
    name: 'Llama 3.3 8B Instruct (free)',
    description: '响应迅速、上下文 128K，作为强健备选。',
    maxTokens: 1536,
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 0528 (free)',
    description: '强化推理场景（解析/讲解）使用，速度相对较慢。',
    maxTokens: 2048,
  },
];

export const modelRegistry = new ModelRegistry(freeModels);

export type ModelRegistryType = typeof modelRegistry;
