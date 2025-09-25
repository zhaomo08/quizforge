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
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { storage } from '@/utils/storage';
import { testUtils } from '@/utils/testUtils';

export const ManagePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 分页逻辑
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = filteredQuestions.slice(startIndex, endIndex);

  // 重置分页当搜索或筛选改变时
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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
    <div className="page-container layout-stable">
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
              <label htmlFor="import-file" className="w-full">
                <div className="w-full flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  导入数据
                </div>
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
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">所有类别</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>
                      {getCategoryName(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:w-32">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value={5}>5条/页</option>
                  <option value={10}>10条/页</option>
                  <option value={20}>20条/页</option>
                  <option value={50}>50条/页</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pagination Info */}
          {filteredQuestions.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    显示第 {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)} 条，
                    共 {filteredQuestions.length} 道题目
                  </span>
                  <span>
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

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
              {currentPageItems.map(question => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex-1 mr-4">
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
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>正确答案: {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}</p>
                  </div>
                </div>
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        {!isMobile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            title="第一页"
                          >
                            1
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {isMobile ? '' : '上一页'}
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {/* 页码按钮 - 移动端显示更少页码 */}
                          {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                            let pageNum;
                            const maxVisible = isMobile ? 3 : 5;
                            
                            if (totalPages <= maxVisible) {
                              pageNum = i + 1;
                            } else if (currentPage <= Math.floor(maxVisible / 2) + 1) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
                              pageNum = totalPages - maxVisible + 1 + i;
                            } else {
                              pageNum = currentPage - Math.floor(maxVisible / 2) + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          
                          {totalPages > (isMobile ? 3 : 5) && 
                           currentPage < totalPages - Math.floor((isMobile ? 3 : 5) / 2) && (
                            <>
                              <span className="px-2 text-gray-400">...</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                className="w-8 h-8 p-0"
                              >
                                {totalPages}
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          {isMobile ? '' : '下一页'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        
                        {!isMobile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            title="最后一页"
                          >
                            {totalPages}
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="hidden sm:inline">跳转到</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                            }
                          }}
                          className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="页码"
                        />
                        <span>页</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};