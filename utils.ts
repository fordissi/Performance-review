import { ScoreDetails } from './types';

export function calculateRaw(scores: ScoreDetails): number {
    let base = 0;
    if(scores.achievementRate !== undefined) base += (scores.achievementRate || 0) + (scores.salesAmount || 0) + (scores.developmentActive || 0) + (scores.activityQuality || 0);
    else if(scores.accuracy !== undefined) base += (scores.accuracy || 0) + (scores.timeliness || 0) + (scores.targetAchievement || 0);
    base += (scores.problemSolving || 0) + (scores.collaboration || 0) + (scores.professionalDev || 0) + (scores.engagement || 0);
    return base;
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
