export enum Role {
  MANAGER = 'MANAGER',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE',
  GM = 'GM' // New Role
}

export enum Department {
  ENGINEERING = 'Engineering',
  SALES = 'Sales',
  MARKETING = 'Marketing',
  HR = 'Human Resources',
  FINANCIAL_ACCOUNTING = 'Financial Accounting',
  ADMINISTRATION = 'Administrative Support',
  LOGISTICS = 'Logistics',
  PHARMACY = 'Pharmacy',
  MANAGEMENT = 'Management' // For GM
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: Department;
  managerId: string;
  isManager: boolean; // New Flag
  avatar: string;
}

// Dynamic Score Details
export type ScoreDetails = Record<string, number>;

export interface Metric {
    key: string;
    label: string;
    max: number;
    description: string[]; // Rubrics: [90%+, 70%+, 60%+, 30%+, <30%]
}

export interface CriteriaConfig {
    [key: string]: Metric[]; // Key: DEPT_ROLE e.g. SALES_STAFF, ADMIN_MANAGER
}

export interface Evaluation {
  employeeId: string;
  managerId: string;
  year: number;
  term: string; 
  
  // Scoring
  scores: ScoreDetails;
  
  // Z-Score Logic
  rawTotal: number;
  zScoreAdjusted: number;
  
  // HR Adjustments
  attendanceBonus: number;     
  overallAdjustment: number;   
  rewardsPunishments: number;  
  
  // Results
  totalScore: number;
  grade?: string; 
  feedback: string;
  
  // Status
  isManagerComplete: boolean;
  isZScoreCalculated: boolean;
  isHRComplete: boolean;
}

export const DEPT_TYPE = {
    [Department.SALES]: 'SALES',
    [Department.MARKETING]: 'SALES',
    [Department.ENGINEERING]: 'ADMIN',
    [Department.HR]: 'ADMIN',
    [Department.MANAGEMENT]: 'ADMIN',
    [Department.FINANCIAL_ACCOUNTING]: 'ADMIN',
    [Department.ADMINISTRATION]: 'ADMIN',
    [Department.LOGISTICS]: 'ADMIN',
    [Department.PHARMACY]: 'ADMIN'
};

export const TERMS = ['Yearly', 'Half-Yearly', 'Q1', 'Q2', 'Q3', 'Q4', 'Probation', 'PIP'] as const;
export type AssessmentTerm = typeof TERMS[number];

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
    target: 'EMPLOYEE' | 'USER' | 'EVALUATION';
    targetId: string;
    details: string;
}

export interface Notification {
    id: string;
    timestamp: string;
    toRole: Role[]; 
    title: string;
    message: string;
    isRead: boolean;
}