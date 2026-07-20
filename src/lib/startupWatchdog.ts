// Startup Watchdog & High-Resolution Logging System for Roy Share
// Tracks and diagnostics the 20 production audit checkpoints.

export interface WatchdogLog {
  timestamp: string;
  elapsedMs: number;
  stepId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'INFO';
  details?: any;
}

export interface StepStatus {
  id: string;
  name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  lastUpdated: number;
  details?: string;
}

class StartupWatchdog {
  private logs: WatchdogLog[] = [];
  private startTime = performance.now();
  private listeners: ((watchdog: StartupWatchdog) => void)[] = [];
  private hangTimeoutId: any = null;
  private isHung = false;
  private reRenderCounts = new Map<string, number>();

  public steps: Record<string, StepStatus> = {
    '1': { id: '1', name: 'Telegram WebApp Initialization', status: 'NOT_STARTED', lastUpdated: 0 },
    '2': { id: '2', name: 'React App Bootstrap', status: 'NOT_STARTED', lastUpdated: 0 },
    '3': { id: '3', name: 'Routing & Navigation', status: 'NOT_STARTED', lastUpdated: 0 },
    '4': { id: '4', name: 'Authentication state', status: 'NOT_STARTED', lastUpdated: 0 },
    '5': { id: '5', name: 'Firebase SDK Initialization', status: 'NOT_STARTED', lastUpdated: 0 },
    '6': { id: '6', name: 'Firestore Database Initialization', status: 'NOT_STARTED', lastUpdated: 0 },
    '7': { id: '7', name: 'Backend API Connectivity Check', status: 'NOT_STARTED', lastUpdated: 0 },
    '8': { id: '8', name: 'Environment variables assessment', status: 'NOT_STARTED', lastUpdated: 0 },
    '9': { id: '9', name: 'Service Worker Verification', status: 'NOT_STARTED', lastUpdated: 0 },
    '10': { id: '10', name: 'Bundle Asset Loading', status: 'NOT_STARTED', lastUpdated: 0 },
    '11': { id: '11', name: 'Dynamic Module Imports', status: 'NOT_STARTED', lastUpdated: 0 },
    '12': { id: '12', name: 'Suspense/Lazy Loading Boundaries', status: 'NOT_STARTED', lastUpdated: 0 },
    '13': { id: '13', name: 'Global Context Providers Mounting', status: 'NOT_STARTED', lastUpdated: 0 },
    '14': { id: '14', name: 'Error Boundaries Initialization', status: 'NOT_STARTED', lastUpdated: 0 },
    '15': { id: '15', name: 'Unhandled Promise Rejections Handler', status: 'NOT_STARTED', lastUpdated: 0 },
    '16': { id: '16', name: 'Global Console Errors Interceptor', status: 'NOT_STARTED', lastUpdated: 0 },
    '17': { id: '17', name: 'Network Connectivity Assessment', status: 'NOT_STARTED', lastUpdated: 0 },
    '18': { id: '18', name: 'Infinite useEffect Re-render Loop Protection', status: 'NOT_STARTED', lastUpdated: 0 },
    '19': { id: '19', name: 'Firestore Subscription Listeners State', status: 'NOT_STARTED', lastUpdated: 0 },
    '20': { id: '20', name: 'Startup Config API Fetching (Non-blocking)', status: 'NOT_STARTED', lastUpdated: 0 },
  };

