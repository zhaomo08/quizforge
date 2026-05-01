import { Question, TestResult } from '@/types';

export interface KnowledgePointStats {
  id: string;
  name: string;
  category: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastAttempt: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface KnowledgePointAnalysis {
  strongPoints: KnowledgePointStats[];
  weakPoints: KnowledgePointStats[];
  improvingPoints: KnowledgePointStats[];
  decliningPoints: KnowledgePointStats[];
  overallMastery: number;
  recommendations: string[];
}

export class KnowledgePointAnalyzer {
  
  /**
   * 从题目中智能提取知识点
   */
  static extractKnowledgePoint(question: Question): string {
    const text = question.question.toLowerCase();
    
    // Java相关知识点
    if (text.includes('class') || text.includes('类')) return 'Java类与对象';
    if (text.includes('interface') || text.includes('接口')) return 'Java接口';
    if (text.includes('inheritance') || text.includes('继承')) return 'Java继承';
    if (text.includes('polymorphism') || text.includes('多态')) return 'Java多态';
    if (text.includes('encapsulation') || text.includes('封装')) return 'Java封装';
    if (text.includes('abstract') || text.includes('抽象')) return 'Java抽象类';
    if (text.includes('static') || text.includes('静态')) return 'Java静态成员';
    if (text.includes('final') || text.includes('最终')) return 'Java final关键字';
    if (text.includes('exception') || text.includes('异常')) return 'Java异常处理';
    if (text.includes('thread') || text.includes('线程')) return 'Java多线程';
    if (text.includes('collection') || text.includes('集合')) return 'Java集合框架';
    if (text.includes('stream') || text.includes('流')) return 'Java Stream API';
    if (text.includes('lambda') || text.includes('λ')) return 'Java Lambda表达式';
    if (text.includes('generic') || text.includes('泛型')) return 'Java泛型';
    if (text.includes('annotation') || text.includes('注解')) return 'Java注解';
    
    // 数据结构相关
    if (text.includes('array') || text.includes('数组')) return '数组操作';
    if (text.includes('list') || text.includes('链表')) return '链表结构';
    if (text.includes('stack') || text.includes('栈')) return '栈结构';
    if (text.includes('queue') || text.includes('队列')) return '队列结构';
    if (text.includes('tree') || text.includes('树')) return '树结构';
    if (text.includes('graph') || text.includes('图')) return '图结构';
    if (text.includes('hash') || text.includes('哈希')) return '哈希表';
    if (text.includes('heap') || text.includes('堆')) return '堆结构';
    
    // 算法相关
    if (text.includes('sort') || text.includes('排序')) return '排序算法';
    if (text.includes('search') || text.includes('查找')) return '查找算法';
    if (text.includes('recursion') || text.includes('递归')) return '递归算法';
    if (text.includes('dynamic') || text.includes('动态规划')) return '动态规划';
    if (text.includes('greedy') || text.includes('贪心')) return '贪心算法';
    if (text.includes('divide') || text.includes('分治')) return '分治算法';
    if (text.includes('backtrack') || text.includes('回溯')) return '回溯算法';
    
    // 数据库相关
    if (text.includes('sql') || text.includes('查询')) return 'SQL查询';
    if (text.includes('join') || text.includes('连接')) return 'SQL连接';
    if (text.includes('index') || text.includes('索引')) return '数据库索引';
    if (text.includes('transaction') || text.includes('事务')) return '数据库事务';
    if (text.includes('normalization') || text.includes('范式')) return '数据库设计';
    
    // 网络相关
    if (text.includes('http') || text.includes('协议')) return 'HTTP协议';
    if (text.includes('tcp') || text.includes('udp')) return '网络协议';
    if (text.includes('socket') || text.includes('套接字')) return '网络编程';
    if (text.includes('rest') || text.includes('api')) return 'REST API';
    
    // 操作系统相关
    if (text.includes('process') || text.includes('进程')) return '进程管理';
    if (text.includes('memory') || text.includes('内存')) return '内存管理';
    if (text.includes('file') || text.includes('文件')) return '文件系统';
    if (text.includes('deadlock') || text.includes('死锁')) return '死锁处理';
    
    // 基础语法
    if (text.includes('variable') || text.includes('变量')) return '变量与数据类型';
    if (text.includes('operator') || text.includes('运算符')) return '运算符';
    if (text.includes('condition') || text.includes('条件')) return '条件语句';
    if (text.includes('loop') || text.includes('循环')) return '循环语句';
    if (text.includes('function') || text.includes('方法')) return '函数与方法';
    
    // 默认分类
    return '综合应用';
  }
  
