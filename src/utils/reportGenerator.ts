import { TestResult, Question } from '@/types';
// PDF 相关依赖（在 package.json 中已添加 jspdf 与 jspdf-autotable）
// 使用动态导入减少初始包体积: 在调用导出时再加载。
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

  exportToHTML: (report: LearningReport): string => {
    const { summary, categoryAnalysis, achievements, recommendations, wrongAnswerAnalysis } = report;
    // 独立可打印的简洁 HTML，使用内联样式避免外部依赖
    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8" />
      <title>学习报告</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif;line-height:1.55;margin:32px;background:#f7f9fc;color:#222;}
        h1,h2{margin:0 0 12px;font-weight:600;}
        h1{font-size:26px;color:#1d4ed8;}
        h2{font-size:18px;margin-top:28px;border-left:4px solid #3b82f6;padding-left:8px;}
        table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px;background:#fff;}
        th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left;vertical-align:top;}
        th{background:#f1f5f9;font-weight:600;}
        .badge{display:inline-block;padding:2px 8px;border-radius:12px;background:#e0f2fe;color:#0369a1;font-size:12px;margin-right:4px;}
        .muted{color:#6b7280;font-size:12px;}
        .footer{margin-top:40px;font-size:12px;color:#6b7280;text-align:center;}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0;}
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;box-shadow:0 2px 4px -2px rgba(0,0,0,.05);} 
        .card h3{margin:0 0 6px;font-size:14px;color:#334155;}
        .tag-low{color:#dc2626;font-weight:600;}
        .tag-mid{color:#d97706;font-weight:600;}
        .tag-high{color:#16a34a;font-weight:600;}
        @media print {body{background:#fff;margin:8mm;} .no-print{display:none;} }
      </style></head><body>
      <h1>学习报告</h1>
      <div class="muted">生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')} | 统计周期：${new Date(report.period.start).toLocaleDateString('zh-CN')} - ${new Date(report.period.end).toLocaleDateString('zh-CN')}</div>
      <h2>总体概览</h2>
      <div class="grid">
        <div class="card"><h3>测试次数</h3><strong>${summary.totalTests}</strong></div>
        <div class="card"><h3>总题数</h3><strong>${summary.totalQuestions}</strong></div>
        <div class="card"><h3>正确答题</h3><strong>${summary.correctAnswers}</strong></div>
        <div class="card"><h3>平均得分</h3><strong>${summary.averageScore}%</strong></div>
        <div class="card"><h3>进步幅度</h3><strong>${summary.improvementRate>0?'+':''}${summary.improvementRate}%</strong></div>
      </div>
      <h2>分类表现</h2>
      <table><thead><tr><th>分类</th><th>测试次数</th><th>平均得分</th><th>进步</th><th>优势</th><th>不足</th></tr></thead><tbody>
        ${categoryAnalysis.map(c=>`<tr><td>${c.category}</td><td>${c.tests}</td><td>${c.avgScore}%</td><td>${c.improvement>0?'+':''}${c.improvement}%</td><td>${c.strengths.join('<br/>')||'-'}</td><td>${c.weaknesses.join('<br/>')||'-'}</td></tr>`).join('')}
      </tbody></table>
      <h2>获得成就</h2>
      ${achievements.length? achievements.map(a=>`<span class="badge" title="${a.description}">${a.title}</span>`).join(' '):'<div class="muted">暂无</div>'}
      <h2>学习建议</h2>
      ${recommendations.length? '<ul>'+recommendations.map(r=>`<li><strong class="tag-${r.priority}">[${r.priority.toUpperCase()}]</strong> ${r.suggestion}<div class="muted">原因：${r.reason}</div></li>`).join('')+'</ul>':'<div class="muted">暂无特别建议</div>'}
      <h2>错题分析</h2>
      <div>错题总数：${wrongAnswerAnalysis.totalWrongAnswers}</div>
      ${wrongAnswerAnalysis.commonMistakes.length?`<table><thead><tr><th>模式</th><th>频次</th><th>涉及分类</th></tr></thead><tbody>${wrongAnswerAnalysis.commonMistakes.map(m=>`<tr><td>${m.pattern}</td><td>${m.frequency}</td><td>${m.categories.join(', ')}</td></tr>`).join('')}</tbody></table>`:'<div class="muted">暂无显著错题模式</div>'}
      <div style="margin-top:8px;">重点改进领域：${wrongAnswerAnalysis.improvementAreas.join('、')||'暂无'}</div>
      <div class="footer no-print">可使用浏览器 “打印”(⌘+P) 另存为 PDF 以获得更好的中文支持。</div>
      </body></html>`;
  },

  downloadReport: (report: LearningReport, format: 'json' | 'txt' | 'html' = 'txt') => {
    let content: string;
    let mime: string;
    if (format === 'json') {
      content = reportGenerator.exportToJSON(report);
      mime = 'application/json';
    } else if (format === 'html') {
      content = reportGenerator.exportToHTML(report);
      mime = 'text/html';
    } else {
      content = reportGenerator.exportToText(report);
      mime = 'text/plain';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学习报告_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportToPDF: async (report: LearningReport) => {
    // 动态导入，避免在未使用 PDF 时增加初始 bundle
    // @ts-ignore 动态导入无类型
    const [{ default: jsPDF }] = await Promise.all([
      // @ts-ignore
      import('jspdf'),
      // @ts-ignore 仅需 side-effect 注入 autoTable
      import('jspdf-autotable')
    ]);

    // jsPDF 类型
    // @ts-ignore - autotable 会通过 side-effect 注入到 jsPDF 实例
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // ---- 解决中文乱码：动态加载支持中文的字体 (需将字体文件放在 public/fonts 下) ----
    // 使用 NotoSansSC-Regular.ttf (SIL Open Font License) 或其它开源中文字体
    // 由于内置 helvetica 不支持 CJK，需要手动嵌入。
    async function ensureChineseFont() {
      const desiredFontName = 'NotoSansSC';
      try {
        // 如果已经注册过，直接切换
        const fontList: Record<string, string[]> = (doc as any).getFontList?.() || {};
        if (Object.keys(fontList).some(fname => fname.toLowerCase() === desiredFontName.toLowerCase())) {
          doc.setFont(desiredFontName, 'normal');
          return true;
        }
        // 按优先顺序尝试加载字体文件: TTF > OTF
        const candidates = [
          { path: '/fonts/NotoSansSC-Regular.ttf', vfsName: 'NotoSansSC-Regular.ttf' },
          { path: '/fonts/NotoSansSC-Regular.TTF', vfsName: 'NotoSansSC-Regular.TTF' },
          { path: '/fonts/NotoSansSC-Regular.otf', vfsName: 'NotoSansSC-Regular.otf' },
          { path: '/fonts/NotoSansSC-Subset.ttf', vfsName: 'NotoSansSC-Subset.ttf' },
        ];

        let loaded = false;
        for (const c of candidates) {
          try {
            const resp = await fetch(c.path);
            if (!resp.ok) continue;
            const buffer = await resp.arrayBuffer();
            const uint8 = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
            const base64 = btoa(binary);
            (doc as any).addFileToVFS(c.vfsName, base64);
            (doc as any).addFont(c.vfsName, desiredFontName, 'normal');
            // 测试一个常用汉字是否可测量宽度，如果失败说明 cmap 不兼容
            doc.setFont(desiredFontName, 'normal');
            doc.setFontSize(12);
            const w = (doc as any).getStringUnitWidth?.('测');
            if (!w || isNaN(w)) throw new Error('字体未提供有效宽度（可能是 OTF CFF 未被 jsPDF 支持）');
            loaded = true;
            break;
          } catch (inner) {
            // 继续尝试下一个候选
            continue;
          }
        }
        if (!loaded) {
          console.warn('[PDF] 未能成功加载可用中文字体（需要 TTF 带 Unicode cmap）。将使用内置 helvetica。');
          return false;
        }
        return true;
      } catch (e) {
        console.warn('[PDF] 加载中文字体失败，继续使用默认字体。', e);
        return false;
      }
    }

    const chineseFontReady = await ensureChineseFont();

    const marginX = 40;
    let cursorY = 50;

    const addTitle = (text: string, fontSize = 18) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(40, 40, 40);
      doc.text(text, marginX, cursorY);
      cursorY += fontSize + 10;
    };

    const addParagraph = (text: string, fontSize = 11, lineHeight = 16) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(70, 70, 70);
      const lines = doc.splitTextToSize(text, 520);
      lines.forEach((line: string) => {
        if (cursorY > 760) { // 分页
          doc.addPage();
          cursorY = 50;
        }
        doc.text(line, marginX, cursorY);
        cursorY += lineHeight;
      });
      cursorY += 4;
    };

    // 封面 / 基本信息
  addTitle('学习报告', 22);
    addParagraph(`生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`);
    addParagraph(`统计周期: ${new Date(report.period.start).toLocaleDateString('zh-CN')} - ${new Date(report.period.end).toLocaleDateString('zh-CN')}`);
    addParagraph(`总体概览: 测试次数 ${report.summary.totalTests} · 总题数 ${report.summary.totalQuestions} · 平均得分 ${report.summary.averageScore}% · 正确答题 ${report.summary.correctAnswers}`);
    addParagraph(`进步幅度: ${report.summary.improvementRate > 0 ? '+' : ''}${report.summary.improvementRate}%`);
    cursorY += 10;

    // 分类表现表格
    if (report.categoryAnalysis.length) {
      addTitle('分类表现');
      // @ts-ignore autotable
      doc.autoTable({
        startY: cursorY,
        head: [['分类', '测试次数', '平均得分', '进步', '优势', '不足']],
        body: report.categoryAnalysis.map(c => [
          c.category,
          String(c.tests),
            c.avgScore + '%',
          (c.improvement > 0 ? '+' : '') + c.improvement + '%',
          c.strengths.join('\n') || '-',
          c.weaknesses.join('\n') || '-'
        ]),
        styles: { font: chineseFontReady ? 'NotoSansSC' : 'helvetica', fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [59,130,246] },
        columnStyles: { 4: { cellWidth: 90 }, 5: { cellWidth: 90 } },
        didDrawPage: (data: any) => {
          cursorY = data.cursor.y + 20;
        }
      });
    }

    // 成就
    if (cursorY > 720) { doc.addPage(); cursorY = 50; }
    addTitle('获得成就');
    if (report.achievements.length) {
      report.achievements.forEach(a => {
        addParagraph(`• ${a.title}: ${a.description}`);
      });
    } else {
      addParagraph('暂无成就记录');
    }

    // 学习建议
    if (cursorY > 720) { doc.addPage(); cursorY = 50; }
    addTitle('学习建议');
    if (report.recommendations.length) {
      report.recommendations.forEach(r => {
        addParagraph(`• [${r.priority.toUpperCase()}] ${r.suggestion} (原因: ${r.reason})`);
      });
    } else {
      addParagraph('暂无特别建议');
    }

    // 错题分析
    if (cursorY > 720) { doc.addPage(); cursorY = 50; }
    addTitle('错题分析');
    addParagraph(`错题总数: ${report.wrongAnswerAnalysis.totalWrongAnswers}`);
    if (report.wrongAnswerAnalysis.commonMistakes.length) {
      // @ts-ignore autotable
      doc.autoTable({
        startY: cursorY,
        head: [['模式', '频次', '涉及分类']],
        body: report.wrongAnswerAnalysis.commonMistakes.map(m => [m.pattern, String(m.frequency), m.categories.join(', ')]),
        styles: { font: chineseFontReady ? 'NotoSansSC' : 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [244,114,182] },
        didDrawPage: (data: any) => {
          cursorY = data.cursor.y + 20;
        }
      });
    }
    addParagraph(`重点改进领域: ${report.wrongAnswerAnalysis.improvementAreas.join('、') || '暂无'}`);

    // 页脚
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`第 ${i} / ${pageCount} 页 - QuizForge 学习报告`, 300, 820, { align: 'center' });
    }

    doc.save(`学习报告_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};