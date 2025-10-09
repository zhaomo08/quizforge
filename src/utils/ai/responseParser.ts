import { Question } from '@/types';

interface RawQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: string;
  // 兼容字段
  title?: string;
  prompt?: string;
  stem?: string;
  问题?: string;
  题目?: string;
  question_text?: string;
  questionText?: string;
  answer?: string | number; // 有些模型用 answer 字段
}

const stripMarkdownFence = (payload: string): string => {
  let cleaned = payload.trim();

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```$/, '');
  }

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/, '').replace(/\n?```$/, '');
  }

  return cleaned;
};

const isolateJsonArray = (payload: string): string => {
  const start = payload.indexOf('[');
  const end = payload.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) {
    return payload;
  }

  return payload.substring(start, end + 1);
};

// 尝试修复一些常见的小问题：
// - 末尾多了逗号
// - 引号使用中文全角或混用
// - 带有多余注释/提示文本
const tryFixCommonIssues = (payload: string): string => {
  let s = payload
    .replace(/\uFF1A/g, ':') // 全角冒号
    .replace(/\u201c|\u201d|“|”/g, '"')
    .replace(/\u2018|\u2019|‘|’/g, '\'')
    .replace(/,\s*([\]\}])/g, '$1'); // 尾逗号

  // 移除行内注释 // ...
  s = s
    .split('\n')
    .map((line) => line.replace(/\s*\/\/.*$/, ''))
    .join('\n');

  return s.trim();
};

const ensureValidArray = (data: unknown): RawQuestion[] => {
  if (!Array.isArray(data)) {
    throw new Error('模型返回的数据不是数组格式');
  }

  return data as RawQuestion[];
};

const normalizeQuestionText = (q: RawQuestion): string => {
  const candidates = [
    q.question,
    q.title,
    q.prompt,
    q.stem,
    (q as any)['问题'],
    (q as any)['题目'],
    (q as any).question_text,
    (q as any).questionText,
  ].filter((v) => typeof v === 'string') as string[];

  const raw = candidates[0] ?? '';
  // 去掉前缀编号/"第1题"/数字点等
  return raw
    .replace(/^第\s*\d+\s*[题|问]\s*[:：\.)]?\s*/u, '')
    .replace(/^\s*\d+\s*[\.)、]\s*/u, '')
    .trim();
};

const stripOptionPrefix = (opt: string, index: number): string => {
  const letter = String.fromCharCode(65 + index);
  return opt
    .replace(new RegExp(`^\s*${letter}\s*[\.|。|、|:|：|\)|\]›\-]+\s*`, 'i'), '')
    .trim();
};

const normalizeCorrectAnswer = (q: RawQuestion): number => {
  let ca: any = (q as any).correctAnswer;
  if (typeof ca === 'undefined' || ca === null) ca = (q as any).answer;

  // 字母 A-D
  if (typeof ca === 'string') {
    const s = ca.trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(s)) return s.charCodeAt(0) - 65;
    const asNum = Number(s);
    if (!Number.isNaN(asNum)) ca = asNum; // 继续走数字逻辑
  }
  if (typeof ca === 'number') {
    if (ca >= 0 && ca <= 3) return ca;
    if (ca >= 1 && ca <= 4) return ca - 1; // 1-4 改为 0-3
  }
  return -1;
};

const validateQuestionShape = (question: RawQuestion, index: number, modelName: string): void => {
  const stem = normalizeQuestionText(question);
  if (!stem || stem.trim().length === 0) {
    throw new Error(`模型 ${modelName} 生成的第 ${index + 1} 题缺少题干`);
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`模型 ${modelName} 生成的第 ${index + 1} 题必须包含 4 个选项`);
  }

  const ca = normalizeCorrectAnswer(question);
  if (ca < 0 || ca > 3) {
    throw new Error(`模型 ${modelName} 生成的第 ${index + 1} 题正确答案索引无效`);
  }
};

export const parseModelResponse = (
  content: string,
  {
    category,
    difficulty,
    modelName,
  }: {
    category: string;
    difficulty: string;
    modelName: string;
  }
): Question[] => {
  if (!content || content.trim().length === 0) {
    throw new Error(`模型 ${modelName} 返回空内容`);
  }

  const stripped = stripMarkdownFence(content);
  const isolated = isolateJsonArray(stripped);

  let parsed: RawQuestion[];

  try {
    // 第一轮直接 parse
    const json = JSON.parse(isolated);
    parsed = ensureValidArray(json);
  } catch (error) {
    // 第二轮尝试修复常见问题后再解析
    try {
      const fixed = tryFixCommonIssues(isolated);
      const json2 = JSON.parse(fixed);
      parsed = ensureValidArray(json2);
    } catch (error2) {
      console.error('JSON解析失败，原始响应:', isolated);
      throw new Error(`模型 ${modelName} 返回的 JSON 格式无效，请重试`);
    }
  }

  if (parsed.length === 0) {
    throw new Error(`模型 ${modelName} 没有生成任何题目，请重试`);
  }

  return parsed.map((item, index): Question => {
    validateQuestionShape(item, index, modelName);

    // 规范化题干
    const stem = normalizeQuestionText(item);
    // 规范化选项：去掉 A./A、 等前缀
    const cleanedOptions = (item.options || []).map((opt, i) => stripOptionPrefix(String(opt ?? ''), i));
    // 规范化正确答案
    const ca = normalizeCorrectAnswer(item);

    return {
      id: `ai_${category}_${Date.now()}_${index}`,
      category,
      question: stem,
      options: cleanedOptions,
      correctAnswer: ca,
      explanation: item.explanation || '暂无解释',
      difficulty: item.difficulty || difficulty,
      createdAt: new Date().toISOString(),
    };
  });
};
