import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Minus, 
  Play, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Save,
  Upload,
  Download
} from 'lucide-react';

interface BatchGenerationItem {
  id: string;
  category: string;
  difficulty: string;
  count: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  generatedCount?: number;
}

interface BatchGenerationToolProps {
  onGenerate: (items: BatchGenerationItem[]) => Promise<void>;
  isGenerating: boolean;
}

export const BatchGenerationTool: React.FC<BatchGenerationToolProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [batchItems, setBatchItems] = useState<BatchGenerationItem[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Array<{
    name: string;
    items: Omit<BatchGenerationItem, 'id' | 'status'>[];
  }>>([]);

  const categories = [
    { id: 'java', name: 'Java' },
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'database', name: '数据库' },
    { id: 'algorithm', name: '算法与数据结构' },
    { id: 'system-design', name: '系统设计' },
    { id: 'operating-system', name: '操作系统' },
  ];

  const difficulties = [
    { id: 'easy', name: '简单' },
    { id: 'medium', name: '中等' },
    { id: 'hard', name: '困难' },
  ];

  // 加载保存的模板
  React.useEffect(() => {
    const templates = localStorage.getItem('batch_generation_templates');
    if (templates) {
      setSavedTemplates(JSON.parse(templates));
    }
  }, []);

  const addBatchItem = () => {
    const newItem: BatchGenerationItem = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      category: 'java',
      difficulty: 'medium',
      count: 10,
      status: 'pending'
    };
    setBatchItems([...batchItems, newItem]);
  };

  const removeBatchItem = (id: string) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  const updateBatchItem = (id: string, updates: Partial<BatchGenerationItem>) => {
    setBatchItems(batchItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleStartBatch = async () => {
    if (batchItems.length === 0) return;
    
    // 重置所有项目状态
    const resetItems = batchItems.map(item => ({
      ...item,
      status: 'pending' as const,
      progress: 0,
      error: undefined,
      generatedCount: 0
    }));
    setBatchItems(resetItems);
    
    await onGenerate(resetItems);
  };

  const saveTemplate = () => {
    if (!templateName.trim() || batchItems.length === 0) return;

    const template = {
      name: templateName.trim(),
      items: batchItems.map(({ id, status, progress, error, generatedCount, ...item }) => ({
        ...item
      }))
    };

    const updatedTemplates = [...savedTemplates, template];
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('batch_generation_templates', JSON.stringify(updatedTemplates));
    setTemplateName('');
  };

  const loadTemplate = (template: typeof savedTemplates[0]) => {
    const newItems: BatchGenerationItem[] = template.items.map((item, index) => ({
      ...item,
      id: `batch_${Date.now()}_${index}`,
      status: 'pending' as const
    }));
    setBatchItems(newItems);
  };

  const deleteTemplate = (templateName: string) => {
    const updatedTemplates = savedTemplates.filter(t => t.name !== templateName);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('batch_generation_templates', JSON.stringify(updatedTemplates));
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string);
        
        // 验证模板格式
        if (!importedTemplate.name || !Array.isArray(importedTemplate.items)) {
          alert('导入失败：模板格式不正确');
          return;
        }

        // 检查是否已存在同名模板
        const existingTemplate = savedTemplates.find(t => t.name === importedTemplate.name);
        if (existingTemplate) {
          if (!confirm(`模板 "${importedTemplate.name}" 已存在，是否覆盖？`)) {
            return;
          }
        }

        // 更新模板列表
        const updatedTemplates = existingTemplate 
          ? savedTemplates.map(t => t.name === importedTemplate.name ? importedTemplate : t)
          : [...savedTemplates, importedTemplate];
        
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('batch_generation_templates', JSON.stringify(updatedTemplates));
        
        alert('模板导入成功！');
      } catch (error) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleExportTemplate = (template: typeof savedTemplates[0]) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `batch-template-${template.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const getTotalQuestions = () => {
    return batchItems.reduce((sum, item) => sum + item.count, 0);
  };

  const getCompletedCount = () => {
    return batchItems.filter(item => item.status === 'completed').length;
  };

  const getStatusIcon = (status: BatchGenerationItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: BatchGenerationItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 dark:bg-gray-800';
      case 'generating': return 'bg-blue-50 dark:bg-blue-950';
      case 'completed': return 'bg-green-50 dark:bg-green-950';
      case 'failed': return 'bg-red-50 dark:bg-red-950';
    }
  };

  return (
    <div className="space-y-6">
      {/* 批量生成配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              批量生成配置
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={addBatchItem}
              disabled={isGenerating}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加任务
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batchItems.length === 0 ? (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                点击"添加任务"开始配置批量生成。你可以同时生成多个类别和难度的题目。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {batchItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${getStatusColor(item.status)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">任务 {index + 1}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateBatchItem(item.id, { category: value })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={item.difficulty}
                        onValueChange={(value) => updateBatchItem(item.id, { difficulty: value })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map(diff => (
                            <SelectItem key={diff.id} value={diff.id}>
                              {diff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={item.count.toString()}
                        onValueChange={(value) => updateBatchItem(item.id, { count: parseInt(value) })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 题</SelectItem>
                          <SelectItem value="10">10 题</SelectItem>
                          <SelectItem value="15">15 题</SelectItem>
                          <SelectItem value="20">20 题</SelectItem>
                          <SelectItem value="30">30 题</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* 策略选择已移除 */}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBatchItem(item.id)}
                      disabled={isGenerating}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 进度和状态信息 */}
                  {item.status === 'generating' && item.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>生成进度</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ 成功生成 {item.generatedCount} 道题目
                    </div>
                  )}

                  {item.status === 'failed' && item.error && (
                    <div className="mt-2 text-sm text-red-600">
                      ❌ 生成失败: {item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 批量操作按钮 */}
          {batchItems.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-muted-foreground">
                共 {batchItems.length} 个任务，预计生成 {getTotalQuestions()} 道题目
                {isGenerating && (
                  <span className="ml-2">
                    ({getCompletedCount()}/{batchItems.length} 已完成)
                  </span>
                )}
              </div>
              
              <Button
                onClick={handleStartBatch}
                disabled={isGenerating || batchItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    批量生成中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    开始批量生成
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 模板管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Save className="h-5 w-5 mr-2" />
              生成模板
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplate}
                className="hidden"
                id="import-template"
              />
              <label htmlFor="import-template">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                  asChild
                >
                  <div className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    导入模板
                  </div>
                </Button>
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 保存模板 */}
          {batchItems.length > 0 && (
            <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="输入模板名称..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
                <Button
                  onClick={saveTemplate}
                  disabled={!templateName.trim()}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存模板
                </Button>
              </div>
            </div>
          )}

          {/* 已保存的模板 */}
          {savedTemplates.length === 0 ? (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                暂无保存的模板。配置好批量生成任务后，可以保存为模板以便重复使用。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {savedTemplates.map((template, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-foreground">
                      {template.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">
                        {template.items.length} 个任务
                      </Badge>
                      <Badge variant="outline">
                        {template.items.reduce((sum, item) => sum + item.count, 0)} 题
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(template)}
                      disabled={isGenerating}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      加载
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportTemplate(template)}
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      导出
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.name)}
                      disabled={isGenerating}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};