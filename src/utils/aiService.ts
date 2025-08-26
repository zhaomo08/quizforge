import { Question } from '@/types';

export interface AIGenerateRequest {
  category: string;
  count: number;
  difficulty?: string;
  apiKey: string;
}

export class AIService {
  private static async callOpenRouter(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free', // ✅ 指定 OpenRouter 模型
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Generate high-quality interview questions with clear explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenRouter API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  static async generateQuestions({
    category,
    count,
    difficulty = 'medium',
    apiKey,
  }: AIGenerateRequest): Promise<Question[]> {
    const prompt = `Generate ${count} ${difficulty} level ${category} interview questions in the following JSON format:

[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this is correct and why other options are wrong",
    "difficulty": "${difficulty}"
  }
]

Requirements:
- Questions should be practical and commonly asked in ${category} interviews
- Each question should have exactly 4 options (A, B, C, D)
- correctAnswer should be the index (0-3) of the correct option
- Provide detailed explanations
- Cover different aspects of ${category}
- Make sure questions are clear and unambiguous

Return only valid JSON without any additional text or markdown formatting.`;

    try {
      const response = await this.callOpenRouter(prompt, apiKey);

      // 清理 JSON 响应
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const questionsData = JSON.parse(cleanedResponse);

      const questions: Question[] = questionsData.map((q: any, index: number) => ({
        id: `ai_${category}_${Date.now()}_${index}`,
        category,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || difficulty,
        createdAt: new Date().toISOString(),
      }));

      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to generate questions: ${error.message}`
          : 'Failed to generate questions'
      );
    }
  }

  static validateApiKey(apiKey: string): boolean {
    // ⚠️ OpenRouter 的 key 不一定是 "sk-" 开头，这里最好放宽规则
    return typeof apiKey === 'string' && apiKey.length > 20;
  }
}