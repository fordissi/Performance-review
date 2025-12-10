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

export interface ScoreDetails {
  // Sales Dept (70%)
  achievementRate?: number; // 35
  salesAmount?: number;     // 20
  developmentActive?: number; // 10
  activityQuality?: number;   // 5
  
  // Admin Dept (70%)
  accuracy?: number;        // 20
  timeliness?: number;      // 10
  targetAchievement?: number; // 40

  // Common (30%)
  problemSolving: number;   // 10
  collaboration: number;    // 10
  professionalDev: number;  // 5
  engagement: number;       // 5
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
    [Department.MANAGEMENT]: 'ADMIN'
};

export const TERMS = ['Yearly', 'Half-Yearly', 'Q1', 'Q2', 'Q3', 'Q4', 'Probation', 'PIP'] as const;
export type AssessmentTerm = typeof TERMS[number];