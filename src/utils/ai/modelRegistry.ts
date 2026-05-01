export interface ModelConfig {
  id: string;        // API 调用时使用的 model 字段
  name: string;      // 界面显示名称
  description: string;
  maxTokens: number;
}

// ─── OpenRouter 免费路由 ──────────────────────────────────────────────────────
// openrouter/free 会自动路由到当前可用的任意免费模型，无需指定具体模型
export const OPENROUTER_FREE_MODELS: ModelConfig[] = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    description: 'OpenRouter 自动路由到可用的免费模型，200K 上下文。',
    maxTokens: 4096,
  },
];

// ─── 各厂商原生 API 模型 ──────────────────────────────────────────────────────
export const DEEPSEEK_MODELS: ModelConfig[] = [
  { id: 'deepseek-chat',     name: 'DeepSeek V3 (chat)',    description: 'DeepSeek 最新对话模型。',   maxTokens: 4096 },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 (reasoner)', description: 'DeepSeek 推理增强模型。', maxTokens: 4096 },
];

export const QWEN_MODELS: ModelConfig[] = [
  { id: 'qwen-max',   name: 'Qwen Max',   description: '通义千问旗舰版，能力最强。',   maxTokens: 2048 },
  { id: 'qwen-plus',  name: 'Qwen Plus',  description: '通义千问增强版，能力均衡。',   maxTokens: 2048 },
  { id: 'qwen-turbo', name: 'Qwen Turbo', description: '通义千问轻量版，速度最快。',   maxTokens: 2048 },
];

export const KIMI_MODELS: ModelConfig[] = [
  { id: 'moonshot-v1-8k',  name: 'Moonshot v1 8k',  description: 'Kimi 8K 上下文版本。',  maxTokens: 2048 },
  { id: 'moonshot-v1-32k', name: 'Moonshot v1 32k', description: 'Kimi 32K 上下文版本。', maxTokens: 2048 },
];

// provider → 模型列表映射
export const PROVIDER_MODELS: Record<string, ModelConfig[]> = {
  builtin: OPENROUTER_FREE_MODELS,
  custom:  OPENROUTER_FREE_MODELS,
  deepseek: DEEPSEEK_MODELS,
  qwen:     QWEN_MODELS,
  kimi:     KIMI_MODELS,
};

// ─── ModelRegistry：管理单个 provider 的模型轮询与失败计数 ──────────────────
export class ModelRegistry {
  private currentIndex = 0;
  private readonly failureCount = new Map<string, number>();
  private lastSuccessful = '';
  private userSelectedModelId: string | null = null;

  constructor(private models: ModelConfig[]) {}

  /** 切换到指定 provider 的模型列表并重置状态 */
  switchProvider(provider: string): void {
    const newModels = PROVIDER_MODELS[provider] ?? OPENROUTER_FREE_MODELS;
    this.models = newModels;
    this.currentIndex = 0;
    this.failureCount.clear();
    this.userSelectedModelId = null;
  }

  get total(): number { return this.models.length; }

  getActiveModel(): ModelConfig { return this.models[this.currentIndex]!; }

  getModelById(modelId: string): ModelConfig | undefined {
    return this.models.find(m => m.id === modelId);
  }

  shouldSkip(modelId: string, threshold = 3): boolean {
    return (this.failureCount.get(modelId) ?? 0) >= threshold;
  }

  advance(): ModelConfig {
    this.currentIndex = (this.currentIndex + 1) % this.models.length;
    return this.getActiveModel();
  }

  setActiveModel(modelId: string): boolean {
    const idx = this.models.findIndex(m => m.id === modelId);
    if (idx === -1) return false;
    this.currentIndex = idx;
    return true;
  }

  /** 若 modelId 不在当前列表中，则追加一条动态条目并激活它 */
  upsertAndActivate(modelId: string): void {
    const existing = this.models.findIndex(m => m.id === modelId);
    if (existing !== -1) {
      this.currentIndex = existing;
      return;
    }
    this.models = [...this.models, { id: modelId, name: modelId, description: '自定义模型', maxTokens: 4096 }];
    this.currentIndex = this.models.length - 1;
  }

  setUserSelectedModel(modelId: string): boolean {
    const ok = this.setActiveModel(modelId);
    if (ok) this.userSelectedModelId = modelId;
    return ok;
  }

  clearUserSelectedModel(): void { this.userSelectedModelId = null; }
  hasUserSelection(): boolean { return !!this.userSelectedModelId; }

  markSuccess(modelId: string): void {
    this.failureCount.set(modelId, 0);
    this.lastSuccessful = modelId;
  }

  markFailure(modelId: string): number {
    const count = (this.failureCount.get(modelId) ?? 0) + 1;
    this.failureCount.set(modelId, count);
    return count;
  }

  resetFailures(): void { this.failureCount.clear(); }
  getFailureCount(modelId: string): number { return this.failureCount.get(modelId) ?? 0; }

  getAllModels() {
    return this.models.map((m, i) => ({
      ...m,
      isActive: i === this.currentIndex,
      failureCount: this.getFailureCount(m.id),
      isLastSuccessful: m.id === this.lastSuccessful,
    }));
  }

  getHealthSnapshot() {
    const cur = this.getActiveModel();
    return {
      totalModels: this.total,
      currentModel: { model: cur.id, name: cur.name, description: cur.description, index: this.currentIndex, total: this.total },
      failedModels: Array.from(this.failureCount.entries())
        .filter(([, c]) => c > 0)
        .map(([id, c]) => ({ modelId: id, name: this.getModelById(id)?.name ?? id, failureCount: c })),
      lastSuccessful: this.lastSuccessful,
    };
  }
}

export interface ModelHealthSnapshot {
  totalModels: number;
  currentModel: { model: string; name: string; description: string; index: number; total: number };
  failedModels: Array<{ modelId: string; name: string; failureCount: number }>;
  lastSuccessful: string;
}

// 全局单例，默认使用 OpenRouter 免费模型
export const modelRegistry = new ModelRegistry(OPENROUTER_FREE_MODELS);

export type ModelRegistryType = typeof modelRegistry;
