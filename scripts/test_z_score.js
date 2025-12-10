import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/evaluations.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const evaluations = JSON.parse(rawData);

// Filter for 2024 Yearly
const activeYear = 2024;
const activeTerm = 'Yearly';
const targetEvals = evaluations.filter(e => e.year === activeYear && e.term === activeTerm);

console.log(`\n--- Verifying Z-Score for ${activeYear} ${activeTerm} (${targetEvals.length} records) ---\n`);

// 1. Group by Manager
const scoresByManager = {};
targetEvals.forEach(ev => {
    if (!scoresByManager[ev.managerId]) scoresByManager[ev.managerId] = [];
    scoresByManager[ev.managerId].push(ev.rawTotal);
});

// 2. Calculate Stats
const calculateMean = (arr) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
const calculateStdDev = (arr, mean) => {
    if (arr.length <= 1) return 0;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
};

const statsByManager = {};
let allScores = [];
Object.keys(scoresByManager).forEach(mgrId => {
    const scores = scoresByManager[mgrId];
    const mean = calculateMean(scores);
    const std = calculateStdDev(scores, mean) || 1; // Avoid div by zero
    statsByManager[mgrId] = { mean, std, count: scores.length };
    allScores = [...allScores, ...scores];
    console.log(`Manager ${mgrId}: Count=${scores.length}, Mean=${mean.toFixed(2)}, StdDev=${std.toFixed(2)}`);
});

const companyMean = calculateMean(allScores);
const companyStd = calculateStdDev(allScores, companyMean) || 1;
console.log(`\nCOMPANY SCORES: Mean=${companyMean.toFixed(2)}, StdDev=${companyStd.toFixed(2)}\n`);

// 3. Verify Calculations
console.log('ID\t|\tMgr\t|\tRaw\t|\tZ-Score (Calc)\t|\tStored\t|\tMatch?');
console.log('-'.repeat(80));

let matchCount = 0;
targetEvals.forEach(ev => {
    const mgrStats = statsByManager[ev.managerId];
    let calculatedZ = ev.rawTotal; // Default if no calc
    
    // Only apply if isZScoreCalculated is true or we want to verify what it SHOULD be
    // But here we want to verify the Stored Z Matches the Formula
    if (mgrStats.std > 0) {
        calculatedZ = ((ev.rawTotal - mgrStats.mean) / mgrStats.std) * companyStd + companyMean;
    }
    
    const storedZ = ev.zScoreAdjusted;
    const isMatch = Math.abs(calculatedZ - storedZ) < 0.1; // Tolerance
    if(isMatch) matchCount++;
    
    console.log(`${ev.employeeId}\t|\t${ev.managerId}\t|\t${ev.rawTotal}\t|\t${calculatedZ.toFixed(2)}\t\t|\t${storedZ}\t|\t${isMatch ? '✅' : '❌'}`);
});

console.log(`\nVerification Result: ${matchCount}/${targetEvals.length} matches.`);
