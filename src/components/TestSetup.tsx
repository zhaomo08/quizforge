import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Play, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { testUtils } from '@/utils/testUtils';

export const TestSetup: React.FC = () => {
  const { state, dispatch } = useApp();
  const [questionCount, setQuestionCount] = useState('10');

  const handleStartTest = () => {
    const count = parseInt(questionCount);
    const questions = testUtils.selectRandomQuestions(state.selectedCategory, count);
    
    if (questions.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: '该类别暂无题目，请先生成题目' });
      return;
    }

    dispatch({ type: 'START_TEST', payload: questions });
  };

  const availableQuestions = testUtils.selectRandomQuestions(state.selectedCategory, 1000).length;

  const getCategoryName = (categoryId: string) => {
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
  };

  return (
    <div className="page-container layout-stable">
      <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'category' })}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">测试设置</h1>
          <p className="text-gray-600 mt-2">配置你的{getCategoryName(state.selectedCategory)}测试</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            测试配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              选择题目数量
            </label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 题 (快速测试)</SelectItem>
                <SelectItem value="10">10 题 (标准测试)</SelectItem>
                <SelectItem value="15">15 题 (深度测试)</SelectItem>
                <SelectItem value="20">20 题 (完整测试)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              该类别共有 {availableQuestions} 道题目可用
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">测试说明</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 每题限时60秒，超时自动跳到下一题</li>
              <li>• 答题后会立即显示正确答案和解析</li>
              <li>• 答错的题目会自动加入错题本</li>
              <li>• 完成后可查看详细的成绩报告</li>
            </ul>
          </div>

          <Button 
            onClick={handleStartTest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
            size="lg"
          >
            <Play className="h-5 w-5 mr-2" />
            开始测试
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
  );
};