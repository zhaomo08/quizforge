import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/utils/storage';
import { WrongAnswer } from '@/types';
import { PageHeader } from '@/components/PageHeader';

export const WrongAnswersPage: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>(
    storage.getWrongAnswers()
  );

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
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

  const categories = ['all', ...new Set(wrongAnswers.map(wa => wa.question.category))];

  const filteredWrongAnswers = wrongAnswers.filter(wa => {
    const matchesSearch = wa.question.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || wa.question.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredWrongAnswers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = filteredWrongAnswers.slice(startIndex, endIndex);

  // 重置分页当搜索或筛选改变时
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handleRemoveWrongAnswer = (questionId: string) => {
    storage.removeWrongAnswer(questionId);
    setWrongAnswers(storage.getWrongAnswers());
    dispatch({ type: 'SET_WRONG_ANSWERS', payload: storage.getWrongAnswers() });
  };



  const handlePracticeWrongAnswers = () => {
    const questions = filteredWrongAnswers.map(wa => wa.question);
    if (questions.length === 0) return;

    dispatch({ type: 'START_TEST', payload: questions });
    navigate('/test');
  };

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
      {/* Header */}
      <PageHeader
        title="错题本"
        subtitle="复习和巩固你的薄弱环节"
        backTo="home"
      />

      {wrongAnswers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无错题</h3>
            <p className="text-gray-500 mb-6">
              你还没有做错过任何题目，继续保持！
            </p>
            <Button
              onClick={() => navigate('/category')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              开始答题
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats and Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {wrongAnswers.length}
                  </div>
                  <p className="text-gray-600">总错题数</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {categories.length - 1}
                  </div>
                  <p className="text-gray-600">涉及类别</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Button
                    onClick={handlePracticeWrongAnswers}
                    disabled={filteredWrongAnswers.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    练习错题
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Button
                    onClick={() => {
                      storage.getWrongAnswers().forEach(wa =>
                        storage.removeWrongAnswer(wa.questionId)
                      );
                      setWrongAnswers([]);
                    }}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清空错题
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索错题..."
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
            </CardContent>
          </Card>

          {/* Pagination Info */}
          {filteredWrongAnswers.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    显示第 {startIndex + 1}-{Math.min(endIndex, filteredWrongAnswers.length)} 条，
                    共 {filteredWrongAnswers.length} 条错题
                  </span>
                  <span>
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wrong Answers List */}
          {filteredWrongAnswers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">没有找到匹配的错题</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {currentPageItems.map((wrongAnswer) => (
                <Card key={wrongAnswer.questionId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {wrongAnswer.question.question}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {getCategoryName(wrongAnswer.question.category)}
                          </Badge>
                          <Badge variant="outline">
                            {wrongAnswer.question.difficulty || 'medium'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            错误时间: {new Date(wrongAnswer.wrongAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWrongAnswer(wrongAnswer.questionId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Options */}
                      <div className="space-y-2">
                        {wrongAnswer.question.options.map((option, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg ${index === wrongAnswer.question.correctAnswer
                              ? 'border-green-500 bg-green-50'
                              : index === wrongAnswer.userAnswer
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-semibold">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <span>{option}</span>
                              </div>

                              {index === wrongAnswer.question.correctAnswer && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">正确答案</span>
                                </div>
                              )}

                              {index === wrongAnswer.userAnswer && index !== wrongAnswer.question.correctAnswer && (
                                <div className="flex items-center text-red-600">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">你的答案</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">解析：</h4>
                        <p className="text-blue-800 leading-relaxed">
                          {wrongAnswer.question.explanation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
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
        </>
      )}
    </div>
  );
};