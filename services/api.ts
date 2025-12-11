import { User, Employee, Evaluation, AuditLog, Notification, CriteriaConfig } from '../types';
import usersSample from '../data/users.sample.json';
import employeesSample from '../data/employees.sample.json';
import evaluationsSample from '../data/evaluations.sample.json';

// --- Interfaces ---
export interface ApiService {
  getUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  
  getEmployees(): Promise<Employee[]>;
  saveEmployees(employees: Employee[]): Promise<void>;
  
  getEvaluations(): Promise<Evaluation[]>;
  saveEvaluations(evaluations: Evaluation[]): Promise<void>;

  // Logs
  getLogs(): Promise<AuditLog[]>;
  addLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<void>;
  markNotificationRead(id: string): Promise<void>;

  // Criteria
  getCriteria(): Promise<CriteriaConfig>;
  saveCriteria(config: CriteriaConfig): Promise<void>;
}

// --- File Service (Real Backend) ---
const API_BASE = `http://${window.location.hostname}:3001/api`;

class FileApiService implements ApiService {
  private async fetchJson<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  }
  private async postJson(endpoint: string, data: any): Promise<void> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  }

  async getUsers() { return this.fetchJson<User[]>('/users'); }
  async saveUsers(data: User[]) { return this.postJson('/users', data); }

  async getEmployees() { return this.fetchJson<Employee[]>('/employees'); }
  async saveEmployees(data: Employee[]) { return this.postJson('/employees', data); }

  async getEvaluations() { return this.fetchJson<Evaluation[]>('/evaluations'); }
  async saveEvaluations(data: Evaluation[]) { return this.postJson('/evaluations', data); }

  async getLogs() { return this.fetchJson<AuditLog[]>('/logs'); }
  async addLog(log: Omit<AuditLog, 'id' | 'timestamp'>) { return this.postJson('/logs', log); }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
      return this.fetchJson<Notification[]>('/notifications');
  }
  async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
      return this.postJson('/notifications', notif);
  }
  async markNotificationRead(id: string): Promise<void> {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  }

  // Criteria
  async getCriteria(): Promise<CriteriaConfig> { return this.fetchJson<CriteriaConfig>('/criteria'); }
  async saveCriteria(config: CriteriaConfig): Promise<void> { return this.postJson('/criteria', config); }
}

// --- Mock Service (LocalStorage + Sample Data) ---
class MockApiService implements ApiService {
  private load<T>(key: string, defaultData: any): T {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    // Initialize with default
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData as T;
  }

  private save(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getUsers() { 
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));
    return this.load<User[]>('mock_users', usersSample); 
  }
  async saveUsers(data: User[]) { 
    this.save('mock_users', data); 
  }

  async getEmployees() { 
    await new Promise(r => setTimeout(r, 300));
    return this.load<Employee[]>('mock_employees', employeesSample); 
  }
  async saveEmployees(data: Employee[]) { 
    this.save('mock_employees', data); 
  }

  async getEvaluations() { 
    await new Promise(r => setTimeout(r, 300));
    return this.load<Evaluation[]>('mock_evaluations', evaluationsSample); 
  }
  async saveEvaluations(data: Evaluation[]) { 
    this.save('mock_evaluations', data); 
  }

  async getLogs() { 
    return this.load<AuditLog[]>('mock_audit_logs', []); 
  }
  async addLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
      const logs = await this.getLogs();
      const newLog: AuditLog = {
          ...log,
          id: `L${Date.now()}`,
          timestamp: new Date().toISOString()
      };
      this.save('mock_audit_logs', [newLog, ...logs]);
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
      return this.load<Notification[]>('mock_notifications', []);
  }
  async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
      const list = await this.getNotifications();
      const newNotif: Notification = {
          ...notif,
          id: `N${Date.now()}`,
          timestamp: new Date().toISOString(),
          isRead: false
      };
      this.save('mock_notifications', [newNotif, ...list]);
  }
  async markNotificationRead(id: string): Promise<void> {
      const list = await this.getNotifications();
      const updated = list.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n);
      this.save('mock_notifications', updated);
  }

  // Criteria
  async getCriteria(): Promise<CriteriaConfig> {
      // Return default if not found
      return this.load<CriteriaConfig>('mock_criteria', {});
  }
  async saveCriteria(config: CriteriaConfig): Promise<void> {
      this.save('mock_criteria', config);
  }
}

// --- Factory ---
const isMock = import.meta.env.VITE_USE_MOCK === 'true';
export const api: ApiService = isMock ? new MockApiService() : new FileApiService();

console.log(`[API] Initialized in ${isMock ? 'DEMO (Mock)' : 'LOCAL (Server)'} mode.`);
