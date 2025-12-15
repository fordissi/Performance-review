import React, { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, BrainCircuit, TrendingUp, Shield, LogOut, FileText, History, Calendar, Settings, Save, Server, Edit, AlertTriangle, Menu, X, ChevronDown, ChevronUp, Calculator, BarChart3, Lock, Trophy, Activity, Clock, Plus, Trash2, Share2, ChevronLeft, ChevronRight, AlertCircle, Download, Bell } from 'lucide-react';
import { Role, Employee, Evaluation, Department, User, DEPT_TYPE, TERMS, ScoreDetails, AssessmentTerm, AuditLog, Notification, CriteriaConfig, Metric } from './types';
import { generateFeedback, generateInterviewGuide } from './services/geminiService';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { calculateRaw, calculateGrade, calculateStdDev, calculateMean } from './utils.ts';

import { api } from './services/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i); // e.g. [2023, 2024, 2025, 2026, 2027, 2028]

interface SystemSettings {
  activeYear: number;
  activeTerm: string; 
  periodName: string; 
}

const DEFAULT_SETTINGS: SystemSettings = {
  activeYear: 2024,
  activeTerm: 'Yearly',
  periodName: "2024 年度績效考核"
};

// --- DATA CONSTANTS ---










// --- COMPONENTS ---
// --- COMPONENTS ---
interface RangeInputProps {
    label: string;
    value: number;
    max: number;
    description: string[];
    onChange: (v: number) => void;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, value, max, description, onChange }) => {
    const percent = max > 0 ? Math.round((value / max) * 100) : 0;
    const handleChange = (newPercent: number) => {
        const newValue = Math.round((newPercent / 100) * max);
        onChange(newValue);
    };
    
    // Determine description based on percentage
    let desc = description[4] || ''; // Default to last (worst)
    if(percent >= 90) desc = description[0];
    else if(percent >= 70) desc = description[1];
    else if(percent >= 60) desc = description[2];
    else if(percent >= 30) desc = description[3];

    return (
        <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-bold text-slate-800">{label}</label>
                <div className="text-right"><span className="text-2xl font-bold text-indigo-600">{percent}%</span><span className="text-xs text-slate-400 ml-2">({value}/{max})</span></div>
            </div>
            <input type="range" min="0" max="100" step="5" value={percent} onChange={(e) => handleChange(parseInt(e.target.value))} className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            <div className="mt-3 bg-slate-50 border-l-4 border-indigo-400 p-3 rounded-r-lg"><p className="text-sm text-slate-700">{desc}</p></div>
        </div>
    );
};