  constructor() {
    this.initGlobalHandlers();
    this.startHangingTimer();
    this.log('watchdog_init', 'INFO', { message: 'Startup Watchdog initialized' });
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // Point 15: Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorMsg = event.reason?.message || String(event.reason);
      const stack = event.reason?.stack || '';
      console.error('[WATCHDOG] Unhandled Promise Rejection captured:', errorMsg, stack);
      this.log('unhandled_promise_rejection', 'FAILED', { error: errorMsg, stack });
      this.updateStep('15', 'FAILED', `Captured: ${errorMsg}`);
    });

    // Point 16: Global Runtime Errors
    window.addEventListener('error', (event) => {
      const errorMsg = event.message || 'Unknown global runtime error';
      const file = event.filename || '';
      const line = event.lineno || 0;
      console.error('[WATCHDOG] Global runtime error captured:', errorMsg, { file, line });
      this.log('global_runtime_error', 'FAILED', { error: errorMsg, file, line });
      this.updateStep('16', 'FAILED', `Captured: ${errorMsg} in ${file}:${line}`);
    });

    // Point 17: Network Online/Offline
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      console.log(`[WATCHDOG] Network state change detected. Online: ${isOnline}`);
      this.log('network_status', 'INFO', { isOnline });
      this.updateStep('17', isOnline ? 'COMPLETED' : 'FAILED', isOnline ? 'Device is online' : 'Device is offline');
    };
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus(); // initial check
  }

  private startHangingTimer() {
    if (typeof window === 'undefined') return;
    
    // Set watchdog alarm for 5.5 seconds. If the application has not reported complete,
    // we set isHung to true and notify listeners so the UI can adapt gracefully.
    this.hangTimeoutId = setTimeout(() => {
      // Check if critical steps are still not completed
      const criticalSteps = ['1', '2', '4', '5', '6', '13'];
      const incomplete = criticalSteps.filter(id => this.steps[id].status !== 'COMPLETED');
      
      if (incomplete.length > 0) {
        this.isHung = true;
        console.warn('[WATCHDOG] Hang detected! Critical steps still incomplete:', incomplete.map(id => `${id} (${this.steps[id].name})`));
        this.log('startup_hang_detected', 'FAILED', { incompleteSteps: incomplete });
        this.notify();
      }
    }, 5500);
  }

  public log(stepId: string, status: WatchdogLog['status'], details?: any) {
    const elapsed = performance.now() - this.startTime;
    const logItem: WatchdogLog = {
      timestamp: new Date().toISOString(),
      elapsedMs: Math.round(elapsed),
      stepId,
      status,
      details
    };
    this.logs.push(logItem);
    
    // Format a beautiful log line for production transparency
    const statusSymbol = status === 'SUCCESS' ? '✓' : status === 'FAILED' ? '✗' : 'ℹ';
    console.log(`%c[WATCHDOG] ${statusSymbol} [${Math.round(elapsed)}ms] ${stepId}: ${status}`, 
      status === 'FAILED' ? 'color: #ef4444; font-weight: bold;' : 
      status === 'SUCCESS' ? 'color: #22c55e;' : 'color: #3b82f6;', 
      details || ''
    );
  }

  public updateStep(id: string, status: StepStatus['status'], details?: string) {
    if (!this.steps[id]) return;
    
    this.steps[id].status = status;
    this.steps[id].lastUpdated = Date.now();
    if (details) {
      this.steps[id].details = details;
    }
    
    this.log(`Step_${id}`, status === 'COMPLETED' ? 'SUCCESS' : status === 'FAILED' ? 'FAILED' : 'INFO', { 
      stepName: this.steps[id].name, 
      details 
    });

    // If a critical step is solved, re-evaluate hang state
    if (this.isHung) {
      const criticalSteps = ['1', '2', '4', '5', '6', '13'];
      const incomplete = criticalSteps.filter(cid => this.steps[cid].status !== 'COMPLETED');
      if (incomplete.length === 0) {
        this.isHung = false;
        console.log('[WATCHDOG] Hang cleared: All critical startup steps resolved.');
        this.log('startup_hang_cleared', 'SUCCESS');
      }
    }

    this.notify();
  }

  // Point 18: Protect against infinite useEffect re-render loops
  public trackComponentRender(componentName: string) {
    const currentCount = this.reRenderCounts.get(componentName) || 0;
    const newCount = currentCount + 1;
    this.reRenderCounts.set(componentName, newCount);

    if (newCount > 40) { // arbitrary threshold for rapid re-renders within startup window
      console.error(`[WATCHDOG] [INFINITE LOOP DETECTED] Component ${componentName} has rendered ${newCount} times in quick succession!`);
      this.log('infinite_loop_detected', 'FAILED', { componentName, renderCount: newCount });
      this.updateStep('18', 'FAILED', `Infinite loop suspected in component: ${componentName}`);
      throw new Error(`Infinite loop guard triggered for component: ${componentName}. Rendering halted.`);
    }
    
    // Periodic reset of counter to avoid false positives on long-running sessions
    setTimeout(() => {
      const count = this.reRenderCounts.get(componentName) || 0;
      if (count > 0) {
        this.reRenderCounts.set(componentName, Math.max(0, count - 1));
      }
    }, 2000);
  }

  public markAppReady() {
    if (this.hangTimeoutId) {
      clearTimeout(this.hangTimeoutId);
    }
    this.isHung = false;
    this.updateStep('2', 'COMPLETED', 'React application successfully booted and rendered root view.');
    this.log('app_fully_ready', 'SUCCESS', { totalBootTimeMs: Math.round(performance.now() - this.startTime) });
  }

  public subscribe(callback: (watchdog: StartupWatchdog) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l(this);
      } catch (e) {
        console.error('[WATCHDOG] Subscriber notification error:', e);
      }
    });
  }

  public getLogs(): WatchdogLog[] {
    return [...this.logs];
  }

  public getHangState(): boolean {
    return this.isHung;
  }
}

export const watchdog = new StartupWatchdog();

// Expose on global window for remote diagnostics
if (typeof window !== 'undefined') {
  (window as any)._startupWatchdog = watchdog;
  (window as any).getStartupLogs = () => watchdog.getLogs();
}
