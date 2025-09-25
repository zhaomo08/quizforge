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

const freeModels: ModelConfig[] = [
  {
    id: 'deepseek/deepseek-chat-v3.1:free',
    name: 'DeepSeek V3.1',
    description: 'DeepSeek免费模型',
    maxTokens: 4000,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    description: 'Google免费模型',
    maxTokens: 3500,
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small',
    description: 'Mistral免费模型',
    maxTokens: 3000,
  },
];

export const modelRegistry = new ModelRegistry(freeModels);

export type ModelRegistryType = typeof modelRegistry;
