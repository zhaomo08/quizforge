import { storage } from './storage';
import { testUtils } from './testUtils';

export interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'goal' | 'streak' | 'improvement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';

export const notificationSystem = {
  // Get all notifications
  getNotifications: (): Notification[] => {
    const notifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return notifications ? JSON.parse(notifications) : [];
  },

  // Add a new notification
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void => {
    const notifications = notificationSystem.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    const trimmedNotifications = notifications.slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(trimmedNotifications));
  },

  // Mark notification as read
  markAsRead: (notificationId: string): void => {
    const notifications = notificationSystem.getNotifications();
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
  },

  // Mark all notifications as read
  markAllAsRead: (): void => {
    const notifications = notificationSystem.getNotifications();
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
  },

  // Delete notification
  deleteNotification: (notificationId: string): void => {
    const notifications = notificationSystem.getNotifications();
    const filteredNotifications = notifications.filter(notif => notif.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filteredNotifications));
  },

  // Get unread count
  getUnreadCount: (): number => {
    const notifications = notificationSystem.getNotifications();
    return notifications.filter(notif => !notif.read).length;
  },

  // Check for new notifications based on user activity
  checkForNotifications: (): void => {
    const testResults = storage.getTestResults();
    const stats = testUtils.getUserStats();
    const lastCheck = localStorage.getItem('last_notification_check');
    const now = new Date();
    
    // Update last check time
    localStorage.setItem('last_notification_check', now.toISOString());

    if (testResults.length === 0) return;

    // Check for study reminders
    const lastTest = testResults[testResults.length - 1];
    const daysSinceLastTest = Math.floor(
      (now.getTime() - new Date(lastTest.completedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastTest >= 3) {
      notificationSystem.addNotification({
        type: 'reminder',
        title: '学习提醒',
        message: `距离上次测试已经${daysSinceLastTest}天了，保持学习节奏很重要哦！`,
        priority: 'medium',
        actionUrl: 'category'
      });
    }

    // Check for achievements
    if (stats.averageScore >= 90 && !notificationSystem.hasRecentNotification('achievement', '学霸成就')) {
      notificationSystem.addNotification({
        type: 'achievement',
        title: '🏆 学霸成就解锁',
        message: '恭喜！你的平均得分达到了90%以上，真是太棒了！',
        priority: 'high'
      });
    }

    if (stats.totalTests >= 50 && !notificationSystem.hasRecentNotification('achievement', '勤奋学习者')) {
      notificationSystem.addNotification({
        type: 'achievement',
        title: '🎯 勤奋学习者',
        message: '已完成50次测试！你的坚持和努力值得赞赏！',
        priority: 'high'
      });
    }

    // Check for improvement
    const recentTests = testResults.slice(-5);
    const olderTests = testResults.slice(-10, -5);
    
    if (recentTests.length >= 5 && olderTests.length >= 5) {
      const recentAvg = recentTests.reduce((sum, test) => sum + test.score, 0) / recentTests.length;
      const olderAvg = olderTests.reduce((sum, test) => sum + test.score, 0) / olderTests.length;
      
      if (recentAvg > olderAvg + 15 && !notificationSystem.hasRecentNotification('improvement', '快速进步')) {
        notificationSystem.addNotification({
          type: 'improvement',
          title: '📈 快速进步',
          message: `最近的表现比之前提升了${Math.round(recentAvg - olderAvg)}%，继续保持！`,
          priority: 'high'
        });
      }
    }

    // Check streak
    const currentStreak = notificationSystem.calculateStreak(testResults);
    if (currentStreak >= 7 && !notificationSystem.hasRecentNotification('streak', '一周连击')) {
      notificationSystem.addNotification({
        type: 'streak',
        title: '🔥 一周连击',
        message: '连续学习7天！你的坚持让人敬佩！',
        priority: 'high'
      });
    }

    // Check for goals (if goals system is implemented)
    notificationSystem.checkGoalNotifications();
  },

  // Helper function to check if a similar notification exists recently
  hasRecentNotification: (type: string, titleKeyword: string): boolean => {
    const notifications = notificationSystem.getNotifications();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return notifications.some(notif => 
      notif.type === type && 
      notif.title.includes(titleKeyword) &&
      new Date(notif.createdAt) > oneDayAgo
    );
  },

  // Calculate current streak
  calculateStreak: (testResults: any[]): number => {
    if (testResults.length === 0) return 0;
    
    const sortedResults = testResults.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    const lastTestDate = new Date(sortedResults[0].completedAt);
    const daysSinceLastTest = Math.floor(
      (today.getTime() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastTest <= 1) {
      streak = 1;
      let currentDate = new Date(lastTestDate);
      
      for (let i = 1; i < sortedResults.length; i++) {
        const testDate = new Date(sortedResults[i].completedAt);
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
    
    return streak;
  },

  // Check for goal-related notifications
  checkGoalNotifications: (): void => {
    const goalsData = localStorage.getItem('learning_goals');
    if (!goalsData) return;
    
    const goals = JSON.parse(goalsData);
    const now = new Date();
    
    goals.forEach((goal: any) => {
      if (goal.completed) return;
      
      // Check if goal is achieved
      const currentProgress = notificationSystem.calculateGoalProgress(goal);
      if (currentProgress >= goal.target && !notificationSystem.hasRecentNotification('goal', goal.title)) {
        notificationSystem.addNotification({
          type: 'goal',
          title: '🎯 目标达成',
          message: `恭喜！你已经完成了目标"${goal.title}"！`,
          priority: 'high'
        });
      }
      
      // Check deadline reminders
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const daysUntilDeadline = Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilDeadline === 3 && !notificationSystem.hasRecentNotification('goal', '即将到期')) {
          notificationSystem.addNotification({
            type: 'goal',
            title: '⏰ 目标即将到期',
            message: `目标"${goal.title}"还有3天就要到期了，加油冲刺！`,
            priority: 'medium'
          });
        }
      }
    });
  },

  // Calculate goal progress (simplified version)
  calculateGoalProgress: (goal: any): number => {
    const stats = testUtils.getUserStats();
    
    switch (goal.type) {
      case 'score':
        return stats.averageScore;
      case 'tests':
        return stats.totalTests;
      case 'category':
        return Object.keys(stats.categoryStats).length;
      default:
        return 0;
    }
  },

  // Initialize notification system
  init: (): void => {
    // Check for notifications on app start
    notificationSystem.checkForNotifications();
    
    // Set up periodic checks (every 30 minutes)
    setInterval(() => {
      notificationSystem.checkForNotifications();
    }, 30 * 60 * 1000);
  },

  // Request browser notification permission
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Show browser notification
  showBrowserNotification: (notification: Notification): void => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }
};