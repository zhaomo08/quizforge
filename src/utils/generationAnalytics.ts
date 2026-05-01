import { Question } from '@/types';
import { storage } from './storage';

export interface GenerationRecord {
  id: string;
  timestamp: string;
  category: string;
  difficulty: string;
  requestedCount: number;
  actualCount: number;
  modelUsed: string;
  generationTime: number; // 毫秒
  qualityScore?: number;
  userRating?: number;
  duplicateCount?: number;
}

export interface GenerationInsight {
  category: string;
  totalGenerated: number;
  averageQuality: number;
  successRate: number;
  preferredDifficulty: string;
  lastGenerated: string;
  duplicateRate: number;
  recommendedCount: number;
}

export interface SmartRecommendation {
  type: 'category' | 'difficulty' | 'count' | 'timing';
  title: string;
  description: string;
  value: string | number;
  confidence: number; // 0-1
  reason: string;
}

const STORAGE_KEY = 'generation_records';

export class GenerationAnalytics {
  // 记录生成历史
  static recordGeneration(record: Omit<GenerationRecord, 'id' | 'timestamp'>): void {
    const fullRecord: GenerationRecord = {
      ...record,
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const records = this.getGenerationRecords();
    records.push(fullRecord);
    
    // 只保留最近100条记录
    if (records.length > 100) {
      records.splice(0, records.length - 100);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // 获取生成记录
  static getGenerationRecords(): GenerationRecord[] {
    const records = localStorage.getItem(STORAGE_KEY);
    return records ? JSON.parse(records) : [];
  }

  // 更新生成记录的质量评分
  static updateQualityScore(recordId: string, qualityScore: number, userRating?: number): void {
    const records = this.getGenerationRecords();
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex !== -1) {
      records[recordIndex]!.qualityScore = qualityScore;
      if (userRating !== undefined) {
        records[recordIndex]!.userRating = userRating;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }

  // 检测重复题目
  static detectDuplicates(newQuestions: Question[]): {
    duplicates: Array<{ newIndex: number; existingQuestion: Question; similarity: number }>;
    duplicateCount: number;
  } {
    const existingQuestions = storage.getQuestions();
    const duplicates: Array<{ newIndex: number; existingQuestion: Question; similarity: number }> = [];

    newQuestions.forEach((newQ, index) => {
      existingQuestions.forEach(existingQ => {
        if (newQ.category === existingQ.category) {
          const similarity = this.calculateSimilarity(newQ.question, existingQ.question);
          if (similarity > 0.8) { // 80%相似度认为是重复
            duplicates.push({
              newIndex: index,
              existingQuestion: existingQ,
              similarity
            });
          }
        }
      });
    });

    return {
      duplicates,
      duplicateCount: duplicates.length
    };
  }

  // 计算文本相似度
  private static calculateSimilarity(text1: string, text2: string): number {
    const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    if (norm1 === norm2) return 1;

    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  // 评估题目质量
  static evaluateQuestionQuality(question: Question): number {
    let score = 0;
    
    // 题目长度合理性 (20分)
    const questionLength = question.question.length;
    if (questionLength >= 20 && questionLength <= 200) {
      score += 20;
    } else if (questionLength >= 10 && questionLength <= 300) {
      score += 15;
    } else {
      score += 5;
    }

    // 选项质量 (30分)
    const optionLengths = question.options.map(opt => opt.length);
    const avgOptionLength = optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length;
    const lengthVariance = optionLengths.reduce((sum, len) => sum + Math.pow(len - avgOptionLength, 2), 0) / optionLengths.length;
    
    if (avgOptionLength >= 5 && avgOptionLength <= 50 && lengthVariance < 100) {
      score += 30;
    } else if (avgOptionLength >= 3 && avgOptionLength <= 80) {
      score += 20;
    } else {
      score += 10;
    }

    // 解释质量 (30分)
    const explanationLength = question.explanation?.length || 0;
    if (explanationLength >= 50 && explanationLength <= 500) {
      score += 30;
    } else if (explanationLength >= 20 && explanationLength <= 800) {
      score += 20;
    } else if (explanationLength >= 10) {
      score += 10;
    }

    // 选项区分度 (20分)
    const uniqueOptions = new Set(question.options.map(opt => opt.toLowerCase().trim()));
    if (uniqueOptions.size === 4) {
      score += 20;
    } else if (uniqueOptions.size === 3) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  // 获取类别洞察
  static getCategoryInsights(): GenerationInsight[] {
    const records = this.getGenerationRecords();

    const categories = [...new Set(records.map(r => r.category))];

    return categories.map(category => {
      const categoryRecords = records.filter(r => r.category === category);

      // 计算平均质量
      const qualityScores = categoryRecords
        .map(r => r.qualityScore)
        .filter(score => score !== undefined) as number[];
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : 0;

      // 计算成功率
      const successfulGenerations = categoryRecords.filter(r => r.actualCount > 0).length;
      const successRate = categoryRecords.length > 0 ? successfulGenerations / categoryRecords.length : 0;

      // 分析偏好难度
      const difficultyCount = categoryRecords.reduce((acc, r) => {
        acc[r.difficulty] = (acc[r.difficulty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const preferredDifficulty = Object.entries(difficultyCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'medium';

      // 计算重复率
      const totalDuplicates = categoryRecords.reduce((sum, r) => sum + (r.duplicateCount || 0), 0);
      const totalGenerated = categoryRecords.reduce((sum, r) => sum + r.actualCount, 0);
      const duplicateRate = totalGenerated > 0 ? totalDuplicates / totalGenerated : 0;

      // 推荐生成数量
      const avgRequestedCount = categoryRecords.length > 0 
        ? categoryRecords.reduce((sum, r) => sum + r.requestedCount, 0) / categoryRecords.length 
        : 10;
      const recommendedCount = Math.max(5, Math.min(30, Math.round(avgRequestedCount)));

      return {
        category,
        totalGenerated: totalGenerated,
        averageQuality,
        successRate,
        preferredDifficulty,
        lastGenerated: categoryRecords.length > 0
          ? categoryRecords[categoryRecords.length - 1]!.timestamp
          : '',
        duplicateRate,
        recommendedCount
      };
    });
  }

  // 生成智能推荐
  static generateSmartRecommendations(): SmartRecommendation[] {
    const records = this.getGenerationRecords();
    const questions = storage.getQuestions();
    const wrongAnswers = storage.getWrongAnswers();
    const recommendations: SmartRecommendation[] = [];

    if (records.length === 0) {
      return [{
        type: 'category',
        title: '开始你的第一次生成',
        description: '建议从Java或Python开始，这些是最受欢迎的面试类别',
        value: 'java',
        confidence: 0.8,
        reason: '新用户推荐'
      }];
    }

    // 分析最近的生成模式
    const recentRecords = records.slice(-10);
    const categoryFreq = recentRecords.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 推荐最少生成的类别
    const allCategories = ['java', 'python', 'javascript', 'database', 'algorithm', 'system-design', 'operating-system'];
    const leastGeneratedCategory = allCategories.find(cat => !categoryFreq[cat]) || 
      Object.entries(categoryFreq).sort(([,a], [,b]) => a - b)[0]?.[0];

    if (leastGeneratedCategory) {
      recommendations.push({
        type: 'category',
        title: '尝试新的知识领域',
        description: `建议生成${this.getCategoryName(leastGeneratedCategory)}题目，丰富你的题库`,
        value: leastGeneratedCategory,
        confidence: 0.7,
        reason: '知识面平衡'
      });
    }

    // 基于错题分析推荐难度
    if (wrongAnswers.length > 0) {
      const wrongByCategory = wrongAnswers.reduce((acc, wa) => {
        const question = questions.find(q => q.id === wa.questionId);
        if (question) {
          acc[question.category] = (acc[question.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const mostWrongCategory = Object.entries(wrongByCategory)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostWrongCategory && mostWrongCategory[1] > 2) {
        recommendations.push({
          type: 'difficulty',
          title: '加强薄弱环节',
          description: `在${this.getCategoryName(mostWrongCategory[0])}方面错题较多，建议生成简单难度题目加强练习`,
          value: 'easy',
          confidence: 0.9,
          reason: '错题分析'
        });
      }
    }

    // 推荐最佳生成数量
    const avgSuccessfulCount = records
      .filter(r => r.actualCount > 0)
      .reduce((sum, r) => sum + r.actualCount, 0) / Math.max(1, records.filter(r => r.actualCount > 0).length);

    if (avgSuccessfulCount > 0) {
      const recommendedCount = Math.round(avgSuccessfulCount * 1.2); // 比平均值多20%
      recommendations.push({
        type: 'count',
        title: '优化生成数量',
        description: `基于你的历史数据，建议每次生成${recommendedCount}道题目`,
        value: Math.min(30, Math.max(5, recommendedCount)),
        confidence: 0.6,
        reason: '历史数据分析'
      });
    }

    // 时间推荐
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 9 && hour <= 11) {
      recommendations.push({
        type: 'timing',
        title: '最佳学习时间',
        description: '上午是学习新知识的黄金时间，建议生成有挑战性的题目',
        value: 'hard',
        confidence: 0.5,
        reason: '时间优化'
      });
    } else if (hour >= 14 && hour <= 16) {
      recommendations.push({
        type: 'timing',
        title: '下午复习时间',
        description: '下午适合复习和巩固，建议生成中等难度题目',
        value: 'medium',
        confidence: 0.5,
        reason: '时间优化'
      });
    }

    return recommendations.slice(0, 3); // 最多返回3个推荐
  }

  private static getCategoryName(categoryId: string): string {
    const categoryMap: Record<string, string> = {
      'java': 'Java',
      'python': 'Python',
      'javascript': 'JavaScript',
      'database': '数据库',
      'algorithm': '算法与数据结构',
      'system-design': '系统设计',
      'operating-system': '操作系统',
    };
    return categoryMap[categoryId] || categoryId;
  }

  // 获取生成统计
  static getGenerationStats() {
    const records = this.getGenerationRecords();
    const questions = storage.getQuestions();
    
    if (records.length === 0) {
      return {
        totalGenerations: 0,
        totalQuestions: questions.length,
        averageQuality: 0,
        successRate: 0,
        mostUsedModel: '',
        averageGenerationTime: 0
      };
    }

    const totalGenerations = records.length;
    const totalQuestions = records.reduce((sum, r) => sum + r.actualCount, 0);
    
    const qualityScores = records
      .map(r => r.qualityScore)
      .filter(score => score !== undefined) as number[];
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0;

    const successfulGenerations = records.filter(r => r.actualCount > 0).length;
    const successRate = successfulGenerations / totalGenerations;

    const modelUsage = records.reduce((acc, r) => {
      acc[r.modelUsed] = (acc[r.modelUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostUsedModel = Object.entries(modelUsage)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const averageGenerationTime = records.reduce((sum, r) => sum + r.generationTime, 0) / records.length;

    return {
      totalGenerations,
      totalQuestions,
      averageQuality,
      successRate,
      mostUsedModel,
      averageGenerationTime
    };
  }

  // 清理旧记录
  static cleanupOldRecords(daysToKeep: number = 30): void {
    const records = this.getGenerationRecords();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredRecords = records.filter(record => 
      new Date(record.timestamp) > cutoffDate
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
  }
}