import { TestResult, Question } from '@/types';
import { storage } from './storage';

export interface LearningPattern {
  strongAreas: string[];
  weakAreas: string[];
  improvementTrend: 'improving' | 'stable' | 'declining';
  recommendedFocus: string[];
  studyTime: number; // 建议学习时间（分钟）
}

export interface KnowledgePoint {
  id: string;
  name: string;
  category: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastAttempt: string;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetAccuracy: number;
  currentAccuracy: number;
  deadline: string;
  category: string;
  isCompleted: boolean;
  progress: number;
}

export interface StudyRecommendation {
  type: 'practice' | 'review' | 'learn' | 'rest';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  category?: string;
  action?: () => void;
}

export class LearningAnalytics {
  
  /**
   * 分析学习模式和趋势
   */
  static analyzeLearningPattern(userId: string = 'default'): LearningPattern {
    const results = storage.getTestResults();
    const recentResults = results.slice(-10); // 最近10次测试
    
    if (recentResults.length === 0) {
      return {
        strongAreas: [],
        weakAreas: [],
        improvementTrend: 'stable',
        recommendedFocus: [],
        studyTime: 30
      };
    }

    // 分析强弱项
    const categoryPerformance = this.analyzeCategoryPerformance(recentResults);
    const strongAreas = Object.entries(categoryPerformance)
      .filter(([_, score]) => score >= 80)
      .map(([category]) => category);
    
    const weakAreas = Object.entries(categoryPerformance)
      .filter(([_, score]) => score < 60)
      .map(([category]) => category);

    // 分析趋势
    const improvementTrend = this.calculateImprovementTrend(recentResults);
    
    // 推荐学习重点
    const recommendedFocus = this.generateRecommendedFocus(weakAreas, categoryPerformance);
    
    // 建议学习时间
    const studyTime = this.calculateRecommendedStudyTime(weakAreas.length, improvementTrend);

    return {
      strongAreas,
      weakAreas,
      improvementTrend,
      recommendedFocus,
      studyTime
    };
  }

