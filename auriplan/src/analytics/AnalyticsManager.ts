import { EventEmitter } from '../utils/EventEmitter';

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  sampleRate: number;
  batchSize: number;
  flushInterval: number;
  anonymizeIp: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  trackUsage: boolean;
}

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface SessionInfo {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  device: {
    type: 'desktop' | 'tablet' | 'mobile';
    os: string;
    browser: string;
    screenSize: { width: number; height: number };
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  cumulativeLayoutShift?: number;
}

export interface UsageMetrics {
  toolsUsed: Map<string, number>;
  featuresUsed: Map<string, number>;
  actionsPerformed: Map<string, number>;
  timeSpent: number;
  objectsCreated: number;
  objectsModified: number;
  objectsDeleted: number;
}

export class AnalyticsManager extends EventEmitter {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private session: SessionInfo;
  private usageMetrics: UsageMetrics;
  private flushIntervalId: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      sampleRate: 1.0,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      anonymizeIp: true,
      trackErrors: true,
      trackPerformance: true,
      trackUsage: true,
      ...config
    };

    this.session = this.createSession();
    this.usageMetrics = this.createUsageMetrics();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private createSession(): SessionInfo {
    return {
      id: this.generateId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
      device: this.detectDevice(),
    };
  }

  private createUsageMetrics(): UsageMetrics {
    return {
      toolsUsed: new Map(),
      featuresUsed: new Map(),
      actionsPerformed: new Map(),
      timeSpent: 0,
      objectsCreated: 0,
      objectsModified: 0,
      objectsDeleted: 0,
    };
  }

  private detectDevice(): SessionInfo['device'] {
    const ua = navigator.userAgent;
    const width = window.screen.width;
    const height = window.screen.height;

    // Detect device type
    let type: 'desktop' | 'tablet' | 'mobile' = 'desktop';
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
      type = 'tablet';
    } else if (/Mobile|iP(hone|od)|Android/i.test(ua)) {
      type = 'mobile';
    }

    // Detect OS
    let os = 'Unknown';
    if (/Windows NT 10/.test(ua)) os = 'Windows 10';
    else if (/Windows NT 6.3/.test(ua)) os = 'Windows 8.1';
    else if (/Windows NT 6.2/.test(ua)) os = 'Windows 8';
    else if (/Windows NT 6.1/.test(ua)) os = 'Windows 7';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iOS|iPhone|iPad|iPod/.test(ua)) os = 'iOS';

    // Detect browser
    let browser = 'Unknown';
    if (/Chrome/.test(ua) && !/Edge/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';
    else if (/Edge/.test(ua)) browser = 'Edge';
    else if (/Opera|OPR/.test(ua)) browser = 'Opera';

    return {
      type,
      os,
      browser,
      screenSize: { width, height },
    };
  }

  public initialize(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // Setup event listeners
    this.setupEventListeners();

    // Track performance metrics
    if (this.config.trackPerformance) {
      this.trackPerformanceMetrics();
    }

    // Start flush interval
    this.startFlushInterval();

    // Track page view
    this.trackPageView();

    this.emit('initialized');
  }

  private setupEventListeners(): void {
    // Track errors
    if (this.config.trackErrors) {
      window.addEventListener('error', (event) => {
        this.trackError(event.error, event.message, event.filename, event.lineno);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(event.reason, 'Unhandled Promise Rejection');
      });
    }

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackEvent('session', 'page_hidden');
        this.flush();
      } else {
        this.trackEvent('session', 'page_visible');
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session', 'page_unload');
      this.flush();
    });

    // Track online/offline
    window.addEventListener('online', () => {
      this.trackEvent('network', 'online');
    });

    window.addEventListener('offline', () => {
      this.trackEvent('network', 'offline');
    });
  }

  private trackPerformanceMetrics(): void {
    // Use Performance API
    if ('performance' in window) {
      // Page load time
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const metrics: PerformanceMetrics = {
              pageLoadTime: navigation.loadEventEnd - navigation.startTime,
              firstPaint: 0,
              firstContentfulPaint: 0,
            };

            // Get paint metrics
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach((entry) => {
              if (entry.name === 'first-paint') {
                metrics.firstPaint = entry.startTime;
              } else if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime;
              }
            });

            this.trackEvent('performance', 'page_load', undefined, metrics.pageLoadTime, metrics);
          }
        }, 0);
      });

      // Observe LCP
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackEvent('performance', 'largest_contentful_paint', undefined, lastEntry.startTime);
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }

        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.trackEvent('performance', 'cumulative_layout_shift', undefined, clsValue);
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // CLS not supported
        }
      }
    }
  }

  // Event tracking
  public trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled) return;

    // Sample rate check
    if (Math.random() > this.config.sampleRate) return;

    const event: AnalyticsEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.session.id,
      category,
      action,
      label,
      value,
      metadata,
    };

    this.events.push(event);
    this.session.events++;
    this.session.lastActivity = Date.now();

    this.emit('eventTracked', event);

    // Flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackPageView(path?: string): void {
    this.session.pageViews++;
    this.trackEvent('page', 'view', path || window.location.pathname);
  }

  public trackError(error: any, message?: string, filename?: string, lineno?: number): void {
    if (!this.config.trackErrors) return;

    const errorInfo = {
      message: message || (error?.message || 'Unknown error'),
      stack: error?.stack,
      filename,
      lineno,
    };

    this.trackEvent('error', 'exception', errorInfo.message, undefined, errorInfo);
  }

  public trackToolUsage(tool: string, action: string): void {
    if (!this.config.trackUsage) return;

    const count = this.usageMetrics.toolsUsed.get(tool) || 0;
    this.usageMetrics.toolsUsed.set(tool, count + 1);

    this.trackEvent('tool', action, tool);
  }

  public trackFeatureUsage(feature: string): void {
    if (!this.config.trackUsage) return;

    const count = this.usageMetrics.featuresUsed.get(feature) || 0;
    this.usageMetrics.featuresUsed.set(feature, count + 1);

    this.trackEvent('feature', 'used', feature);
  }

  public trackAction(action: string, details?: Record<string, any>): void {
    if (!this.config.trackUsage) return;

    const count = this.usageMetrics.actionsPerformed.get(action) || 0;
    this.usageMetrics.actionsPerformed.set(action, count + 1);

    this.trackEvent('action', action, undefined, undefined, details);
  }

  public trackObjectCreated(type: string): void {
    this.usageMetrics.objectsCreated++;
    this.trackEvent('object', 'created', type);
  }

  public trackObjectModified(type: string): void {
    this.usageMetrics.objectsModified++;
    this.trackEvent('object', 'modified', type);
  }

  public trackObjectDeleted(type: string): void {
    this.usageMetrics.objectsDeleted++;
    this.trackEvent('object', 'deleted', type);
  }

  public trackTiming(category: string, variable: string, time: number, label?: string): void {
    this.trackEvent('timing', category, `${variable}:${label || 'default'}`, time);
  }

  // Flush events
  public async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    this.emit('flushStarted', eventsToSend);

    try {
      if (this.config.endpoint) {
        await this.sendToEndpoint(eventsToSend);
      } else {
        // Log to console in development
        console.log('Analytics events:', eventsToSend);
      }

      this.emit('flushCompleted', eventsToSend);
    } catch (error) {
      // Put events back
      this.events.unshift(...eventsToSend);
      this.emit('flushError', error);
    }
  }

  private async sendToEndpoint(events: AnalyticsEvent[]): Promise<void> {
    const payload = {
      session: this.session,
      events,
      timestamp: Date.now(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Analytics endpoint error: ${response.status}`);
    }
  }

  private startFlushInterval(): void {
    if (this.flushIntervalId) return;

    this.flushIntervalId = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopFlushInterval(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
  }

  // Getters
  public getSession(): SessionInfo {
    return { ...this.session };
  }

  public getUsageMetrics(): UsageMetrics {
    return {
      ...this.usageMetrics,
      toolsUsed: new Map(this.usageMetrics.toolsUsed),
      featuresUsed: new Map(this.usageMetrics.featuresUsed),
      actionsPerformed: new Map(this.usageMetrics.actionsPerformed),
    };
  }

  public getPendingEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<AnalyticsConfig>): void {
    Object.assign(this.config, config);

    if (config.enabled === false) {
      this.stopFlushInterval();
    } else if (config.enabled === true && !this.flushIntervalId) {
      this.startFlushInterval();
    }

    this.emit('configChanged', this.config);
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  // Utility
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  public dispose(): void {
    this.stopFlushInterval();
    this.flush();
    this.removeAllListeners();
  }
}
