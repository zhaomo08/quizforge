import { TestResult, Question } from '@/types';
import { storage } from './storage';
import { testUtils } from './testUtils';

export interface LearningReport {
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalTests: number;
    totalQuestions: number;
    correctAnswers: number;
    averageScore: number;
    totalTimeSpent: number;
    improvementRate: number;
  };
  categoryAnalysis: Array<{
    category: string;
    tests: number;
    avgScore: number;
    improvement: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  timeAnalysis: {
    avgTimePerTest: number;
    avgTimePerQuestion: number;
    mostActiveHours: number[];
    studyPattern: 'consistent' | 'irregular' | 'intensive';
  };
  achievements: Array<{
    title: string;
    description: string;
    achievedAt: string;
    type: 'score' | 'streak' | 'improvement' | 'milestone';
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
    reason: string;
  }>;
  wrongAnswerAnalysis: {
    totalWrongAnswers: number;
    commonMistakes: Array<{
      pattern: string;
      frequency: number;
      categories: string[];
    }>;
    improvementAreas: string[];
  };
}

export const reportGenerator = {
  generateReport: (periodDays: number = 30): LearningReport => {
    const testResults = storage.getTestResults();
    const wrongAnswers = storage.getWrongAnswers();
    const stats = testUtils.getUserStats();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Filter results by period
    const periodResults = testResults.filter(result => {
      const resultDate = new Date(result.completedAt);
      return resultDate >= startDate && resultDate <= endDate;
    });

    // Calculate summary
    const totalTests = periodResults.length;
    const totalQuestions = periodResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const correctAnswers = periodResults.reduce((sum, result) => sum + result.correctAnswers, 0);
    const averageScore = totalTests > 0 ? 
      periodResults.reduce((sum, result) => sum + result.score, 0) / totalTests : 0;
    const totalTimeSpent = periodResults.reduce((sum, result) => sum + (result.timeSpent || 0), 0);
    
    // Calculate improvement rate
    const firstHalf = periodResults.slice(0, Math.floor(periodResults.length / 2));
    const secondHalf = periodResults.slice(Math.floor(periodResults.length / 2));
    const firstHalfAvg = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, result) => sum + result.score, 0) / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, result) => sum + result.score, 0) / secondHalf.length : 0;
    const improvementRate = secondHalfAvg - firstHalfAvg;

    // Category analysis
    const categoryStats: Record<string, TestResult[]> = {};
    periodResults.forEach(result => {
      if (!categoryStats[result.category]) {
        categoryStats[result.category] = [];
      }
      categoryStats[result.category].push(result);
    });

    const categoryAnalysis = Object.entries(categoryStats).map(([category, results]) => {
      const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
      
      // Calculate improvement for this category
      const categoryFirstHalf = results.slice(0, Math.floor(results.length / 2));
      const categorySecondHalf = results.slice(Math.floor(results.length / 2));
      const categoryFirstAvg = categoryFirstHalf.length > 0 ? 
        categoryFirstHalf.reduce((sum, result) => sum + result.score, 0) / categoryFirstHalf.length : 0;
      const categorySecondAvg = categorySecondHalf.length > 0 ? 
        categorySecondHalf.reduce((sum, result) => sum + result.score, 0) / categorySecondHalf.length : 0;
      const improvement = categorySecondAvg - categoryFirstAvg;

      // Analyze strengths and weaknesses
      const categoryWrongAnswers = wrongAnswers.filter(wa => wa.question.category === category);
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (avgScore >= 85) {
        strengths.push('整体表现优秀');
      }
      if (improvement > 10) {
        strengths.push('进步明显');
      }
      if (avgScore < 70) {
        weaknesses.push('基础知识需要加强');
      }
      if (categoryWrongAnswers.length > results.length * 0.3) {
        weaknesses.push('错误率较高');
      }

      return {
        category,
        tests: results.length,
        avgScore: Math.round(avgScore),
        improvement: Math.round(improvement),
        strengths,
        weaknesses
      };
    });

    // Time analysis
    const avgTimePerTest = totalTests > 0 ? totalTimeSpent / totalTests : 0;
    const avgTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;
    
    // Analyze study pattern
    const testDates = periodResults.map(result => new Date(result.completedAt));
    const daysBetweenTests = testDates.slice(1).map((date, index) => {
      const prevDate = testDates[index];
      return Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    
    const avgDaysBetween = daysBetweenTests.length > 0 ? 
      daysBetweenTests.reduce((sum, days) => sum + days, 0) / daysBetweenTests.length : 0;
    
    let studyPattern: 'consistent' | 'irregular' | 'intensive';
    if (avgDaysBetween <= 2) {
      studyPattern = 'intensive';
    } else if (avgDaysBetween <= 5) {
      studyPattern = 'consistent';
    } else {
      studyPattern = 'irregular';
    }

    // Most active hours (simplified - would need actual test times)
    const mostActiveHours = [14, 15, 16, 20, 21]; // Default assumption

    // Achievements
    const achievements = reportGenerator.calculateAchievements(periodResults, stats);

    // Recommendations
    const recommendations = reportGenerator.generateRecommendations(categoryAnalysis, stats, studyPattern);

    // Wrong answer analysis
    const wrongAnswerAnalysis = reportGenerator.analyzeWrongAnswers(wrongAnswers);

    return {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalTests,
        totalQuestions,
        correctAnswers,
        averageScore: Math.round(averageScore),
        totalTimeSpent,
        improvementRate: Math.round(improvementRate)
      },
      categoryAnalysis,
      timeAnalysis: {
        avgTimePerTest,
        avgTimePerQuestion,
        mostActiveHours,
        studyPattern
      },
      achievements,
      recommendations,
      wrongAnswerAnalysis
    };
  },

  calculateAchievements: (results: TestResult[], stats: any) => {
    const achievements = [];

    // Score achievements
    if (stats.averageScore >= 90) {
      achievements.push({
        title: '学霸成就',
        description: '平均得分达到90%以上',
        achievedAt: new Date().toISOString(),
        type: 'score' as const
      });
    }

    // Test count achievements
    if (stats.totalTests >= 50) {
      achievements.push({
        title: '勤奋学习者',
        description: '完成50次以上测试',
        achievedAt: new Date().toISOString(),
        type: 'milestone' as const
      });
    }

    // Improvement achievements
    const recentTests = results.slice(-10);
    const olderTests = results.slice(-20, -10);
    if (recentTests.length > 0 && olderTests.length > 0) {
      const recentAvg = recentTests.reduce((sum, test) => sum + test.score, 0) / recentTests.length;
      const olderAvg = olderTests.reduce((sum, test) => sum + test.score, 0) / olderTests.length;
      
      if (recentAvg > olderAvg + 15) {
        achievements.push({
          title: '快速进步',
          description: '最近表现比之前提升15%以上',
          achievedAt: new Date().toISOString(),
          type: 'improvement' as const
        });
      }
    }

    return achievements;
  },

  generateRecommendations: (categoryAnalysis: any[], stats: any, studyPattern: string) => {
    const recommendations = [];

    // Category-based recommendations
    const weakestCategory = categoryAnalysis
      .sort((a, b) => a.avgScore - b.avgScore)[0];
    
    if (weakestCategory && weakestCategory.avgScore < 70) {
      recommendations.push({
        priority: 'high' as const,
        category: weakestCategory.category,
        suggestion: `重点加强 ${weakestCategory.category} 领域的学习`,
        reason: `该领域平均得分仅为 ${weakestCategory.avgScore}%，需要重点关注`
      });
    }

    // Study pattern recommendations
    if (studyPattern === 'irregular') {
      recommendations.push({
        priority: 'medium' as const,
        category: '学习习惯',
        suggestion: '建立更规律的学习节奏',
        reason: '不规律的学习模式可能影响知识的巩固和记忆'
      });
    }

    // Overall performance recommendations
    if (stats.averageScore < 75) {
      recommendations.push({
        priority: 'high' as const,
        category: '基础知识',
        suggestion: '加强基础知识的学习和理解',
        reason: '整体平均分偏低，建议从基础开始系统性学习'
      });
    }

    return recommendations;
  },

  analyzeWrongAnswers: (wrongAnswers: any[]) => {
    const totalWrongAnswers = wrongAnswers.length;
    
    // Analyze common mistake patterns
    const categoryMistakes: Record<string, number> = {};
    wrongAnswers.forEach(wa => {
      categoryMistakes[wa.question.category] = (categoryMistakes[wa.question.category] || 0) + 1;
    });

    const commonMistakes = Object.entries(categoryMistakes)
      .map(([category, frequency]) => ({
        pattern: `${category} 领域错误`,
        frequency,
        categories: [category]
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const improvementAreas = Object.keys(categoryMistakes)
      .sort((a, b) => categoryMistakes[b] - categoryMistakes[a])
      .slice(0, 3);

    return {
      totalWrongAnswers,
      commonMistakes,
      improvementAreas
    };
  },

  exportToJSON: (report: LearningReport): string => {
    return JSON.stringify(report, null, 2);
  },

  exportToText: (report: LearningReport): string => {
    const { summary, categoryAnalysis, achievements, recommendations } = report;
    
    let text = `学习报告\n`;
    text += `生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}\n`;
    text += `统计周期: ${new Date(report.period.start).toLocaleDateString('zh-CN')} - ${new Date(report.period.end).toLocaleDateString('zh-CN')}\n\n`;
    
    text += `总体表现\n`;
    text += `- 测试次数: ${summary.totalTests}\n`;
    text += `- 总题数: ${summary.totalQuestions}\n`;
    text += `- 正确答题: ${summary.correctAnswers}\n`;
    text += `- 平均得分: ${summary.averageScore}%\n`;
    text += `- 进步幅度: ${summary.improvementRate > 0 ? '+' : ''}${summary.improvementRate}%\n\n`;
    
    text += `分类表现\n`;
    categoryAnalysis.forEach(category => {
      text += `- ${category.category}: ${category.avgScore}% (${category.tests}次测试)\n`;
      if (category.strengths.length > 0) {
        text += `  优势: ${category.strengths.join(', ')}\n`;
      }
      if (category.weaknesses.length > 0) {
        text += `  待改进: ${category.weaknesses.join(', ')}\n`;
      }
    });
    text += `\n`;
    
    if (achievements.length > 0) {
      text += `获得成就\n`;
      achievements.forEach(achievement => {
        text += `- ${achievement.title}: ${achievement.description}\n`;
      });
      text += `\n`;
    }
    
    if (recommendations.length > 0) {
      text += `学习建议\n`;
      recommendations.forEach(rec => {
        text += `- [${rec.priority.toUpperCase()}] ${rec.suggestion}\n`;
        text += `  原因: ${rec.reason}\n`;
      });
    }
    
    return text;
  },

  downloadReport: (report: LearningReport, format: 'json' | 'txt' = 'txt') => {
    const content = format === 'json' 
      ? reportGenerator.exportToJSON(report)
      : reportGenerator.exportToText(report);
    
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学习报告_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};