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
    const json = JSON.parse(isolated);
    parsed = ensureValidArray(json);
  } catch (error) {
    console.error('JSON解析失败，原始响应:', isolated);
    throw new Error(`模型 ${modelName} 返回的 JSON 格式无效，请重试`);
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
