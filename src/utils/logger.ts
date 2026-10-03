// Centralized frontend logging utility for Instant ERP
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  action: string;
  message?: string;
  details?: any;
  error?: Error | string;
}

class SystemLogger {
  private inMemoryLogs: LogEntry[] = [];
  private maxLogs: number = 200;

  public info(action: string, details?: any, message?: string) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action,
      message,
      details,
    };
    this.addLog(entry);
    console.log(
      `%c[INSTANT-ERP]%c [INFO] %c${action}`,
      'background: #4f46e5; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
      'color: #3b82f6; font-weight: bold;',
      'color: #10b981; font-weight: bold;',
      message || details || ''
    );
  }

  public warn(action: string, details?: any, message?: string) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      level: 'warn',
      action,
      message,
      details,
    };
    this.addLog(entry);
    console.warn(
      `%c[INSTANT-ERP]%c [WARN] %c${action}`,
      'background: #f59e0b; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
      'color: #f59e0b; font-weight: bold;',
      'color: #d97706; font-weight: bold;',
      message || details || ''
    );
  }

  public error(action: string, error: any, details?: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      action,
      message: errorMsg,
      details,
      error: error instanceof Error ? error.stack : error,
    };
    this.addLog(entry);
    console.error(
      `%c[INSTANT-ERP]%c [ERROR] %c${action}`,
      'background: #ef4444; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
      'color: #ef4444; font-weight: bold;',
      'color: #dc2626; font-weight: bold;',
      errorMsg,
      details || '',
      error
    );
  }

  private addLog(entry: LogEntry) {
    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.pop();
    }
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.inMemoryLogs];
  }

  public clearLogs() {
    this.inMemoryLogs = [];
  }
}

export const logger = new SystemLogger();
