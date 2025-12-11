import { ScoreDetails } from './types';

export function calculateRaw(scores: ScoreDetails): number {
    return Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
}

export function calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
}

export function calculateMean(arr: number[]) {
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function calculateStdDev(arr: number[], mean: number) {
    if (arr.length <= 1) return 0;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1); 
    return Math.sqrt(variance);
}
