import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Target,
  Calendar,
  Trophy,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { storage } from '@/utils/storage';
import { testUtils } from '@/utils/testUtils';

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  type: 'score' | 'tests' | 'streak' | 'category';
  target: number;
  current: number;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

const GOAL_STORAGE_KEY = 'learning_goals';

export const LearningGoals: React.FC = () => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'score' as LearningGoal['type'],
    target: 0,
    deadline: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    const savedGoals = localStorage.getItem(GOAL_STORAGE_KEY);
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      const updatedGoals = parsedGoals.map((goal: LearningGoal) => ({
        ...goal,
        current: calculateCurrentProgress(goal)
      }));
      setGoals(updatedGoals);
    }
  };

  const saveGoals = (updatedGoals: LearningGoal[]) => {
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const calculateCurrentProgress = (goal: LearningGoal): number => {
    const stats = testUtils.getUserStats();
    const testResults = storage.getTestResults();

    switch (goal.type) {
      case 'score':
        return stats.averageScore;
      case 'tests':
        return stats.totalTests;
      case 'streak':
        // Calculate current streak
        const sortedResults = testResults.sort((a, b) => 
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
        let streak = 0;
        if (sortedResults.length > 0) {
          const today = new Date();
          const lastTestDate = new Date(sortedResults[0]!.completedAt);
          const daysSinceLastTest = Math.floor(
            (today.getTime() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastTest <= 1) {
            streak = 1;
            let currentDate = new Date(lastTestDate);

            for (let i = 1; i < sortedResults.length; i++) {
              const testDate = new Date(sortedResults[i]!.completedAt);
              const daysDiff = Math.floor(
                (currentDate.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              if (daysDiff <= 1) {
                streak++;
                currentDate = testDate;
              } else {
                break;
              }
            }
          }
        }
        return streak;
      case 'category':
        // For category goals, we'll use the number of different categories tested
        return Object.keys(stats.categoryStats).length;
      default:
        return 0;
    }
  };

  const addGoal = () => {
    if (!newGoal.title || newGoal.target <= 0) return;

    const goal: LearningGoal = {
      id: `goal_${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      target: newGoal.target,
      current: calculateCurrentProgress({ ...newGoal } as LearningGoal),
      completed: false,
      createdAt: new Date().toISOString()
    };
    if (newGoal.deadline) goal.deadline = newGoal.deadline;

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);
    
    setNewGoal({
      title: '',
      description: '',
      type: 'score',
      target: 0,
      deadline: ''
    });
    setIsAddingGoal(false);
  };

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
  };

  const toggleGoalCompletion = (goalId: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: !goal.completed }
        : goal
    );
    saveGoals(updatedGoals);
  };

  const getGoalProgress = (goal: LearningGoal) => {
    const progress = Math.min((goal.current / goal.target) * 100, 100);
    return Math.round(progress);
  };

  const getGoalStatus = (goal: LearningGoal) => {
    if (goal.completed) return 'completed';
    if (goal.current >= goal.target) return 'achieved';
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const today = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return 'overdue';
      if (daysLeft <= 3) return 'urgent';
    }
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'achieved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: LearningGoal['type']) => {
    switch (type) {
      case 'score': return '平均分';
      case 'tests': return '测试次数';
      case 'streak': return '连续天数';
      case 'category': return '学习领域';
      default: return type;
    }
  };

  const getTypeUnit = (type: LearningGoal['type']) => {
    switch (type) {
      case 'score': return '%';
      case 'tests': return '次';
      case 'streak': return '天';
      case 'category': return '个';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>学习目标</span>
            </CardTitle>
            <CardDescription>
              设定和跟踪你的学习目标，保持学习动力
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddingGoal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>添加目标</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Goal Form */}
        {isAddingGoal && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-title">目标标题</Label>
                <Input
                  id="goal-title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="例如：提高JavaScript测试成绩"
                />
              </div>
              
              <div>
                <Label htmlFor="goal-description">描述（可选）</Label>
                <Input
                  id="goal-description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="目标的详细描述"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="goal-type">目标类型</Label>
                  <select
                    id="goal-type"
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as LearningGoal['type'] })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="score">平均分目标</option>
                    <option value="tests">测试次数</option>
                    <option value="streak">连续学习天数</option>
                    <option value="category">学习领域数量</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="goal-target">目标值</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                    placeholder="目标数值"
                  />
                </div>
                
                <div>
                  <Label htmlFor="goal-deadline">截止日期（可选）</Label>
                  <Input
                    id="goal-deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={addGoal} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  保存目标
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingGoal(false)} 
                  size="sm"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-muted-foreground mb-4">
                还没有设定学习目标
              </p>
              <Button onClick={() => setIsAddingGoal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加第一个目标
              </Button>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = getGoalProgress(goal);
              const status = getGoalStatus(goal);
              
              return (
                <div
                  key={goal.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-foreground">
                          {goal.title}
                        </h4>
                        <Badge className={getStatusColor(status)}>
                          {status === 'completed' && '已完成'}
                          {status === 'achieved' && '已达成'}
                          {status === 'overdue' && '已逾期'}
                          {status === 'urgent' && '即将到期'}
                          {status === 'active' && '进行中'}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-muted-foreground">
                        <span>
                          {getTypeLabel(goal.type)}: {goal.current}/{goal.target}{getTypeUnit(goal.type)}
                        </span>
                        {goal.deadline && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(goal.deadline).toLocaleDateString('zh-CN')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {status === 'achieved' && !goal.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleGoalCompletion(goal.id)}
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-muted-foreground">进度</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress >= 100 
                            ? 'bg-green-500' 
                            : progress >= 75 
                            ? 'bg-blue-500' 
                            : progress >= 50 
                            ? 'bg-yellow-500' 
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};