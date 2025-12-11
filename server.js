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


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
