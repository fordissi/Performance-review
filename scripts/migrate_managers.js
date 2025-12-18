import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../data/employees.json');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const employees = JSON.parse(raw);
    
    let updatedCount = 0;
    const newEmployees = employees.map(emp => {
        const newEmp = { ...emp };
        
        if (newEmp.managerId !== undefined) {
             if (!newEmp.managerIds) {
                 newEmp.managerIds = newEmp.managerId ? [newEmp.managerId] : [];
             }
             delete newEmp.managerId;
             updatedCount++;
        } else if (!newEmp.managerIds) {
             newEmp.managerIds = [];
             updatedCount++;
        }
        
        return newEmp;
    });

    fs.writeFileSync(filePath, JSON.stringify(newEmployees, null, 2), 'utf8');
    console.log(`Successfully migrated ${updatedCount} employee records.`);
    
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
