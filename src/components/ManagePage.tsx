import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Search,
  BarChart3,
  ArrowLeft,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { storage } from '@/utils/storage';
import { testUtils } from '@/utils/testUtils';

export const ManagePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const questions = state.questions;
  const stats = testUtils.getUserStats();
  
  // Get unique categories
  const categories = ['all', ...new Set(questions.map(q => q.category))];

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group questions by category for stats
  const categoryStats = categories.slice(1).map(category => {
    const categoryQuestions = questions.filter(q => q.category === category);
    return {
      category,
      count: categoryQuestions.length,
      name: getCategoryName(category),
    };
  });

  const handleExportData = () => {
    const data = storage.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `interview-questions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        storage.importData(importedData);
        
        // Refresh app state
        dispatch({ type: 'SET_QUESTIONS', payload: storage.getQuestions() });
        dispatch({ type: 'SET_WRONG_ANSWERS', payload: storage.getWrongAnswers() });
        
        alert('数据导入成功！');
      } catch (error) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleClearAllData = () => {
    if (window.confirm('确定要清除所有数据吗？这个操作不可撤销！')) {
      storage.clearAllData();
      dispatch({ type: 'SET_QUESTIONS', payload: [] });
      dispatch({ type: 'SET_WRONG_ANSWERS', payload: [] });
      alert('所有数据已清除');
    }
  };

  function getCategoryName(categoryId: string) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">题库管理</h1>
          <p className="text-gray-600 mt-2">管理你的面试题库和数据</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                <p className="text-gray-600">总题目数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
                <p className="text-gray-600">题目类别</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                <p className="text-gray-600">测试次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{state.wrongAnswers.length}</p>
                <p className="text-gray-600">错题数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>各类别题目统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryStats.map(({ category, count, name }) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{name}</span>
                  <Badge variant="outline">{count} 题</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleExportData}
              className="flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
            
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file">
                <Button as="div" className="w-full flex items-center justify-center cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  导入数据
                </Button>
              </label>
            </div>
            
            <Button 
              variant="destructive"
              onClick={handleClearAllData}
              className="flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清除所有数据
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>数据安全提示：</strong>
              定期导出数据以备份你的题库。导入数据会与现有数据合并，不会覆盖。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Question Browser */}
      <Card>
        <CardHeader>
          <CardTitle>题目浏览器</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索题目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有类别</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>
                    {getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {questions.length === 0 ? '暂无题目，请先使用AI生成题目' : '没有找到匹配的题目'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                共找到 {filteredQuestions.length} 道题目
              </p>
              
              {filteredQuestions.slice(0, 20).map(question => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex-1 mr-4">
                      {question.question}
                    </h3>
                    <div className="flex space-x-2">
                      <Badge variant="outline">
                        {getCategoryName(question.category)}
                      </Badge>
                      <Badge variant="outline">
                        {question.difficulty || 'medium'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>正确答案: {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}</p>
                  </div>
                </div>
              ))}
              
              {filteredQuestions.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    只显示前20道题目，使用搜索功能查找特定题目
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};