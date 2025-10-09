// 安全数组访问工具，配合 noUncheckedIndexedAccess 降低重复判空
export function safeFirst<T>(arr: readonly T[] | null | undefined): T | undefined {
  return arr && arr.length > 0 ? arr[0] : undefined;
}

export function safeLast<T>(arr: readonly T[] | null | undefined): T | undefined {
  return arr && arr.length > 0 ? arr[arr.length - 1] : undefined;
}

export function atOrUndefined<T>(arr: readonly T[] | null | undefined, index: number): T | undefined {
  return arr && index >= 0 && index < arr.length ? arr[index] : undefined;
}

export function assertPresent<T>(value: T | null | undefined, message?: string): T {
  if (value == null) throw new Error(message || 'Expected value to be present');
  return value;
}