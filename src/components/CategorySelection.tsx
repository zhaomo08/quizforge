import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Code, Database, Cpu, Globe, Brain, Server } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { storage } from '@/utils/storage';

export const CategorySelection: React.FC = () => {
  const { dispatch } = useApp();

  const categories = [
    {
      id: 'java',
      name: 'Java',
      description: 'Java基础语法、面向对象、集合框架、多线程等',
      icon: Code,
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      id: 'python',
      name: 'Python',
      description: 'Python语法、数据结构、Web开发、机器学习等',
      icon: Code,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      description: 'ES6+语法、异步编程、前端框架、Node.js等',
      icon: Globe,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      id: 'database',
      name: '数据库',
      description: 'SQL查询、数据库设计、索引优化、事务等',
      icon: Database,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'algorithm',
      name: '算法与数据结构',
      description: '排序算法、树、图、动态规划、时间复杂度等',
      icon: Brain,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'system-design',
      name: '系统设计',
      description: '架构设计、分布式系统、微服务、负载均衡等',
      icon: Server,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      id: 'operating-system',
      name: '操作系统',
      description: '进程线程、内存管理、文件系统、网络编程等',
      icon: Cpu,
      color: 'bg-gray-50 text-gray-600 border-gray-200',
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    const questions = storage.getQuestionsByCategory(categoryId);
    
    if (questions.length === 0) {
      // 如果没有题目，提示用户先生成题目
      dispatch({ type: 'SET_ERROR', payload: `${categoryId} 类别暂无题目，请先使用AI生成题目` });
      return;
    }

    dispatch({ type: 'SET_CATEGORY', payload: categoryId });
    dispatch({ type: 'SET_PAGE', payload: 'test-setup' });
  };

  const getQuestionCount = (categoryId: string) => {
    return storage.getQuestionsByCategory(categoryId).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] layout-stable">
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
          <h1 className="text-3xl font-bold text-gray-900">选择面试类别</h1>
          <p className="text-gray-600 mt-2">选择你想要练习的技术领域</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(({ id, name, description, icon: Icon, color }) => {
          const questionCount = getQuestionCount(id);
          
          return (
            <Card 
              key={id} 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleCategorySelect(id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{name}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {questionCount} 题
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
                
                {questionCount === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      暂无题目，请先使用AI生成题目
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">需要更多题目？</h3>
          <p className="text-gray-600 mb-4">
            使用AI自动生成功能，为任何类别创建个性化的面试题目
          </p>
          <Button 
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'generate' })}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI生成题目
          </Button>
        </div>
      </div>
    </div>
  );
};