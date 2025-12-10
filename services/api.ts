import { User, Employee, Evaluation } from '../types';
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
}

// --- File Service (Real Backend) ---
const API_BASE = `http://${window.location.hostname}:3001`;

class FileApiService implements ApiService {
  async getUsers() { const r = await fetch(`${API_BASE}/api/users`); return r.json(); }
  async saveUsers(data: User[]) { await fetch(`${API_BASE}/api/users`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }); }

  async getEmployees() { const r = await fetch(`${API_BASE}/api/employees`); return r.json(); }
  async saveEmployees(data: Employee[]) { await fetch(`${API_BASE}/api/employees`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }); }

  async getEvaluations() { const r = await fetch(`${API_BASE}/api/evaluations`); return r.json(); }
  async saveEvaluations(data: Evaluation[]) { await fetch(`${API_BASE}/api/evaluations`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }); }
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
}

// --- Factory ---
const isMock = import.meta.env.VITE_USE_MOCK === 'true';
export const api: ApiService = isMock ? new MockApiService() : new FileApiService();

console.log(`[API] Initialized in ${isMock ? 'DEMO (Mock)' : 'LOCAL (Server)'} mode.`);
