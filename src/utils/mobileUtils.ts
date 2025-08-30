// 移动端工具函数
export class MobileUtils {
  // 检测是否为移动设备
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    // 检测屏幕宽度
    const screenWidth = window.innerWidth;
    if (screenWidth <= 768) return true;
    
    // 检测用户代理
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 
      'blackberry', 'windows phone', 'mobile'
    ];
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }

  // 检测是否为平板设备
  static isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    
    const screenWidth = window.innerWidth;
    return screenWidth > 768 && screenWidth <= 1024;
  }

  // 检测是否为触摸设备
  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           (navigator as any).msMaxTouchPoints > 0;
  }

  // 获取屏幕尺寸类别
  static getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  // 检测是否为iOS设备
  static isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // 检测是否为Android设备
  static isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android/.test(navigator.userAgent);
  }

  // 获取安全区域信息（用于处理刘海屏等）
  static getSafeAreaInsets() {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
    
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    };
  }

  // 防止iOS Safari的橡皮筋效果
  static preventBounce() {
    if (!this.isIOS()) return;
    
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) return;
      
      const target = e.target as HTMLElement;
      const scrollable = target.closest('[data-scrollable]') || 
                        target.closest('.overflow-auto') ||
                        target.closest('.overflow-y-auto');
      
      if (!scrollable) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // 优化移动端点击延迟
  static optimizeTouchResponse() {
    if (!this.isTouchDevice()) return;
    
    // 添加CSS来消除点击延迟
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      
      button, [role="button"], .clickable {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  // 处理虚拟键盘
  static handleVirtualKeyboard() {
    if (!this.isMobile()) return;
    
    let initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialViewportHeight - currentHeight;
      
      // 如果高度减少超过150px，认为是虚拟键盘弹出
      if (heightDiff > 150) {
        document.body.classList.add('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', `${heightDiff}px`);
      } else {
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.removeProperty('--keyboard-height');
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        initialViewportHeight = window.innerHeight;
        handleResize();
      }, 500);
    });
  }

  // 获取设备像素比
  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  // 检测网络连接状态
  static getNetworkInfo() {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return { effectiveType: 'unknown', downlink: 0, rtt: 0 };
    }
    
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }

  // 检测是否为慢速网络
  static isSlowNetwork(): boolean {
    const network = this.getNetworkInfo();
    return network.effectiveType === 'slow-2g' || 
           network.effectiveType === '2g' ||
           network.saveData;
  }

  // 优化移动端滚动
  static optimizeScrolling() {
    if (!this.isMobile()) return;
    
    // 添加平滑滚动
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      
      .scroll-container {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
    `;
    document.head.appendChild(style);
  }

  // 初始化移动端优化
  static initMobileOptimizations() {
    if (typeof window === 'undefined') return;
    
    this.preventBounce();
    this.optimizeTouchResponse();
    this.handleVirtualKeyboard();
    this.optimizeScrolling();
    
    // 设置viewport meta标签
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
    
    // 添加移动端CSS变量
    document.documentElement.style.setProperty('--is-mobile', this.isMobile() ? '1' : '0');
    document.documentElement.style.setProperty('--is-touch', this.isTouchDevice() ? '1' : '0');
    document.documentElement.style.setProperty('--screen-size', this.getScreenSize());
  }
}

// React Hook for mobile detection
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  React.useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(MobileUtils.isMobile());
      setIsTablet(MobileUtils.isTablet());
      setScreenSize(MobileUtils.getScreenSize());
    };
    
    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    window.addEventListener('orientationchange', updateMobileState);
    
    return () => {
      window.removeEventListener('resize', updateMobileState);
      window.removeEventListener('orientationchange', updateMobileState);
    };
  }, []);
  
  return {
    isMobile,
    isTablet,
    screenSize,
    isTouchDevice: MobileUtils.isTouchDevice(),
    isSlowNetwork: MobileUtils.isSlowNetwork()
  };
}

// React Hook for safe area
export function useSafeArea() {
  const [safeArea, setSafeArea] = React.useState({ top: 0, bottom: 0, left: 0, right: 0 });
  
  React.useEffect(() => {
    const updateSafeArea = () => {
      setSafeArea(MobileUtils.getSafeAreaInsets());
    };
    
    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);
    
    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);
  
  return safeArea;
}

// 导入React（如果在单独的文件中需要）
import React from 'react';