  /**
   * 分析单次测试的知识点表现
   */
  static analyzeTestKnowledgePoints(testResult: TestResult): Map<string, { correct: number; total: number; timeSpent: number }> {
    const knowledgeMap = new Map<string, { correct: number; total: number; timeSpent: number }>();
    const avgTimePerQuestion = (testResult.timeSpent || 0) / testResult.totalQuestions;
    
    testResult.questions.forEach((question, index) => {
      const knowledgePoint = this.extractKnowledgePoint(question);
      const isCorrect = testResult.userAnswers[index] === question.correctAnswer;
      
      if (!knowledgeMap.has(knowledgePoint)) {
        knowledgeMap.set(knowledgePoint, { correct: 0, total: 0, timeSpent: 0 });
      }
      
      const stats = knowledgeMap.get(knowledgePoint)!;
      stats.total++;
      stats.timeSpent += avgTimePerQuestion;
      if (isCorrect) {
        stats.correct++;
      }
    });
    
    return knowledgeMap;
  }
  
  /**
   * 分析所有测试结果的知识点掌握情况
   */
  static analyzeAllKnowledgePoints(testResults: TestResult[]): KnowledgePointStats[] {
    const knowledgeMap = new Map<string, {
      totalAttempts: number;
      correctAttempts: number;
      totalTime: number;
      category: string;
      attempts: Array<{ correct: boolean; date: string }>;
    }>();
    
    testResults.forEach(testResult => {
      const testKnowledgePoints = this.analyzeTestKnowledgePoints(testResult);
      
      testKnowledgePoints.forEach((stats, knowledgePoint) => {
        if (!knowledgeMap.has(knowledgePoint)) {
          knowledgeMap.set(knowledgePoint, {
            totalAttempts: 0,
            correctAttempts: 0,
            totalTime: 0,
            category: testResult.category,
            attempts: []
          });
        }
        
        const pointStats = knowledgeMap.get(knowledgePoint)!;
        pointStats.totalAttempts += stats.total;
        pointStats.correctAttempts += stats.correct;
        pointStats.totalTime += stats.timeSpent;
        
        // 记录每次尝试的结果用于趋势分析
        for (let i = 0; i < stats.total; i++) {
          pointStats.attempts.push({
            correct: i < stats.correct,
            date: testResult.completedAt
          });
        }
      });
    });
    
    // 转换为KnowledgePointStats数组
    return Array.from(knowledgeMap.entries()).map(([name, stats]) => {
      const accuracy = stats.totalAttempts > 0 ? (stats.correctAttempts / stats.totalAttempts) * 100 : 0;
      const averageTime = stats.totalAttempts > 0 ? stats.totalTime / stats.totalAttempts : 0;
      
      // 计算趋势
      const recentAttempts = stats.attempts.slice(-5); // 最近5次尝试
      const olderAttempts = stats.attempts.slice(-10, -5); // 之前5次尝试
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAttempts.length >= 3 && olderAttempts.length >= 3) {
        const recentAccuracy = recentAttempts.filter(a => a.correct).length / recentAttempts.length;
        const olderAccuracy = olderAttempts.filter(a => a.correct).length / olderAttempts.length;
        const improvement = recentAccuracy - olderAccuracy;
        
        if (improvement > 0.2) trend = 'improving';
        else if (improvement < -0.2) trend = 'declining';
      }
      
      // 判断难度
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      if (accuracy >= 80) difficulty = 'easy';
      else if (accuracy < 50) difficulty = 'hard';
      
      return {
        id: name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ''),
        name,
        category: stats.category,
        totalAttempts: stats.totalAttempts,
        correctAttempts: stats.correctAttempts,
        accuracy: Math.round(accuracy),
        averageTime: Math.round(averageTime),
        difficulty,
        lastAttempt: stats.attempts.length > 0 ? stats.attempts[stats.attempts.length - 1]!.date : '',
        trend
      };
    }).sort((a, b) => b.totalAttempts - a.totalAttempts);
  }
  
  /**
   * 生成知识点掌握分析报告
   */
  static generateKnowledgePointAnalysis(testResults: TestResult[]): KnowledgePointAnalysis {
    const knowledgePoints = this.analyzeAllKnowledgePoints(testResults);
    
    // 分类知识点
    const strongPoints = knowledgePoints.filter(kp => kp.accuracy >= 80);
    const weakPoints = knowledgePoints.filter(kp => kp.accuracy < 60);
    const improvingPoints = knowledgePoints.filter(kp => kp.trend === 'improving');
    const decliningPoints = knowledgePoints.filter(kp => kp.trend === 'declining');
    
    // 计算整体掌握度
    const totalAttempts = knowledgePoints.reduce((sum, kp) => sum + kp.totalAttempts, 0);
    const totalCorrect = knowledgePoints.reduce((sum, kp) => sum + kp.correctAttempts, 0);
    const overallMastery = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    
    // 生成建议
    const recommendations: string[] = [];
    
    if (weakPoints.length > 0) {
      recommendations.push(`重点加强 ${weakPoints.slice(0, 3).map(kp => kp.name).join('、')} 的学习`);
    }
    
    if (decliningPoints.length > 0) {
      recommendations.push(`注意复习 ${decliningPoints.slice(0, 2).map(kp => kp.name).join('、')}，表现有下降趋势`);
    }
    
    if (improvingPoints.length > 0) {
      recommendations.push(`继续保持 ${improvingPoints.slice(0, 2).map(kp => kp.name).join('、')} 的学习势头`);
    }
    
    if (strongPoints.length > 0) {
      recommendations.push(`在 ${strongPoints.slice(0, 2).map(kp => kp.name).join('、')} 方面表现优秀，可以尝试更高难度的内容`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('继续保持学习节奏，均衡发展各个知识点');
    }
    
    return {
      strongPoints,
      weakPoints,
      improvingPoints,
      decliningPoints,
      overallMastery,
      recommendations
    };
  }
  
  /**
   * 获取知识点学习建议
   */
  static getKnowledgePointRecommendations(knowledgePoint: KnowledgePointStats): string[] {
    const recommendations: string[] = [];
    
    if (knowledgePoint.accuracy < 50) {
      recommendations.push('建议从基础概念开始重新学习');
      recommendations.push('多做相关的基础练习题');
      recommendations.push('寻找相关的教程或资料进行系统学习');
    } else if (knowledgePoint.accuracy < 70) {
      recommendations.push('加强练习，提高熟练度');
      recommendations.push('重点复习错误的题目');
      recommendations.push('尝试不同类型的相关题目');
    } else if (knowledgePoint.accuracy < 85) {
      recommendations.push('继续巩固，争取达到熟练掌握');
      recommendations.push('可以尝试一些有挑战性的题目');
    } else {
      recommendations.push('掌握良好，可以尝试更高难度的内容');
      recommendations.push('可以帮助他人学习这个知识点');
    }
    
    if (knowledgePoint.trend === 'declining') {
      recommendations.push('注意：最近表现有下降，建议重点复习');
    } else if (knowledgePoint.trend === 'improving') {
      recommendations.push('表现在提升，继续保持学习势头');
    }
    
    if (knowledgePoint.averageTime > 120) {
      recommendations.push('答题时间较长，建议提高解题速度');
    }
    
    return recommendations;
  }
}