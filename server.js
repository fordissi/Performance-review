import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist'))); // Serve frontend build

const DATA_FILE = path.join(__dirname, 'data', 'evaluations.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const EMPLOYEES_FILE = path.join(__dirname, 'data', 'employees.json');
const LOGS_FILE = path.join(__dirname, 'data', 'logs.json');

// Ensure data files exist
[DATA_FILE, USERS_FILE, EMPLOYEES_FILE, LOGS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([], null, 2));
    }
});

// Helper for generic CRUD
const handleGet = (file, res) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try { res.json(JSON.parse(data)); } catch (e) { res.json([]); }
    });
};
const handlePost = (file, req, res) => {
    const newData = req.body;
    if (!Array.isArray(newData)) return res.status(400).json({ error: 'Expected array' });
    fs.writeFile(file, JSON.stringify(newData, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save data' });
        res.json({ success: true });
    });
};

// Routes
app.get('/api/evaluations', (req, res) => handleGet(DATA_FILE, res));
app.post('/api/evaluations', (req, res) => handlePost(DATA_FILE, req, res));

app.get('/api/users', (req, res) => handleGet(USERS_FILE, res));
app.post('/api/users', (req, res) => handlePost(USERS_FILE, req, res));

app.get('/api/employees', (req, res) => handleGet(EMPLOYEES_FILE, res));
app.post('/api/employees', (req, res) => handlePost(EMPLOYEES_FILE, req, res));

// Logs (Append Only)
app.get('/api/logs', (req, res) => handleGet(LOGS_FILE, res));
app.post('/api/logs', (req, res) => {
    fs.readFile(LOGS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Read error' });
        let logs = [];
        try { logs = JSON.parse(data); } catch(e) {}
        
        const newLog = {
            ...req.body,
            id: `L${Date.now()}`,
            timestamp: new Date().toISOString()
        };
        logs.unshift(newLog);
        
        fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Write error' });
            res.json({ success: true });
        });
    });
});

// Notifications
const NOTIFICATIONS_FILE = path.join(__dirname, 'data', 'notifications.json');
if (!fs.existsSync(NOTIFICATIONS_FILE)) fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));

app.get('/api/notifications', (req, res) => handleGet(NOTIFICATIONS_FILE, res));
app.post('/api/notifications', (req, res) => {
    fs.readFile(NOTIFICATIONS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Read error' });
        let list = [];
        try { list = JSON.parse(data); } catch(e) {}
        
        const newNotif = {
            ...req.body,
            id: `N${Date.now()}`,
            timestamp: new Date().toISOString(),
            isRead: false
        };
        list.unshift(newNotif);
        
        fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Write error' });
            res.json({ success: true });
        });
    });
});
app.post('/api/notifications/:id/read', (req, res) => {
    fs.readFile(NOTIFICATIONS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Read error' });
        let list = [];
        try { list = JSON.parse(data); } catch(e) {}
        
        const updated = list.map(n => n.id === req.params.id ? { ...n, isRead: true } : n);
        
        fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(updated, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Write error' });
            res.json({ success: true });
        });
    });
});




// Criteria
const CRITERIA_FILE = path.join(__dirname, 'data', 'criteria.json');
if (!fs.existsSync(CRITERIA_FILE)) {
    // Should fallback to sample or create empty default? creating empty for now as I just wrote it.
    // Actually I wrote it manually, so it exists.
}

app.get('/api/criteria', (req, res) => handleGet(CRITERIA_FILE, res));
app.post('/api/criteria', (req, res) => {
    fs.writeFile(CRITERIA_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Write error' });
        res.json({ success: true });
    });
});

// Settings
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const DEFAULT_SETTINGS = { activeYear: 2024, activeTerm: 'Yearly', periodName: "2024 Annual Performance Review" };
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));

app.get('/api/settings', (req, res) => handleGet(SETTINGS_FILE, res));
app.post('/api/settings', (req, res) => {
    // Note: handlePost checks for array, but settings is an object. Custom handler needed.
    const newData = req.body;
    fs.writeFile(SETTINGS_FILE, JSON.stringify(newData, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save data' });
        res.json({ success: true });
    });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    // Check if request is for API, if so don't return index.html (already handled above but good safety)
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
