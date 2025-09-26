import { Question } from '@/types';

interface RawQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: string;
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

const validateQuestionShape = (question: RawQuestion, index: number, modelName: string): void => {
  if (!question.question) {
    throw new Error(`模型 ${modelName} 生成的第 ${index + 1} 题缺少题干`);
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`模型 ${modelName} 生成的第 ${index + 1} 题必须包含 4 个选项`);
  }

  if (
    typeof question.correctAnswer !== 'number' ||
    question.correctAnswer < 0 ||
    question.correctAnswer > 3
  ) {
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

    return {
      id: `ai_${category}_${Date.now()}_${index}`,
      category,
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation || '暂无解释',
      difficulty: item.difficulty || difficulty,
      createdAt: new Date().toISOString(),
    };
  });
};
