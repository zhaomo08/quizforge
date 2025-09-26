import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { notificationSystem, Notification } from '@/utils/notificationSystem';
import { useApp } from '@/contexts/AppContext';
import { SiteIcon } from '@/components/icons/SiteIcon';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (payload: { notifications: Notification[]; unread: number }) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onUpdate }) => {
  const { dispatch } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = () => {
    const allNotifications = notificationSystem.getNotifications();
    const unread = notificationSystem.getUnreadCount();
    setNotifications(allNotifications);
    setUnreadCount(unread);
    onUpdate?.({ notifications: allNotifications, unread });
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationSystem.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationSystem.markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (notificationId: string) => {
    notificationSystem.deleteNotification(notificationId);
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      dispatch({ type: 'SET_PAGE', payload: notification.actionUrl });
      onClose();
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'goal':
        return <Target className="h-5 w-5 text-blue-600" />;
      case 'improvement':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'streak':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'reminder':
        return <SiteIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <SiteIcon className="h-5 w-5 text-primary" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <SiteIcon className="h-5 w-5 text-primary" />
                <span>通知中心</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                查看你的学习提醒和成就通知
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>全部已读</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-6">
                <SiteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-muted-foreground">
                  暂无通知
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-blue-950 border-l-blue-500' 
                        : 'border-l-gray-300 dark:border-l-gray-600'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-foreground' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className={`text-sm ${
                            !notification.read 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-600 dark:text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                notification.priority === 'high' 
                                  ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-300'
                                  : notification.priority === 'medium'
                                  ? 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300'
                                  : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {notification.priority === 'high' ? '高优先级' : 
                               notification.priority === 'medium' ? '中优先级' : '低优先级'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Notification Bell Component for Navigation
export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load initial unread count
    const updateUnreadCount = () => {
      setUnreadCount(notificationSystem.getUnreadCount());
    };
    
    updateUnreadCount();
    
    // Set up periodic updates
    const interval = setInterval(updateUnreadCount, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <SiteIcon className="h-5 w-5 text-primary" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onUpdate={({ unread }) => setUnreadCount(unread)}
      />
    </>
  );
};