  /**
   * 分析各类别表现
   */
  private static analyzeCategoryPerformance(results: TestResult[]): Record<string, number> {
    const categoryStats: Record<string, { total: number; correct: number }> = {};
    
    results.forEach(result => {
      if (!categoryStats[result.category]) {
        categoryStats[result.category] = { total: 0, correct: 0 };
      }
      categoryStats[result.category].total += result.totalQuestions;
      categoryStats[result.category].correct += result.correctAnswers;
    });

    const categoryPerformance: Record<string, number> = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      categoryPerformance[category] = Math.round((stats.correct / stats.total) * 100);
    });

    return categoryPerformance;
  }

  /**
   * 计算进步趋势
   */
  private static calculateImprovementTrend(results: TestResult[]): 'improving' | 'stable' | 'declining' {
    if (results.length < 3) return 'stable';
    
    const recent = results.slice(-3);
    const scores = recent.map(r => r.score);
    
    const trend = scores[2] - scores[0];
    
    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }

  /**
   * 生成推荐学习重点
   */
  private static generateRecommendedFocus(weakAreas: string[], categoryPerformance: Record<string, number>): string[] {
    const focus: string[] = [];
    
    // 优先关注最弱的领域
    const sortedWeak = weakAreas.sort((a, b) => 
      (categoryPerformance[a] || 0) - (categoryPerformance[b] || 0)
    );
    
    focus.push(...sortedWeak.slice(0, 2)); // 最多关注2个弱项
    
    // 如果没有明显弱项，关注中等表现的领域
    if (focus.length === 0) {
      const mediumAreas = Object.entries(categoryPerformance)
        .filter(([_, score]) => score >= 60 && score < 80)
        .sort(([_, a], [__, b]) => a - b)
        .map(([category]) => category);
      
      focus.push(...mediumAreas.slice(0, 1));
    }
    
    return focus;
  }

  /**
   * 计算建议学习时间
   */
  private static calculateRecommendedStudyTime(weakAreasCount: number, trend: string): number {
    let baseTime = 20; // 基础时间20分钟
    
    // 根据弱项数量调整
    baseTime += weakAreasCount * 10;
    
    // 根据趋势调整
    if (trend === 'declining') baseTime += 15;
    if (trend === 'improving') baseTime -= 5;
    
    return Math.max(15, Math.min(60, baseTime)); // 限制在15-60分钟
  }

  /**
   * 获取知识点掌握情况
   */
  static getKnowledgePoints(): KnowledgePoint[] {
    const results = storage.getTestResults();
    const knowledgeMap = new Map<string, KnowledgePoint>();
    
    results.forEach(result => {
      result.questions.forEach((question, index) => {
        const isCorrect = result.userAnswers[index] === question.correctAnswer;
        const pointId = this.extractKnowledgePointId(question);
        
        if (knowledgeMap.has(pointId)) {
          const point = knowledgeMap.get(pointId)!;
          point.totalAttempts++;
          if (isCorrect) point.correctAttempts++;
          point.accuracy = (point.correctAttempts / point.totalAttempts) * 100;
          point.lastAttempt = result.completedAt;
        } else {
          knowledgeMap.set(pointId, {
            id: pointId,
            name: this.extractKnowledgePointName(question),
            category: result.category,
            totalAttempts: 1,
            correctAttempts: isCorrect ? 1 : 0,
            accuracy: isCorrect ? 100 : 0,
            averageTime: (result.timeSpent || 0) / result.totalQuestions,
            difficulty: 'medium',
            lastAttempt: result.completedAt
          });
        }
      });
    });
    
    return Array.from(knowledgeMap.values())
      .sort((a, b) => b.totalAttempts - a.totalAttempts);
  }

  /**
   * 提取知识点ID
   */
  private static extractKnowledgePointId(question: Question): string {
    // 简化版本：使用题目的前50个字符作为知识点标识
    return question.question.substring(0, 50).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
  }

  /**
   * 提取知识点名称
   */
  private static extractKnowledgePointName(question: Question): string {
    // 简化版本：从题目中提取关键词
    const keywords = question.question.match(/[\u4e00-\u9fa5]{2,8}/g) || [];
    return keywords.slice(0, 2).join(' ') || '未知知识点';
  }

  /**
   * 获取学习目标
   */
  static getLearningGoals(): LearningGoal[] {
    const saved = storage.getLearningGoals();
    if (saved.length > 0) return saved;
    
    // 默认目标
    return [
      {
        id: 'java-mastery',
        title: 'Java基础掌握',
        description: '在Java基础测试中达到80%以上正确率',
        targetAccuracy: 80,
        currentAccuracy: this.getCurrentAccuracy('java'),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'java',
        isCompleted: false,
        progress: 0
      },
      {
        id: 'algorithm-improvement',
        title: '算法能力提升',
        description: '提升算法与数据结构的理解和应用能力',
        targetAccuracy: 75,
        currentAccuracy: this.getCurrentAccuracy('algorithm'),
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'algorithm',
        isCompleted: false,
        progress: 0
      }
    ];
  }

  /**
   * 获取当前准确率
   */
  private static getCurrentAccuracy(category: string): number {
    const results = storage.getTestResults()
      .filter(r => r.category === category)
      .slice(-5); // 最近5次
    
    if (results.length === 0) return 0;
    
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correctAnswers, 0);
    
    return Math.round((totalCorrect / totalQuestions) * 100);
  }

  /**
   * 更新学习目标进度
   */
  static updateLearningGoalProgress(goalId: string, newAccuracy: number): void {
    const goals = this.getLearningGoals();
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
      goal.currentAccuracy = newAccuracy;
      goal.progress = Math.min(100, (newAccuracy / goal.targetAccuracy) * 100);
      goal.isCompleted = newAccuracy >= goal.targetAccuracy;
      
      storage.saveLearningGoals(goals);
    }
  }

  /**
   * 生成学习建议
   */
  static generateStudyRecommendations(): StudyRecommendation[] {
    const pattern = this.analyzeLearningPattern();
    const knowledgePoints = this.getKnowledgePoints();
    const recommendations: StudyRecommendation[] = [];

    // 基于弱项生成练习建议
    pattern.weakAreas.forEach(area => {
      recommendations.push({
        type: 'practice',
        title: `加强${this.getCategoryName(area)}练习`,
        description: `你在${this.getCategoryName(area)}方面还有提升空间，建议多做相关练习题`,
        priority: 'high',
        estimatedTime: 25,
        category: area
      });
    });

    // 基于错误率高的知识点生成复习建议
    const weakKnowledgePoints = knowledgePoints
      .filter(kp => kp.accuracy < 60 && kp.totalAttempts >= 3)
      .slice(0, 2);
    
    weakKnowledgePoints.forEach(kp => {
      recommendations.push({
        type: 'review',
        title: `复习${kp.name}`,
        description: `该知识点正确率较低(${Math.round(kp.accuracy)}%)，建议重点复习`,
        priority: 'high',
        estimatedTime: 15,
        category: kp.category
      });
    });

    // 基于趋势生成建议
    if (pattern.improvementTrend === 'declining') {
      recommendations.push({
        type: 'rest',
        title: '适当休息调整',
        description: '最近表现有所下降，建议适当休息，调整学习状态',
        priority: 'medium',
        estimatedTime: 0
      });
    }

    // 基于强项生成进阶建议
    if (pattern.strongAreas.length > 0) {
      recommendations.push({
        type: 'learn',
        title: `深入学习${this.getCategoryName(pattern.strongAreas[0])}`,
        description: '你在这个领域表现优秀，可以尝试更高难度的内容',
        priority: 'low',
        estimatedTime: 30,
        category: pattern.strongAreas[0]
      });
    }

    return recommendations.slice(0, 4); // 最多返回4个建议
  }

  /**
   * 获取类别中文名称
   */
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

  /**
   * 计算学习效率
   */
  static calculateLearningEfficiency(): {
    efficiency: number;
    timePerQuestion: number;
    accuracyTrend: number;
    suggestions: string[];
  } {
    const results = storage.getTestResults().slice(-10);
    
    if (results.length === 0) {
      return {
        efficiency: 0,
        timePerQuestion: 0,
        accuracyTrend: 0,
        suggestions: ['开始第一次测试来获取学习效率分析']
      };
    }

    // 计算平均每题用时
    const totalTime = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const timePerQuestion = totalTime / totalQuestions;

    // 计算准确率趋势
    const recentAccuracy = results.slice(-3).reduce((sum, r) => sum + r.score, 0) / Math.min(3, results.length);
    const earlierAccuracy = results.slice(0, 3).reduce((sum, r) => sum + r.score, 0) / Math.min(3, results.length);
    const accuracyTrend = recentAccuracy - earlierAccuracy;

    // 计算效率分数 (准确率 / 时间 * 100)
    const avgAccuracy = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const efficiency = Math.round((avgAccuracy / Math.max(timePerQuestion, 30)) * 100);

    // 生成建议
    const suggestions: string[] = [];
    if (timePerQuestion > 90) {
      suggestions.push('答题速度较慢，建议提高解题效率');
    }
    if (accuracyTrend < -5) {
      suggestions.push('准确率有下降趋势，建议加强基础复习');
    }
    if (efficiency > 80) {
      suggestions.push('学习效率很高，继续保持！');
    } else if (efficiency < 40) {
      suggestions.push('建议平衡准确率和答题速度');
    }

    return {
      efficiency: Math.max(0, Math.min(100, efficiency)),
      timePerQuestion: Math.round(timePerQuestion),
      accuracyTrend: Math.round(accuracyTrend * 10) / 10,
      suggestions
    };
  }

  /**
   * 获取个性化学习路径
   */
  static getPersonalizedLearningPath(): {
    currentLevel: string;
    nextMilestone: string;
    recommendedOrder: string[];
    estimatedTime: string;
  } {
    const pattern = this.analyzeLearningPattern();
    const results = storage.getTestResults();
    
    // 确定当前水平
    const avgScore = results.length > 0 
      ? results.slice(-5).reduce((sum, r) => sum + r.score, 0) / Math.min(5, results.length)
      : 0;
    
    let currentLevel = '初学者';
    if (avgScore >= 90) currentLevel = '专家';
    else if (avgScore >= 80) currentLevel = '高级';
    else if (avgScore >= 70) currentLevel = '中级';
    else if (avgScore >= 60) currentLevel = '初级';

    // 推荐学习顺序
    const allCategories = ['java', 'python', 'javascript', 'database', 'algorithm', 'system-design', 'operating-system'];
    const completedCategories = pattern.strongAreas;
    const inProgressCategories = pattern.recommendedFocus;
    const remainingCategories = allCategories.filter(
      cat => !completedCategories.includes(cat) && !inProgressCategories.includes(cat)
    );

    const recommendedOrder = [
      ...inProgressCategories,
      ...remainingCategories,
      ...completedCategories
    ];

    // 下一个里程碑
    let nextMilestone = '完成第一次测试';
    if (results.length > 0) {
      if (pattern.weakAreas.length > 0) {
        nextMilestone = `提升${this.getCategoryName(pattern.weakAreas[0])}到70%准确率`;
      } else if (avgScore < 90) {
        nextMilestone = '在所有领域达到90%准确率';
      } else {
        nextMilestone = '保持专家水平，探索新技术领域';
      }
    }

    // 估算时间
    const estimatedDays = Math.max(7, pattern.weakAreas.length * 14);
    const estimatedTime = `${estimatedDays}天`;

    return {
      currentLevel,
      nextMilestone,
      recommendedOrder,
      estimatedTime
    };
  }
}