// LoginView
const LoginView = ({ onLogin, users }: { onLogin: (u: User) => void, users: User[] }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) onLogin(user); else setError('帳號或是密碼錯誤');
    };
    const isDemo = import.meta.env.VITE_USE_MOCK === 'true';

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row items-center justify-center p-4 gap-8">
            {/* Features Guide - Only for Demo/Recruiters */}
            {isDemo && (
                <div className="max-w-md w-full text-slate-700 animate-in slide-in-from-left-4 fade-in duration-500 hidden md:block">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-2"><TrendingUp className="text-indigo-600"/> PerformX</h1>
                        <p className="text-xl text-slate-500">AI 驅動的現代化績效考核系統</p>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm h-fit"><BrainCircuit className="text-indigo-600" size={24}/></div>
                            <div>
                                <h3 className="font-bold text-lg">AI 智能輔助</h3>
                                <p className="text-sm text-slate-500">自動生成考核評語、分析自評與主管評分的認知落差，並提供面談引導建議。</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm h-fit"><Calculator className="text-green-600" size={24}/></div>
                            <div>
                                <h3 className="font-bold text-lg">Z-Score 標準化與部門分群</h3>
                                <p className="text-sm text-slate-500">自動針對 Sales/Mgmt/Support 三大職能群組進行 Z-Score 校準，確保跨部門考核公平性。</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm h-fit"><Shield className="text-orange-600" size={24}/></div>
                            <div>
                                <h3 className="font-bold text-lg">角色權限分流</h3>
                                <ul className="text-sm text-slate-500 list-disc list-inside mt-1 space-y-1">
                                    <li><strong>GM</strong>: 全局戰情儀表板 (Sales/Mgmt/SupportTop3 分析)</li>
                                    <li><strong>HR</strong>: 系統參數、人員管理與動態考核標準設定</li>
                                    <li><strong>Manager</strong>: 團隊考核與 AI 面談引導</li>
                                    <li><strong>Employee</strong>: 線上自評與歷史績效查閱</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Box */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className={isDemo ? "md:hidden flex flex-col items-center mb-6" : "flex flex-col items-center mb-6"}><div className="bg-indigo-600 p-3 rounded-xl mb-4"><TrendingUp className="text-white" size={32} /></div><h1 className="text-2xl font-bold text-slate-800">PerformX</h1></div>
                <h2 className="text-xl font-bold mb-6 text-center text-slate-700">歡迎登入</h2>
                <form onSubmit={handleLogin} className="space-y-4"><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Username" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Password" />{error && <p className="text-red-500 text-sm">{error}</p>}<button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">登入</button></form>
                
                {isDemo && (
                    <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-500"><AlertCircle size={14}/> Demo Mode Credentials</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button onClick={()=>{setUsername('gm');setPassword('password')}} className="p-2 bg-slate-50 rounded hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">
                                <span className="font-bold block">General Manager</span>gm / password
                            </button>
                            <button onClick={()=>{setUsername('admin');setPassword('password')}} className="p-2 bg-slate-50 rounded hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">
                                <span className="font-bold block">HR Admin</span>admin / password
                            </button>
                            <button onClick={()=>{setUsername('manager1');setPassword('password')}} className="p-2 bg-slate-50 rounded hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">
                                <span className="font-bold block">Manager</span>manager1 / password
                            </button>
                            <button onClick={()=>{setUsername('emp1');setPassword('password')}} className="p-2 bg-slate-50 rounded hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">
                                <span className="font-bold block">Employee</span>emp1 / password
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sidebar
const Sidebar = ({ user, onLogout, isOpen, onClose, viewMode, setViewMode }: { user: User, onLogout: () => void, isOpen: boolean, onClose: () => void, viewMode: string, setViewMode: (m: string)=>void }) => {
    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose}></div>}
            <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-30 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-screen flex flex-col`}>
                <div className="p-6 border-b border-slate-700 flex justify-between items-center"><h1 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="text-indigo-400" /> PerformX</h1><button onClick={onClose} className="lg:hidden text-slate-400"><X size={24}/></button></div>
                <div className="flex-1 p-4 space-y-4">
                     <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl"><img src={user.avatar} className="w-10 h-10 rounded-full" alt="avatar" /><div><p className="font-bold text-sm">{user.name}</p><p className="text-xs text-indigo-300">{user.role}</p></div></div>
                     <div className="space-y-2">
                        {(user.role === Role.MANAGER || user.role === Role.GM) && (
                            <button onClick={()=>setViewMode('manager_eval')} className={`w-full px-4 py-3 rounded-lg flex gap-3 text-left ${viewMode==='manager_eval'?'bg-indigo-600':'hover:bg-slate-800'}`}>
                                <CheckCircle size={18}/> {user.role === Role.GM ? '管理職考核' : '團隊考核'}
                            </button>
                        )}
                        {(user.role === Role.HR || user.role === Role.GM) && (
                            <button onClick={()=>setViewMode('hr_dashboard')} className={`w-full px-4 py-3 rounded-lg flex gap-3 text-left ${viewMode==='hr_dashboard'?'bg-indigo-600':'hover:bg-slate-800'}`}>
                                <BarChart3 size={18}/> {user.role === Role.GM ? '全局儀表板' : '管理平台'}
                            </button>
                        )}
                        {(user.role !== Role.HR) && (
                             <button onClick={()=>setViewMode('my_eval')} className={`w-full px-4 py-3 rounded-lg flex gap-3 text-left ${viewMode==='my_eval'?'bg-indigo-600':'hover:bg-slate-800'}`}>
                                <FileText size={18}/> 我的考核
                            </button>
                        )}
                     </div>
                </div>
                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button onClick={()=>setViewMode('change_password')} className={`w-full flex items-center gap-3 px-4 py-2 hover:text-white rounded-lg ${viewMode==='change_password'?'bg-indigo-600 text-white':'text-slate-400'}`}>
                        <Lock size={18} /> 修改密碼
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                        <LogOut size={18} /> 登出
                    </button>
                </div>
            </div>
        </>
    );
};

// Manager View
const ManagerView = ({ user, employees, evaluations, settings, onSave }: any) => {
    const myEmployees = employees.filter((e: Employee) => e.managerId === user.id);
    const [selectedEmpId, setSelectedEmpId] = useState(myEmployees[0]?.id || '');
    const [scores, setScores] = useState<ScoreDetails>({});
    const [feedback, setFeedback] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [interviewGuide, setInterviewGuide] = useState('');
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [showEmployeeList, setShowEmployeeList] = useState(false);
    const [criteriaConfig, setCriteriaConfig] = useState<CriteriaConfig | null>(null);
    
    // View Mode for Manager: 'evaluate' (Current Active) or 'history' (Past)
    const [mode, setMode] = useState<'evaluate' | 'history'>('evaluate');
    const [viewHistoryEval, setViewHistoryEval] = useState<Evaluation | null>(null);

    // Current Active Evaluation (Editable)
    const selectedEmployee = myEmployees.find((e: Employee) => e.id === selectedEmpId);
    const currentEval = evaluations.find((e: Evaluation) => e.employeeId === selectedEmpId && e.year === settings.activeYear && e.term === settings.activeTerm);
    
    // History Evaluations (Read-Only)
    const historyEvals = evaluations.filter((e:Evaluation) => e.employeeId === selectedEmpId && !(e.year === settings.activeYear && e.term === settings.activeTerm)).sort((a:Evaluation,b:Evaluation) => b.year - a.year);

    // Dynamic Criteria Logic
    useEffect(() => {
        api.getCriteria().then(setCriteriaConfig).catch(console.error);
    }, []);

    const activeMetrics = useMemo(() => {
        if (!selectedEmployee || !criteriaConfig) return [];
        const dept = DEPT_TYPE[selectedEmployee.department] || 'ADMIN';
        const role = selectedEmployee.isManager ? 'MANAGER' : 'STAFF';
        const key = `${dept}_${role}`;
        return criteriaConfig[key] || criteriaConfig[`ADMIN_${role}`] || [];
    }, [selectedEmployee, criteriaConfig]);

    useEffect(() => {
        if (!selectedEmployee) return;
        setMode('evaluate'); // Reset to evaluate mode on switch
        setViewHistoryEval(null);
        if (currentEval) {
            setScores(currentEval.scores);
            setFeedback(currentEval.feedback);
            setInterviewGuide(currentEval.aiInterviewGuide || '');
        } else {
            // Default scores calculation based on active metrics
            // Default to ~70% if max > 10, else ~7
            const defaults: ScoreDetails = {};
            activeMetrics.forEach(m => {
                defaults[m.key] = Math.ceil(m.max * 0.7);
            });
            setScores(defaults);
            setFeedback('');
            setInterviewGuide('');
        }
    }, [selectedEmpId, currentEval, activeMetrics, selectedEmployee]);

    const handleScoreChange = (key: keyof ScoreDetails, val: number) => setScores(prev => ({ ...prev, [key]: val }));
    const handleSave = () => {
        if (!selectedEmployee) return;
        if (currentEval && !confirm(`員工 ${selectedEmployee.name} 本期已有評分資料。確定要覆蓋嗎？`)) return;

        const raw = calculateRaw(scores);
        onSave({ 
            employeeId: selectedEmpId, managerId: user.id, year: settings.activeYear, term: settings.activeTerm,
            scores, rawTotal: raw, zScoreAdjusted: currentEval?.zScoreAdjusted || raw, 
            attendanceBonus: currentEval?.attendanceBonus || 0, overallAdjustment: currentEval?.overallAdjustment || 0, rewardsPunishments: currentEval?.rewardsPunishments || 0,
            totalScore: (currentEval?.zScoreAdjusted || raw) + (currentEval?.attendanceBonus || 0) + (currentEval?.overallAdjustment || 0) + (currentEval?.rewardsPunishments || 0),
            grade: '', feedback, isManagerComplete: true, isZScoreCalculated: currentEval?.isZScoreCalculated || false, isHRComplete: currentEval?.isHRComplete || false,
            // Preserve Self Eval & AI Guide
            selfScores: currentEval?.selfScores, selfFeedback: currentEval?.selfFeedback, isSelfComplete: currentEval?.isSelfComplete,
            aiInterviewGuide: interviewGuide
        });
        
        // Log
        api.addLog({
            userId: user.id, userName: user.name, action: 'UPDATE', target: 'EVALUATION', targetId: selectedEmpId, 
            details: `Manager ${user.name} submitted evaluation for ${selectedEmployee.name} (${settings.activeYear} ${settings.activeTerm})`
        });

        // Notify Admin
        api.addNotification({
            toRole: [Role.HR, Role.GM],
            title: '考核更新',
            message: `${user.name} 更新了 ${selectedEmployee.name} 的考核資料，請確認是否需重新運算 Z-Score。` 
        });

        alert('已提交評分！等待 HR 進行標準化計算。');
    };
    const handleGenerateAI = async () => {
        setIsGeneratingAI(true);
        const text = await generateFeedback(selectedEmployee.name, scores, selectedEmployee.role);
        setFeedback(text);
        setIsGeneratingAI(false);
    };

    const handleGenerateGuide = async () => {
        if (!currentEval?.isSelfComplete || !currentEval?.selfScores) { alert('員工尚未完成自評，無法生成比較指南。'); return; }
        setIsGeneratingGuide(true);
        const guide = await generateInterviewGuide(selectedEmployee.name, scores, currentEval.selfScores, selectedEmployee.role);
        setInterviewGuide(guide);
        setIsGeneratingGuide(false);
    };

    if (myEmployees.length === 0) return <div className="p-8 text-center text-slate-500">無指定下屬人員。</div>;
    if (!selectedEmployee) return <div>請選擇員工</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
             <div className="lg:hidden mb-4"><button onClick={() => setShowEmployeeList(!showEmployeeList)} className="w-full bg-white p-4 rounded-xl shadow-sm text-left flex justify-between"><span>{selectedEmployee.name}</span>{showEmployeeList?<ChevronUp/>:<ChevronDown/>}</button>{showEmployeeList && <div className="mt-2 bg-white rounded-xl shadow-xl">{myEmployees.map((emp:Employee) => <button key={emp.id} onClick={()=>{setSelectedEmpId(emp.id);setShowEmployeeList(false)}} className="w-full p-4 border-b text-left">{emp.name}</button>)}</div>}</div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="hidden lg:block col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
                    <div className="p-4 border-b font-bold bg-slate-50 rounded-t-xl">{user.role === Role.GM ? '管理團隊' : '我的團隊'}</div>
                    {myEmployees.map((emp: Employee) => (
                        <button key={emp.id} onClick={() => setSelectedEmpId(emp.id)} className={`w-full p-4 text-left border-b hover:bg-slate-50 flex justify-between ${selectedEmpId===emp.id ? 'bg-indigo-50 border-l-4 border-indigo-600':''} ${emp.isManager ? 'border-l-orange-400' : ''}`}><div><div className="font-bold">{emp.name} {emp.isManager && '⭐'}</div><div className="text-xs text-slate-500">{emp.department}</div></div>{evaluations.some((e: Evaluation) => e.employeeId === emp.id && e.year === settings.activeYear && e.term === settings.activeTerm && e.isManagerComplete) && <CheckCircle size={16} className="text-green-500"/>}</button>
                    ))}
                </div>
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex bg-white rounded-xl shadow-sm border p-1">
                        <button onClick={() => setMode('evaluate')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode==='evaluate'?'bg-indigo-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>本期考核 ({settings.activeYear} {settings.activeTerm})</button>
                        <button onClick={() => setMode('history')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode==='history'?'bg-indigo-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>歷史紀錄</button>
                    </div>

                    {mode === 'evaluate' && (
                        <>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold flex items-center gap-2 mb-4"><Users size={18}/> 績效面談準備</h3>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-700">員工自評狀態:</span>
                                            {currentEval?.isSelfComplete ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={12}/> 已完成</span> : <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">未完成</span>}
                                        </div>
                                        {currentEval?.isSelfComplete && (
                                            <button onClick={handleGenerateGuide} disabled={isGeneratingGuide} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                <BrainCircuit size={14}/> {isGeneratingGuide ? '分析中...' : '生成面談指南'}
                                            </button>
                                        )}
                                    </div>
                                    {interviewGuide ? (
                                        <div className="bg-white p-3 rounded border border-indigo-100 text-sm whitespace-pre-line leading-relaxed">
                                            {interviewGuide}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">點擊生成按鈕，AI 將分析您的評分與員工自評的落差，並提供面談建議。</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold border-b pb-4 mb-4">考核項目 - {selectedEmployee.isManager ? '管理職' : '一般職'} ({DEPT_TYPE[selectedEmployee.department] || 'ADMIN'})</h2>
                                {activeMetrics.length === 0 ? <div className="text-center py-4 text-slate-500">Loading criteria...</div> : activeMetrics.map(metric => (
                                    <RangeInput 
                                        key={metric.key}
                                        label={metric.label}
                                        max={metric.max}
                                        description={metric.description}
                                        value={scores[metric.key] || 0}
                                        onChange={v => handleScoreChange(metric.key, v)}
                                    />
                                ))}
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-center mb-4"><h3 className="font-bold">主管評語</h3><button onClick={handleGenerateAI} disabled={isGeneratingAI} className="text-indigo-600 text-xs font-bold flex items-center gap-1"><BrainCircuit size={14}/> {isGeneratingAI ? 'Generating...' : 'AI 寫評語'}</button></div><textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full h-32 p-3 border rounded-lg text-sm" placeholder="請輸入..."></textarea><button onClick={handleSave} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg">提交</button></div>
                        </>
                    )}

                    {mode === 'history' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold mb-4">{selectedEmployee.name} 的歷史紀錄</h3>
                            {historyEvals.length === 0 ? <p className="text-slate-500">尚無歷史紀錄。</p> : (
                                <div className="space-y-4">
                                    {historyEvals.map(ev => (
                                        <div key={ev.year+ev.term} className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50" onClick={() => setViewHistoryEval(viewHistoryEval === ev ? null : ev)}>
                                            <div className="flex justify-between items-center">
                                                <div><span className="font-bold text-lg">{ev.year} {ev.term}</span><span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${ev.grade==='A'?'bg-green-100 text-green-700':ev.grade==='B'?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>Grade {ev.grade}</span></div>
                                                <div className="text-right"><span className="text-xl font-bold text-indigo-600">{ev.totalScore}</span><span className="text-xs text-slate-400 block">Total Score</span></div>
                                            </div>
                                            {viewHistoryEval === ev && (
                                                <div className="mt-4 pt-4 border-t text-sm text-slate-600 animate-in fade-in">
                                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                                        <div>Raw Score: {ev.rawTotal}</div>
                                                        <div>Adjusted: {ev.zScoreAdjusted}</div>
                                                    </div>
                                                    <p className="bg-slate-100 p-2 rounded">"{ev.feedback}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// HR View
const HRView = ({ user, employees, users, evaluations, settings, onUpdateSettings, onSave, onBatchSave, onSaveUsers, onSaveEmployees }: any) => {
    const isGM = user.role === Role.GM;
    const [activeTab, setActiveTab] = useState<'dashboard' | 'reviews' | 'employees' | 'audit_logs'>('dashboard');
    const [editEval, setEditEval] = useState<Evaluation | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showCriteriaEditor, setShowCriteriaEditor] = useState(false);
    const [criteriaJson, setCriteriaJson] = useState('');

    useEffect(() => {
        if (activeTab === 'audit_logs') {
            const fetchLogs = async () => { try { setLogs(await api.getLogs()); } catch(e) {console.error(e);} };
            fetchLogs();
        }
        // Fetch notifications
        const fetchNotifs = async () => { try { setNotifications(await api.getNotifications()); } catch(e) {console.error(e);} };
        fetchNotifs();
        // Poll every 10s? For now just once on mount/update is fine or trigger manual refresh.
    }, [activeTab]);

    const unreadCount = notifications.filter(n => !n.isRead && n.toRole.includes(user.role)).length;
    const myNotifs = notifications.filter(n => n.toRole.includes(user.role));

    const handleMarkRead = async (id: string) => {
        await api.markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    // Employee Mgmt State
    const [showEmpModal, setShowEmpModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [empForm, setEmpForm] = useState<any>({id:'', name:'', role:'', department: Department.ENGINEERING, managerId:'', isManager: false});

    // View Filters (Default to System Active, but can be changed to browse history)
    const [viewYear, setViewYear] = useState(settings.activeYear);
    const [viewTerm, setViewTerm] = useState(settings.activeTerm);
    
    const filtered = evaluations.filter((e:Evaluation) => e.year === viewYear && e.term === viewTerm);
    const pending = filtered.filter((e:Evaluation) => e.isManagerComplete && !e.isHRComplete).length;
    const published = filtered.filter((e:Evaluation) => e.isHRComplete).length;
    const submittedCount = filtered.filter((e:Evaluation) => e.isManagerComplete).length;
    const zScoreCount = filtered.filter((e:Evaluation) => e.isZScoreCalculated).length;
    const finalizedCount = filtered.filter((e:Evaluation) => e.isHRComplete).length;

    // Historical Trend Data
    const yearlyTrend = useMemo(() => {
        const trend: any[] = [];
        YEARS.forEach(y => {
            const evals = evaluations.filter((e:Evaluation) => e.year === y);
            if(evals.length > 0) {
                trend.push({ name: y.toString(), score: parseFloat(calculateMean(evals.map((e:Evaluation) => e.totalScore)).toFixed(1)) });
            }
        });
        return trend;
    }, [evaluations]);

    // Top Performers
    const topPerformers = useMemo(() => {
        const groups = {
            'SALES': [Department.SALES],
            'MANAGEMENT': [Department.MANAGEMENT],
            'SUPPORT': Object.values(Department).filter(d => d !== Department.SALES && d !== Department.MANAGEMENT)
        };
        const result: any = {};
        
        (['SALES', 'MANAGEMENT', 'SUPPORT'] as const).forEach(key => {
            const targetDepts = groups[key];
            const deptEmps = employees.filter((e:Employee) => targetDepts.includes(e.department as any)).map((e:Employee) => e.id);
            const deptEvals = filtered.filter((e:Evaluation) => deptEmps.includes(e.employeeId));
            const sorted = deptEvals.sort((a:Evaluation, b:Evaluation) => b.totalScore - a.totalScore).slice(0, 3);
            result[key] = sorted.map((ev:Evaluation) => ({
                name: employees.find((x:Employee) => x.id === ev.employeeId)?.name,
                score: ev.totalScore
            }));
        });
        return result;
    }, [filtered, employees]);

    const calculateZScores = () => {
        const scoresByManager: Record<string, number[]> = {};
        filtered.forEach((ev: Evaluation) => { if(!scoresByManager[ev.managerId]) scoresByManager[ev.managerId] = []; scoresByManager[ev.managerId].push(ev.rawTotal); });
        
        const statsByManager: Record<string, {mean: number, std: number}> = {};
        let allScores: number[] = [];
        Object.keys(scoresByManager).forEach(mgrId => { const scores = scoresByManager[mgrId]; statsByManager[mgrId] = { mean: calculateMean(scores), std: calculateStdDev(scores, calculateMean(scores)) || 1 }; allScores = [...allScores, ...scores]; });
        const companyMean = calculateMean(allScores);
        const companyStd = calculateStdDev(allScores, companyMean) || 1;

        const updatedEvals = filtered.map((ev: Evaluation) => {
            const teamStats = statsByManager[ev.managerId];
            let adjustedBase = ev.rawTotal;
            if(teamStats.std > 0) adjustedBase = ((ev.rawTotal - teamStats.mean) / teamStats.std) * companyStd + companyMean;
            const total = adjustedBase + ev.attendanceBonus + ev.overallAdjustment + ev.rewardsPunishments;
            return { ...ev, zScoreAdjusted: parseFloat(adjustedBase.toFixed(2)), totalScore: parseFloat(total.toFixed(2)), grade: calculateGrade(total), isZScoreCalculated: true };
        });
        onBatchSave(updatedEvals);
        alert(`Z-Score Calculation Complete!\nCompany Mean: ${companyMean.toFixed(1)}, StdDev: ${companyStd.toFixed(1)}`);
    };

    const handleUpdateAdjustment = (k: string, v: number) => {
        if(!editEval) return;
        const total = editEval.zScoreAdjusted + (k==='attendanceBonus'?v:editEval.attendanceBonus) + (k==='overallAdjustment'?v:editEval.overallAdjustment) + (k==='rewardsPunishments'?v:editEval.rewardsPunishments);
        setEditEval({...editEval, [k]: v, totalScore: parseFloat(total.toFixed(2)), grade: calculateGrade(total)});
    };
    const handlePublish = () => { 
        if(!editEval) return; 
        if(editEval.isHRComplete && !confirm('此考核已發布。確定要重新發布嗎？')) return;
        onSave({...editEval, isHRComplete: true}); 
        setEditEval(null); 
    };

    const handleExportCSV = () => {
        const targetEvals = evaluations.filter((ev:Evaluation) => ev.isHRComplete && ev.year === viewYear && ev.term === viewTerm);
        if(targetEvals.length === 0) { alert('本期尚無已發布的考核資料可匯出。'); return; }

        const headers = ['EmployeeID', 'Name', 'Role', 'Department', 'Year', 'Term', 'Raw Score', 'Z-Score', 'Attendance', 'Overall Adj', 'Rewards', 'Total Score', 'Grade', 'Feedback'];
        const csvRows = targetEvals.map((ev: Evaluation) => {
            const emp = employees.find((e:Employee) => e.id === ev.employeeId);
            return [
                ev.employeeId,
                emp?.name || 'Unknown',
                emp?.role || '',
                emp?.department || '',
                ev.year,
                ev.term,
                ev.rawTotal,
                ev.zScoreAdjusted,
                ev.attendanceBonus,
                ev.overallAdjustment,
                ev.rewardsPunishments,
                ev.totalScore,
                ev.grade,
                `"${(ev.feedback || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Performance_Reviews_${viewYear}_${viewTerm}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Employee & User Mgmt Handlers
    const handleAddEmployee = () => {
        setEditingEmp(null);
        setEmpForm({id: `E${Math.floor(Math.random()*1000)}`, name:'', role:'', department: Department.ENGINEERING, managerId:'', isManager: false});
        setShowEmpModal(true);
    };
    const handleEditEmployee = (e: Employee) => {
        setEditingEmp(e);
        setEmpForm({...e});
        setShowEmpModal(true);
    };
    const handleSaveEmployee = () => {
        let newEmps = [...employees];
        if (editingEmp) {
           newEmps = newEmps.map(e => e.id === editingEmp.id ? empForm : e);
        } else {
           newEmps.push(empForm);
           // Auto-create User if new? (Simplification: Just create user with default password 'password')
           if (!users.find((u:User) => u.id === empForm.id)) {
               const newUser: User = { 
                   id: empForm.id, 
                   username: empForm.id.toLowerCase(), // e.g. E123 -> e123
                   password: 'password', 
                   name: empForm.name, 
                   role: empForm.isManager ? Role.MANAGER : Role.EMPLOYEE,
                   avatar: `https://i.pravatar.cc/150?u=${empForm.id}`
               };
               onSaveUsers([...users, newUser]);
           }
        }
        onSaveEmployees(newEmps);
        setShowEmpModal(false);

        api.addLog({ 
            userId: user.id, userName: user.name, action: editingEmp ? 'UPDATE' : 'CREATE', target: 'EMPLOYEE', targetId: empForm.id, 
            details: `${editingEmp ? 'Updated' : 'Created'} employee ${empForm.name} (${empForm.id})` 
        });
    };
    const handleDeleteEmployee = (id: string) => {
        if(confirm('確定刪除員工資料? 此動作連同 User 帳號會一併移除。')) {
            onSaveEmployees(employees.filter((e:Employee) => e.id !== id));
            onSaveUsers(users.filter((u:User) => u.id !== id));
            
            api.addLog({ 
                userId: user.id, userName: user.name, action: 'DELETE', target: 'EMPLOYEE', targetId: id, 
                details: `Deleted employee ${id}` 
            });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
             <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border gap-4">
                <div className="w-full md:w-auto">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      {isGM ? 'GM 全局儀表板' : 'HR 管理平台'} 
                      <div className="flex bg-slate-100 rounded-lg p-1 ml-4 items-center">
                          <History size={16} className="text-slate-500 ml-2 mr-1"/>
                          <input type="number" list="years-list" value={viewYear} onChange={e=>setViewYear(parseInt(e.target.value)||0)} className="bg-transparent text-sm font-bold text-slate-700 py-1 w-20 cursor-pointer outline-none border-b border-transparent hover:border-slate-300 transition-colors"/>
                          <datalist id="years-list">{YEARS.map(y => <option key={y} value={y} />)}</datalist>
                          <span className="text-slate-300 mx-1">|</span>
                          <select value={viewTerm} onChange={e=>setViewTerm(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 py-1 pr-2 cursor-pointer outline-none">{TERMS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                      </div>
                  </h2>
                  <div className="flex gap-4 mt-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`text-sm font-medium pb-1 ${activeTab==='dashboard'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>儀表板</button>
                    <button onClick={() => setActiveTab('reviews')} className={`text-sm font-medium pb-1 ${activeTab==='reviews'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>{isGM? '全體考核狀況' : `考核管理 (${submittedCount - finalizedCount} 待審)`}</button>
                    {!isGM && <button onClick={() => setActiveTab('employees')} className={`text-sm font-medium pb-1 ${activeTab==='employees'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>人員管理</button>}
                    <button onClick={() => setActiveTab('audit_logs')} className={`text-sm font-medium pb-1 ${activeTab==='audit_logs'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>系統紀錄</button>
                  </div>
                </div>
                <div className="flex gap-2">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="relative p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
                        </button>
                        {showNotifDropdown && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="p-3 border-b flex justify-between items-center"><h4 className="font-bold text-sm">通知</h4><button onClick={()=>setShowNotifDropdown(false)}><X size={16}/></button></div>
                                <div className="max-h-64 overflow-y-auto">
                                    {myNotifs.length === 0 ? <div className="p-4 text-center text-xs text-slate-400">目前沒有通知</div> : (
                                        myNotifs.map(n => (
                                            <div key={n.id} onClick={() => !n.isRead && handleMarkRead(n.id)} className={`p-3 border-b text-sm cursor-pointer hover:bg-slate-50 ${!n.isRead ? 'bg-indigo-50/50' : ''}`}>
                                                <div className="flex justify-between mb-1"><span className={`text-xs font-bold ${!n.isRead?'text-indigo-600':'text-slate-500'}`}>{n.title}</span><span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString()}</span></div>
                                                <p className="text-slate-700">{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isGM && (
                        <button onClick={() => setShowSettings(!showSettings)} className="text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg text-sm font-bold flex gap-2 justify-center">
                            <Settings size={16}/> 系統設定
                        </button>
                    )}
                </div>
             </header>

             {showSettings && (
                 <div className="bg-slate-800 text-white p-6 rounded-xl shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                     <div className="flex gap-4 items-end">
                        <div><label>Active Year</label><input type="number" list="years-list" value={tempSettings.activeYear} onChange={e=>setTempSettings({...tempSettings, activeYear: parseInt(e.target.value)||0})} className="text-black block rounded p-1 w-24"/></div>
                        <div><label>Active Term</label><select value={tempSettings.activeTerm} onChange={e=>setTempSettings({...tempSettings, activeTerm: e.target.value})} className="text-black block rounded p-1 w-32">{TERMS.map(t=><option key={t}>{t}</option>)}</select></div>
                        <div className="flex-1"><label>Period Name (Display)</label><input className="text-black block rounded p-1 w-full" value={tempSettings.periodName} onChange={e=>setTempSettings({...tempSettings, periodName: e.target.value})}/></div>
                        <button onClick={() => { setShowCriteriaEditor(!showCriteriaEditor); if(!showCriteriaEditor) api.getCriteria().then(c=>setCriteriaJson(JSON.stringify(c,null,2))); }} className="bg-orange-600 px-4 py-1 rounded font-bold hover:bg-orange-700">
                             {showCriteriaEditor ? 'Close Editor' : 'Edit Criteria (JSON)'}
                        </button>
                        <button onClick={() => { onUpdateSettings(tempSettings); setShowSettings(false); setViewYear(tempSettings.activeYear); setViewTerm(tempSettings.activeTerm); }} className="bg-green-600 px-4 py-1 rounded font-bold hover:bg-green-700">Save & Apply</button>
                     </div>
                     
                     {showCriteriaEditor && (
                         <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mt-4">
                             <div className="flex justify-between mb-2">
                                 <h4 className="font-bold text-orange-400">Criteria JSON Configuration</h4>
                                 <button onClick={() => {
                                     try {
                                         const parsed = JSON.parse(criteriaJson);
                                         api.saveCriteria(parsed).then(() => alert('Criteria Saved!'));
                                     } catch(e) { alert('Invalid JSON'); }
                                 }} className="bg-orange-600 px-3 py-1 rounded text-xs font-bold hover:bg-orange-700">Save Criteria</button>
                             </div>
                             <textarea value={criteriaJson} onChange={e=>setCriteriaJson(e.target.value)} className="w-full h-64 bg-black text-green-400 font-mono text-xs p-2 rounded outline-none border border-slate-700" spellCheck={false}></textarea>
                             <p className="text-xs text-slate-500 mt-2">Modify the metrics, weights, and rubrics for each department/role combo. Use with caution.</p>
                         </div>
                     )}
                 </div>
              )}

             {activeTab === 'dashboard' && (
                 <div className="space-y-6">
                     {(viewYear !== settings.activeYear || viewTerm !== settings.activeTerm) && (<div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center gap-2 text-sm"><History size={16}/>目前正在預覽歷史/其他期間資料: <b>{viewYear} {viewTerm}</b>。 (系統目前運作期間為: {settings.activeYear} {settings.activeTerm})</div>)}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex justify-between items-start mb-2"><span className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users size={20}/></span><span className="text-xs text-slate-400">Total</span></div><p className="text-2xl font-bold text-slate-800">{filtered.length}</p><p className="text-xs text-slate-500">本期參與考核人數</p></div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex justify-between items-start mb-2"><span className="p-2 bg-orange-100 rounded-lg text-orange-600"><Edit size={20}/></span><span className="text-xs text-slate-400">Progress</span></div><p className="text-2xl font-bold text-slate-800">{submittedCount}</p><p className="text-xs text-slate-500">主管已評分 ({filtered.length > 0 ? Math.round((submittedCount/filtered.length)*100) : 0}%)</p></div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex justify-between items-start mb-2"><span className="p-2 bg-purple-100 rounded-lg text-purple-600"><Calculator size={20}/></span><span className="text-xs text-slate-400">Z-Score</span></div><p className="text-2xl font-bold text-slate-800">{zScoreCount}</p><p className="text-xs text-slate-500">已標準化計算</p></div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex justify-between items-start mb-2"><span className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle size={20}/></span><span className="text-xs text-slate-400">Complete</span></div><p className="text-2xl font-bold text-slate-800">{finalizedCount}</p><p className="text-xs text-slate-500">已完全發布</p></div>
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white p-6 rounded-xl shadow-sm border h-80"><h4 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={16}/> 歷年平均分數趨勢</h4><ResponsiveContainer width="100%" height="100%"><LineChart data={yearlyTrend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis domain={[60, 100]}/><RechartsTooltip/><Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{r:6}}/></LineChart></ResponsiveContainer></div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border h-80"><h4 className="font-bold mb-4 flex items-center gap-2"><Trophy size={16}/> 績效分布 ({viewYear})</h4><ResponsiveContainer width="100%" height="100%"><BarChart data={filtered.map(e=>({name:e.grade, val:1})).reduce((acc:any[], curr)=>{const exist = acc.find(x=>x.name===curr.name);if(exist) exist.count++; else acc.push({name:curr.name, count:1});return acc;}, [])}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><RechartsTooltip/><Bar dataKey="count" fill="#4f46e5" radius={[4,4,0,0]} barSize={40} /></BarChart></ResponsiveContainer></div>
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border"><h4 className="font-bold mb-6 flex items-center gap-2"><Activity size={16}/> 各部門 Top 3 優秀員工 ({viewYear} {viewTerm})</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{(['SALES', 'MANAGEMENT', 'SUPPORT'] as const).map(category => (<div key={category} className="bg-slate-50 p-4 rounded-xl hover:shadow-md transition-shadow"><h5 className="font-bold text-slate-500 text-sm mb-3 uppercase tracking-wider border-b pb-2">{category === 'SALES' ? '業務部 (Sales)' : category === 'MANAGEMENT' ? '管理部 (Management)' : '後勤支援 (Support)'}</h5><ul className="space-y-3">{topPerformers[category]?.map((p:any, idx:number) => (<li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm"><div className="flex items-center gap-2"><span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx===0?'bg-yellow-100 text-yellow-700':idx===1?'bg-slate-100 text-slate-600':'bg-orange-50 text-orange-800'}`}>{idx+1}</span><span className="text-sm font-medium">{p.name || 'Unknown'}</span></div><span className="text-sm font-bold text-indigo-600">{p.score}</span></li>))}{(!topPerformers[category] || topPerformers[category].length === 0) && <li className="text-xs text-slate-400 italic">尚無資料</li>}</ul></div>))}</div></div>
                 </div>
             )}

             {activeTab === 'reviews' && (
                  <div className="grid grid-cols-12 gap-6 h-[600px]">
                       <div className="col-span-4 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                           {!isGM && <div className="p-4 border-b bg-slate-50 space-y-2">
                                <button onClick={calculateZScores} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-700 text-xs"><Calculator size={16}/> 1. 執行 Z-Score 標準化</button>
                                <button onClick={handleExportCSV} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 text-xs"><Download size={16}/> 2. 匯出 CSV 報表</button>
                                <p className="text-xs text-slate-500 mt-2 text-center text-[10px]">匯出包含: 已完整發布且經過標準化之資料</p>
                           </div>}
                           <div className="overflow-y-auto flex-1">{filtered.map(ev => {const emp = employees.find(e => e.id === ev.employeeId);return (<div key={ev.employeeId} onClick={() => setEditEval(ev)} className={`p-4 border-b cursor-pointer hover:bg-slate-50 ${editEval?.employeeId === ev.employeeId ? 'bg-indigo-50 border-l-4 border-indigo-500':''}`}><div className="flex justify-between"><span className="font-bold">{emp?.name} {emp.isManager && '⭐'}</span><span className={`px-2 text-xs rounded ${ev.isHRComplete?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{ev.isHRComplete?'Done':'Pending'}</span></div><div className="text-xs text-slate-500 flex justify-between mt-1"><span>Raw: {ev.rawTotal}</span><span className="font-bold text-indigo-600">Adj: {ev.zScoreAdjusted}</span></div></div>)})}</div>
                      </div>
                      <div className="col-span-8 bg-white rounded-xl shadow-sm p-6 overflow-y-auto">
                          {editEval ? (
                              <div className="space-y-6">
                                  <div className="flex justify-between items-start border-b pb-4"><div><h3 className="text-xl font-bold">{employees.find(e=>e.id===editEval.employeeId)?.name}</h3><p className="text-sm text-slate-500">{editEval.isZScoreCalculated ? '已完成標準化計算' : '⚠️ 尚未進行 Z-Score 計算'}</p></div><div className="text-right"><span className="text-4xl font-bold text-indigo-600">{editEval.totalScore}</span><span className="text-xl text-slate-400 ml-2">{editEval.grade}</span></div></div>
                                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg"><div><span className="text-xs text-slate-500 uppercase">主管原始分 (Raw)</span><p className="text-xl font-bold">{editEval.rawTotal}</p></div><div className="border-l pl-4"><span className="text-xs text-slate-500 uppercase">標準化得分 (Z-Score)</span><p className="text-xl font-bold text-indigo-600">{editEval.zScoreAdjusted}</p></div></div>
                                  <div className="space-y-4"><h4 className="font-bold border-b pb-1">HR 加減分項目 {isGM && <Lock size={12}/>}</h4><div className="grid grid-cols-3 gap-4"><div><label className="text-xs font-bold">出勤 (-10~10)</label><input disabled={isGM} type="number" value={editEval.attendanceBonus} onChange={e=>handleUpdateAdjustment('attendanceBonus',parseInt(e.target.value))} className="w-full border p-2 rounded disabled:bg-slate-100"/></div><div><label className="text-xs font-bold">整體 (-20~20)</label><input disabled={isGM} type="number" value={editEval.overallAdjustment} onChange={e=>handleUpdateAdjustment('overallAdjustment',parseInt(e.target.value))} className="w-full border p-2 rounded disabled:bg-slate-100"/></div><div><label className="text-xs font-bold">獎懲 (-30~30)</label><input disabled={isGM} type="number" value={editEval.rewardsPunishments} onChange={e=>handleUpdateAdjustment('rewardsPunishments',parseInt(e.target.value))} className="w-full border p-2 rounded disabled:bg-slate-100"/></div></div></div>
                                  {!isGM && <div className="flex justify-end pt-4 border-t"><button onClick={handlePublish} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">發布考核結果</button></div>}
                              </div>
                          ) : <div className="text-center text-slate-400 mt-20">請選擇員工查看詳情</div>}
                      </div>
                  </div>
             )}

            {/* Employee Management Tab */}
            {activeTab === 'employees' && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg">人員資料管理</h3>
                        <button onClick={handleAddEmployee} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Plus size={16}/> 新增員工</button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-500 text-xs uppercase">
                            <tr><th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Department</th><th className="p-4">Manager</th><th className="p-4">Account</th><th className="p-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {employees.map((emp: Employee) => (
                                <tr key={emp.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-sm">{emp.id}</td>
                                    <td className="p-4 font-bold">{emp.name} {emp.isManager && '⭐'}</td>
                                    <td className="p-4 text-sm text-slate-600">{emp.role}</td>
                                    <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-slate-100">{emp.department}</span></td>
                                    <td className="p-4 text-sm text-slate-500">{emp.managerId}</td>
                                    <td className="p-4">{users.find((u:User)=>u.id===emp.id) ? <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Active</span> : <span className="text-slate-400 text-xs">No Account</span>}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={()=>handleEditEmployee(emp)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit size={16}/></button>
                                        <button onClick={()=>handleDeleteEmployee(emp.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit_logs' && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-lg">系統操作紀錄 (Audit Logs)</h3></div>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-500 text-xs uppercase sticky top-0">
                                <tr><th className="p-3">Time</th><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Details</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="p-3 whitespace-nowrap text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-3 font-bold">{log.userName}</td>
                                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${log.action==='DELETE'?'bg-red-100 text-red-700':log.action==='CREATE'?'bg-green-100 text-green-700':log.action==='UPDATE'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-700'}`}>{log.action}</span></td>
                                        <td className="p-3 text-xs font-mono bg-slate-50 rounded">{log.target} {log.targetId}</td>
                                        <td className="p-3 text-slate-600">{log.details}</td>
                                    </tr>
                                ))}
                                {logs.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No logs found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Employee Modal */}
            {showEmpModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                        <h3 className="font-bold text-xl mb-4">{editingEmp ? '編輯員工資料' : '新增員工'}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold">ID</label><input disabled={!!editingEmp} value={empForm.id} onChange={e=>setEmpForm({...empForm, id:e.target.value})} className="w-full border p-2 rounded"/></div>
                                <div><label className="text-xs font-bold">Name</label><input value={empForm.name} onChange={e=>setEmpForm({...empForm, name:e.target.value})} className="w-full border p-2 rounded"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold">Department</label><select value={empForm.department} onChange={e=>setEmpForm({...empForm, department:e.target.value})} className="w-full border p-2 rounded">{Object.values(Department).map(d=><option key={d}>{d}</option>)}</select></div>
                                <div><label className="text-xs font-bold">Role Title</label><input value={empForm.role} onChange={e=>setEmpForm({...empForm, role:e.target.value})} className="w-full border p-2 rounded"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold">Manager</label><select value={empForm.managerId} onChange={e=>setEmpForm({...empForm, managerId:e.target.value})} className="w-full border p-2 rounded"><option value="">Select Manager</option>{employees.filter(e=>e.isManager).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}<option value="U_GM">General Manager</option></select></div>
                                <div className="flex items-center pt-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={empForm.isManager} onChange={e=>setEmpForm({...empForm, isManager:e.target.checked})} /> Is Manager?</label></div>
                            </div>
                            {!editingEmp && <p className="text-xs text-slate-500 bg-yellow-50 p-2 rounded">New employees will automatically get a User Account (username=ID, password=password).</p>}
                            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                                <button onClick={()=>setShowEmpModal(false)} className="px-4 py-2 rounded text-slate-500 hover:bg-slate-100">Cancel</button>
                                <button onClick={handleSaveEmployee} className="px-6 py-2 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// Employee View (Unified)
const EmployeeView = ({ user, employees, evaluations, settings, onSave }: any) => {
    // Try to find employee by ID first (safer), then Name
    const emp = employees.find((e:Employee) => e.id === user.id) || employees.find((e:Employee) => e.name === user.name);
    
    // View State
    const [viewYear, setViewYear] = useState(settings.activeYear);
    const [viewTerm, setViewTerm] = useState(settings.activeTerm);
    const [isEditing, setIsEditing] = useState(false);
    const [selfScores, setSelfScores] = useState<ScoreDetails>({});
    const [selfFeedback, setSelfFeedback] = useState('');
    
    // Criteria
    const [criteriaConfig, setCriteriaConfig] = useState<CriteriaConfig | null>(null);
    useEffect(() => { api.getCriteria().then(setCriteriaConfig).catch(console.error); }, []);

    // Fallback if not mapped
    if (!emp) return <div className="p-8 text-center bg-white rounded-xl shadow-sm text-red-500">Error: User ID {user.id} not linked to Employee record.</div>;

    const ev = evaluations.find((e:Evaluation) => e.employeeId === emp.id && e.year === viewYear && e.term === viewTerm);
    const isCurrentPeriod = viewYear === settings.activeYear && viewTerm === settings.activeTerm;

    const activeMetrics = useMemo(() => {
        if (!emp || !criteriaConfig) return [];
        const dept = DEPT_TYPE[emp.department] || 'ADMIN';
        const role = emp.isManager ? 'MANAGER' : 'STAFF';
        const key = `${dept}_${role}`;
        return criteriaConfig[key] || criteriaConfig[`ADMIN_${role}`] || [];
    }, [emp, criteriaConfig]);

    useEffect(() => {
        if (ev) {
            setSelfScores(ev.selfScores || {});
            setSelfFeedback(ev.selfFeedback || '');
        } else {
            // Init empty
            const defaults: ScoreDetails = {};
            activeMetrics.forEach(m => defaults[m.key] = 0);
            setSelfScores(defaults);
            setSelfFeedback('');
        }
    }, [ev, activeMetrics]);

    const handleScoreChange = (key: string, val: number) => setSelfScores(prev => ({ ...prev, [key]: val }));
    const handleSaveSelf = () => {
        if (!confirm('確定提交自評嗎？提交後主管將可看到您完成的狀態。')) return;
        
        const newEval: Evaluation = ev ? { ...ev, selfScores, selfFeedback, isSelfComplete: true } : {
            employeeId: emp.id,
            managerId: emp.managerId, // Critical: Must have manager
            year: viewYear,
            term: viewTerm,
            scores: {}, // Manager scores empty if new
            selfScores,
            selfFeedback,
            isSelfComplete: true,
            isManagerComplete: false,
            isHRComplete: false,
            isZScoreCalculated: false,
            rawTotal: 0, zScoreAdjusted: 0, attendanceBonus: 0, overallAdjustment: 0, rewardsPunishments: 0, totalScore: 0, grade: '', feedback: ''
        };
        onSave(newEval);
        setIsEditing(false);
        alert('自評已提交！');
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* View Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-4 flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-2"><History size={16}/> 考核期間</span>
                <div className="flex gap-2">
                    <input type="number" list="years-list" value={viewYear} onChange={e=>setViewYear(parseInt(e.target.value)||0)} className="bg-slate-100 rounded p-1 text-sm font-bold outline-none w-20"/>
                    <datalist id="years-list">{YEARS.map(y => <option key={y} value={y} />)}</datalist>
                    <select value={viewTerm} onChange={e=>setViewTerm(e.target.value)} className="bg-slate-100 rounded p-1 text-sm font-bold outline-none">{TERMS.map(t=><option key={t} value={t}>{t}</option>)}</select>
                </div>
            </div>

            {/* Self Evaluation Section (Only valid for Current Period) */}
            {isCurrentPeriod && (
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 animate-in fade-in">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2"><Edit size={18}/> 員工自評區 ({viewYear} {viewTerm})</h2>
                            <p className="text-xs text-slate-500">自評分數僅供主管面談參考，不計入最終考核成績。</p>
                        </div>
                        {!isEditing && (
                            ev?.isSelfComplete 
                            ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> 已完成 ({new Date().toISOString().slice(0,10)})</span>
                            : <button onClick={()=>setIsEditing(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700">開始自評</button>
                        )}
                        {isEditing && <button onClick={()=>setIsEditing(false)} className="text-slate-400 hover:text-slate-600">取消</button>}
                    </div>

                    {isEditing ? (
                        <div className="space-y-6">
                            {activeMetrics.map(metric => (
                                <RangeInput 
                                    key={metric.key}
                                    label={metric.label}
                                    max={metric.max}
                                    description={metric.description}
                                    value={selfScores[metric.key] || 0}
                                    onChange={v => handleScoreChange(metric.key, v)}
                                />
                            ))}
                            <div>
                                <label className="font-bold text-sm mb-2 block">自評補充/心得</label>
                                <textarea value={selfFeedback} onChange={e => setSelfFeedback(e.target.value)} className="w-full h-24 p-2 border rounded-lg text-sm" placeholder="本期工作心得..."></textarea>
                            </div>
                            <button onClick={handleSaveSelf} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">提交自評</button>
                        </div>
                    ) : (
                        ev?.isSelfComplete && (
                            <div className="text-slate-600 text-sm">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                   {activeMetrics.map(m => (
                                       <div key={m.key} className="bg-slate-50 p-2 rounded border"><span className="text-[10px] text-slate-400 block">{m.label}</span><span className="font-bold">{selfScores[m.key] || 0} / {m.max}</span></div>
                                   ))}
                                </div>
                                <p className="bg-slate-50 p-3 rounded italic">"{selfFeedback}"</p>
                                <button onClick={()=>setIsEditing(true)} className="mt-4 text-xs text-indigo-600 hover:underline">修改自評</button>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Official Result Display */}
            {(!ev || !ev.isHRComplete) ? (
                <div className="p-8 text-center bg-white rounded-xl shadow-sm text-slate-500">
                    <p className="text-4xl mb-2">📭</p>
                    <p>{viewYear} {viewTerm} 尚無已發布的正式考核結果。</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border overflow-hidden animate-in zoom-in-95">
                    <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
                        <div className="relative z-10"><h1 className="text-4xl font-bold mb-1">{ev.grade}</h1><p className="text-indigo-200">總分 {ev.totalScore}</p></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3"><span>主管原始評分</span><span className="font-bold text-slate-500">{ev.rawTotal}</span></div>
                        <div className="flex justify-between items-center border-b pb-3"><span>標準化調整後</span><span className="font-bold text-indigo-600">{ev.zScoreAdjusted}</span></div>
                        <div className="flex justify-between items-center border-b pb-3"><span>HR 加減分總計</span><span className="font-bold ">{ev.attendanceBonus + ev.overallAdjustment + ev.rewardsPunishments}</span></div>
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 italic">"{ev.feedback}"</div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main App

// Main App
// Change Password View
const ChangePasswordView = ({ onSave, onCancel }: { onSave: (old: string, newP: string) => void, onCancel: () => void }) => {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!oldPass || !newPass || !confirmPass) { setError('請填寫所有欄位'); return; }
        if (newPass !== confirmPass) { setError('新密碼不一致'); return; }
        onSave(oldPass, newPass);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="text-indigo-600"/> 修改密碼</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">舊密碼</label><input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} className="w-full border p-3 rounded-lg"/></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">新密碼</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full border p-3 rounded-lg"/></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">確認新密碼</label><input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} className="w-full border p-3 rounded-lg"/></div>
                {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-lg border text-slate-600 font-bold hover:bg-slate-50">取消</button>
                    <button type="submit" className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700">確認修改</button>
                </div>
            </form>
        </div>
    );
};

// Main App
const App = () => {
    // State
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<'LOGIN'|'DASHBOARD'>('LOGIN');
    const [currentView, setCurrentView] = useState<string>('dashboard'); // manager_eval, hr_dashboard, my_eval, change_password
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [users, setUsers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [settings, setSettings] = useState<SystemSettings>({ activeYear: 2024, activeTerm: 'Yearly', periodName: '2024 Annual Performance Review' });

    // Load Data
    useEffect(() => {
        const loadJava = async () => {
             try {
                 const [u, e, ev, setts] = await Promise.all([api.getUsers(), api.getEmployees(), api.getEvaluations(), api.getSettings()]);
                 setUsers(u);
                 setEmployees(e);
                 // Fix: Ensure evaluations is always an array
                 if(Array.isArray(ev)) setEvaluations(ev); else setEvaluations([]);
                 // Load Settings
                 if(setts) setSettings(setts);
             } catch (err) {
                 console.error("Failed to load data", err);
             }
        };
        loadJava();
    }, []);

    const handleLogin = (found: User) => {
        if (found) { 
            setUser(found); 
            setView('DASHBOARD');
            
            api.addLog({
                userId: found.id, userName: found.name, action: 'LOGIN', target: 'USER', targetId: found.id,
                details: `User ${found.name} logged in.`
            });

            // Set default view based on role
            if(found.role === Role.HR || found.role === Role.GM) setCurrentView('hr_dashboard');
            else if(found.role === Role.MANAGER) setCurrentView('manager_eval');
            else setCurrentView('my_eval');
        }
    };

    const handleLogout = () => {
        setUser(null); 
        setView('LOGIN');
        setCurrentView('dashboard');
    };

    const handleSaveEvals = async (updatedEval: Evaluation) => {
        const newEvals = [...evaluations.filter(e => !(e.employeeId === updatedEval.employeeId && e.year === updatedEval.year && e.term === updatedEval.term)), updatedEval];
        setEvaluations(newEvals);
        await api.saveEvaluations(newEvals);
    };

    const handleBatchSaveEvals = async (updatedEvals: Evaluation[]) => {
       let merged = [...evaluations];
       updatedEvals.forEach(u => {
           merged = merged.filter(e => !(e.employeeId === u.employeeId && e.year === u.year && e.term === u.term));
           merged.push(u);
       });
       setEvaluations(merged);
       await api.saveEvaluations(merged);
    };

    const handleUpdateSettings = async (s: SystemSettings) => {
        await api.saveSettings(s);
        setSettings(s);
    };
    const handleSaveUsers = async (newUsers: User[]) => { setUsers(newUsers); await api.saveUsers(newUsers); };
    const handleSaveEmployees = async (newEmps: Employee[]) => { setEmployees(newEmps); await api.saveEmployees(newEmps); };

    const handleChangePassword = (oldP: string, newP: string) => {
        if (!user) return;
        if (user.password !== oldP) { alert('舊密碼錯誤'); return; }
        
        const updatedUser = { ...user, password: newP };
        const newUsers = users.map(u => u.id === user.id ? updatedUser : u);
        handleSaveUsers(newUsers);
        setUser(updatedUser); // Update local session
        alert('密碼修改成功！');
        
        // Return to default view
        if(user.role === Role.HR || user.role === Role.GM) setCurrentView('hr_dashboard');
        else if(user.role === Role.MANAGER) setCurrentView('manager_eval');
        else setCurrentView('my_eval');
    };

    if (view === 'LOGIN') return <LoginView onLogin={handleLogin} users={users} />;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-20">
                <div className="font-bold flex items-center gap-2"><TrendingUp/> PerformX</div>
                <button onClick={() => setIsMenuOpen(true)}><Menu/></button>
            </div>
            
            <Sidebar user={user} onLogout={handleLogout} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} viewMode={currentView} setViewMode={setCurrentView} />
            
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto mt-16 lg:mt-0">
                {currentView === 'hr_dashboard' && <HRView user={user} employees={employees} users={users} evaluations={evaluations} settings={settings} onUpdateSettings={handleUpdateSettings} onSave={handleSaveEvals} onBatchSave={handleBatchSaveEvals} onSaveUsers={handleSaveUsers} onSaveEmployees={handleSaveEmployees} />}
                {currentView === 'manager_eval' && <ManagerView user={user} employees={employees} evaluations={evaluations} settings={settings} onSave={handleSaveEvals} />}
                {currentView === 'my_eval' && <EmployeeView user={user} employees={employees} evaluations={evaluations} settings={settings} onSave={handleSaveEvals} />}
                {currentView === 'change_password' && <ChangePasswordView onSave={handleChangePassword} onCancel={() => {
                     // Cancel returns to default view
                     if(user.role === Role.HR || user.role === Role.GM) setCurrentView('hr_dashboard');
                     else if(user.role === Role.MANAGER) setCurrentView('manager_eval');
                     else setCurrentView('my_eval');
                }} />}
            </main>
        </div>
    );
};
export default App;