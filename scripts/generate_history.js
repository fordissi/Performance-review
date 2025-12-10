import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/evaluations.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const evaluations = JSON.parse(rawData);

// Get unique list of employees from existing data (assuming 2024 data exists)
const uniqueEmployees = new Map();
evaluations.forEach(ev => {
    if(!uniqueEmployees.has(ev.employeeId)) {
        uniqueEmployees.set(ev.employeeId, { managerId: ev.managerId });
    }
});

const YEARS = [2022, 2023];
const newEvaluations = [];

console.log(`Found ${uniqueEmployees.size} employees. Generating history for ${YEARS.join(', ')}...`);

uniqueEmployees.forEach((info, empId) => {
    YEARS.forEach(year => {
        // Skip if exists (basic check)
        const exists = evaluations.find(e => e.employeeId === empId && e.year === year && e.term === 'Yearly');
        if(exists) return;

        // Random scores
        const randomScore = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Mock score details (simplified random distribution)
        const scores = {
            // Common
            problemSolving: randomScore(5, 9),
            collaboration: randomScore(6, 10), 
            professionalDev: randomScore(2, 5),
            engagement: randomScore(2, 5),
            
            // Mixed (just filling optional fields to be safe for types)
            achievementRate: randomScore(15, 30),
            salesAmount: randomScore(10, 20),
            developmentActive: randomScore(5, 10),
            activityQuality: randomScore(3, 5),
            
            targetAchievement: randomScore(20, 35),
            accuracy: randomScore(12, 18),
            timeliness: randomScore(6, 9)
        };
        
        // Calculate raw roughly
        const rawTotal = randomScore(70, 95); 
        
        // Fake Z-Score (just raw +/- random 2 points)
        const zScoreAdjusted = parseFloat((rawTotal + (Math.random() * 4 - 2)).toFixed(2));
        const totalScore = zScoreAdjusted; // Simple for history

        newEvaluations.push({
            employeeId: empId,
            managerId: info.managerId,
            year: year,
            term: 'Yearly',
            scores,
            rawTotal,
            zScoreAdjusted,
            attendanceBonus: 0,
            overallAdjustment: 0,
            rewardsPunishments: 0,
            totalScore,
            grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : 'C',
            feedback: `[Mock History ${year}] Performance was consistent with expectations.`,
            isManagerComplete: true,
            isZScoreCalculated: true,
            isHRComplete: true
        });
    });
});

const merged = [...evaluations, ...newEvaluations];
fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2), 'utf-8');
console.log(`Generated ${newEvaluations.length} historical records. Total evaluations: ${merged.length}`);
