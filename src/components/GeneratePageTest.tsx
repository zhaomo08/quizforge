import React from 'react';
import { Button } from '@/components/ui/button';
import { AIService } from '@/utils/aiService';

// 简单的功能测试组件
export const GeneratePageTest: React.FC = () => {
  const testBasicFunctions = () => {
    console.log('=== AI生成页面功能测试 ===');
    
    // 测试 AIService 方法
    try {
      const modelHealth = AIService.getModelHealth();
      console.log('✅ getModelHealth 方法正常:', modelHealth);
    } catch (error) {
      console.error('❌ getModelHealth 方法失败:', error);
    }

    try {
      const currentModel = AIService.getCurrentModelInfo();
      console.log('✅ getCurrentModelInfo 方法正常:', currentModel);
    } catch (error) {
      console.error('❌ getCurrentModelInfo 方法失败:', error);
    }

    try {
      const allModels = AIService.getAllModels();
      console.log('✅ getAllModels 方法正常:', allModels.length, '个模型');
    } catch (error) {
      console.error('❌ getAllModels 方法失败:', error);
    }

    // 测试 API Key 验证
    const testKeys = [
      'sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef',
      'invalid-key',
      '',
      'sk-short'
    ];

    testKeys.forEach(key => {
      const isValid = AIService.validateApiKey(key);
      console.log(`API Key "${key.substring(0, 10)}..." 验证结果:`, isValid);
    });

    console.log('=== 测试完成 ===');
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">AI生成页面功能测试</h3>
      <Button onClick={testBasicFunctions}>
        运行基础功能测试
      </Button>
      <p className="text-sm text-gray-600 mt-2">
        点击按钮在控制台查看测试结果
      </p>
    </div>
  );
};