import React, { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, BrainCircuit, TrendingUp, Shield, LogOut, FileText, History, Calendar, Settings, Save, Server, Edit, AlertTriangle, Menu, X, ChevronDown, ChevronUp, Calculator, BarChart3, Lock, Trophy, Activity, Clock, Plus, Trash2, Share2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Role, Employee, Evaluation, Department, User, DEPT_TYPE, TERMS, ScoreDetails, AssessmentTerm } from './types';
import { generateFeedback } from './services/geminiService';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { calculateRaw, calculateGrade, calculateStdDev, calculateMean } from './utils.ts';

import { api } from './services/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
const YEARS = [2022, 2023, 2024, 2025, 2026];

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
type StandardType = 'QUALITY' | 'PROBLEM_SOLVING' | 'COLLABORATION' | 'LEARNING' | 'ENGAGEMENT';
const STANDARDS_MAP: Record<StandardType, string[]> = {
    QUALITY: [
        '完全符合甚至超乎預期標準。', '幾乎完全符合需求，尚有小幅改善空間。', '符合需求，但某些項目不穩定，有明顯的改進空間。', '未能達到需求的標準，落後於目標達成預期，經常出現錯誤或效率低下，影響團隊或整體工作進度。', '遠未達到需求的標準，表現極差，經常導致嚴重錯誤或延宕，且未能展現任何改善意願或行動。'
    ],
    PROBLEM_SOLVING: [
        '快速且高效地解決所有工作中遇到的問題。', '能夠有效解決大部分問題，僅少數需協助。', '能解決部分問題，但需依賴他人幫助。', '無法獨立解決問題，經常需他人介入。', '對問題的反應遲緩，未能解決或拖延問題處理。'
    ],
    COLLABORATION: [
        '積極主動參與團隊合作，並對團隊有顯著貢獻。', '良好的團隊合作能力，與同事相處融洽。', '基本參與團隊合作，但對團隊貢獻有限。', '偶爾參與團隊合作，合作意願不高。', '缺乏團隊合作精神，影響團隊整體效能。'
    ],
    LEARNING: [
        '積極主動學習新知識並應用於工作中，顯著提升自身技能。', '經常參加學習活動，並能有效應用所學。', '參與學習活動，但對工作幫助有限。', '參與學習意願低，無明顯進步。', '拒絕學習，無意願提高專業技能。'
    ],
    ENGAGEMENT: [
        '高度認同公司文化，積極參與各種公司活動。', '認同公司文化，並參與部分公司活動。', '對公司文化的認同感有限，僅偶爾參與活動。', '不積極參與公司文化活動，態度冷淡。', '拒絕參與公司活動，對公司文化持消極態度。'
    ]
};

// --- HELPERS ---
const getStandardText = (type: StandardType, pct: number) => {
    const s = STANDARDS_MAP[type];
    if(pct >= 90) return s[0];
    if(type !== 'QUALITY' && pct >= 70) return s[1]; 
    if(type === 'QUALITY' && pct >= 80) return s[1]; 
    if(pct >= 60) return s[2];
    if(pct >= 30) return s[3];
    return s[4];
};









// --- COMPONENTS ---
const RangeInput = ({ label, value, max, standardType, onChange }: { label: string, value: number, max: number, standardType: StandardType, onChange: (v: number) => void }) => {
    const percent = max > 0 ? Math.round((value / max) * 100) : 0;
    const handleChange = (newPercent: number) => {
        const newValue = Math.round((newPercent / 100) * max);
        onChange(newValue);
    };
    const desc = getStandardText(standardType, percent);

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
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex flex-col items-center mb-6"><div className="bg-indigo-600 p-3 rounded-xl mb-4"><TrendingUp className="text-white" size={32} /></div><h1 className="text-2xl font-bold text-slate-800">PerformX</h1></div>
                <form onSubmit={handleLogin} className="space-y-4"><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Username" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Password" />{error && <p className="text-red-500 text-sm">{error}</p>}<button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">登入</button></form>
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
    const [scores, setScores] = useState<ScoreDetails>({ problemSolving: 0, collaboration: 0, professionalDev: 0, engagement: 0 });
    const [feedback, setFeedback] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [showEmployeeList, setShowEmployeeList] = useState(false);
    
    // View Mode for Manager: 'evaluate' (Current Active) or 'history' (Past)
    const [mode, setMode] = useState<'evaluate' | 'history'>('evaluate');
    const [viewHistoryEval, setViewHistoryEval] = useState<Evaluation | null>(null);

    // Current Active Evaluation (Editable)
    const selectedEmployee = myEmployees.find((e: Employee) => e.id === selectedEmpId);
    const currentEval = evaluations.find((e: Evaluation) => e.employeeId === selectedEmpId && e.year === settings.activeYear && e.term === settings.activeTerm);
    
    // History Evaluations (Read-Only)
    const historyEvals = evaluations.filter((e:Evaluation) => e.employeeId === selectedEmpId && !(e.year === settings.activeYear && e.term === settings.activeTerm)).sort((a:Evaluation,b:Evaluation) => b.year - a.year);

    const isSales = selectedEmployee ? DEPT_TYPE[selectedEmployee.department] === 'SALES' : false;

    useEffect(() => {
        if (!selectedEmployee) return;
        setMode('evaluate'); // Reset to evaluate mode on switch
        setViewHistoryEval(null);
        if (currentEval) {
            setScores(currentEval.scores);
            setFeedback(currentEval.feedback);
        } else {
            const defaults: any = { problemSolving: 7, collaboration: 7, professionalDev: 3, engagement: 3 };
            if(isSales) { defaults.achievementRate = 25; defaults.salesAmount = 15; defaults.developmentActive = 7; defaults.activityQuality = 3; }
            else { defaults.accuracy = 15; defaults.timeliness = 7; defaults.targetAchievement = 30; }
            setScores(defaults);
            setFeedback('');
        }
    }, [selectedEmpId, currentEval, isSales, selectedEmployee]);

    const handleScoreChange = (key: keyof ScoreDetails, val: number) => setScores(prev => ({ ...prev, [key]: val }));
    const handleSave = () => {
        if (!selectedEmployee) return;
        const raw = calculateRaw(scores);
        onSave({ 
            employeeId: selectedEmpId, managerId: user.id, year: settings.activeYear, term: settings.activeTerm,
            scores, rawTotal: raw, zScoreAdjusted: currentEval?.zScoreAdjusted || raw, 
            attendanceBonus: currentEval?.attendanceBonus || 0, overallAdjustment: currentEval?.overallAdjustment || 0, rewardsPunishments: currentEval?.rewardsPunishments || 0,
            totalScore: (currentEval?.zScoreAdjusted || raw) + (currentEval?.attendanceBonus || 0) + (currentEval?.overallAdjustment || 0) + (currentEval?.rewardsPunishments || 0),
            grade: '', feedback, isManagerComplete: true, isZScoreCalculated: currentEval?.isZScoreCalculated || false, isHRComplete: currentEval?.isHRComplete || false
        });
        alert('已提交評分！等待 HR 進行標準化計算。');
    };
    const handleGenerateAI = async () => {
        setIsGeneratingAI(true);
        const text = await generateFeedback(selectedEmployee.name, scores, selectedEmployee.role);
        setFeedback(text);
        setIsGeneratingAI(false);
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
                                <h2 className="text-lg font-bold border-b pb-4 mb-4">目標與品質 (70%) - {isSales ? '業務部' : '行政部'}</h2>
                                {isSales ? ( <> <RangeInput label="業績達成率" max={35} standardType="QUALITY" value={scores.achievementRate || 0} onChange={v => handleScoreChange('achievementRate', v)} /> <RangeInput label="業績額度" max={20} standardType="QUALITY" value={scores.salesAmount || 0} onChange={v => handleScoreChange('salesAmount', v)} /> <RangeInput label="業務開發積極度" max={10} standardType="QUALITY" value={scores.developmentActive || 0} onChange={v => handleScoreChange('developmentActive', v)} /> <RangeInput label="業務活動品質" max={5} standardType="QUALITY" value={scores.activityQuality || 0} onChange={v => handleScoreChange('activityQuality', v)} /> </> ) : ( <> <RangeInput label="工作目標達成" max={40} standardType="QUALITY" value={scores.targetAchievement || 0} onChange={v => handleScoreChange('targetAchievement', v)} /> <RangeInput label="作業準確度" max={20} standardType="QUALITY" value={scores.accuracy || 0} onChange={v => handleScoreChange('accuracy', v)} /> <RangeInput label="時間完成度" max={10} standardType="QUALITY" value={scores.timeliness || 0} onChange={v => handleScoreChange('timeliness', v)} /> </> )}
                                <h2 className="text-lg font-bold border-b pb-4 mb-4 mt-8">共同項目 (30%)</h2>
                                <RangeInput label="問題解決能力" max={10} standardType="PROBLEM_SOLVING" value={scores.problemSolving} onChange={v => handleScoreChange('problemSolving', v)} /> <RangeInput label="團隊合作" max={10} standardType="COLLABORATION" value={scores.collaboration} onChange={v => handleScoreChange('collaboration', v)} /> <RangeInput label="職業發展" max={5} standardType="LEARNING" value={scores.professionalDev} onChange={v => handleScoreChange('professionalDev', v)} /> <RangeInput label="敬業度" max={5} standardType="ENGAGEMENT" value={scores.engagement} onChange={v => handleScoreChange('engagement', v)} />
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'reviews' | 'employees'>('dashboard');
    const [editEval, setEditEval] = useState<Evaluation | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);

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
        const depts = [Department.ENGINEERING, Department.SALES, Department.MARKETING, Department.HR];
        const result: any = {};
        depts.forEach(d => {
            const deptEmps = employees.filter((e:Employee) => e.department === d).map((e:Employee) => e.id);
            const deptEvals = filtered.filter((e:Evaluation) => deptEmps.includes(e.employeeId));
            const sorted = deptEvals.sort((a:Evaluation, b:Evaluation) => b.totalScore - a.totalScore).slice(0, 3);
            result[d] = sorted.map((ev:Evaluation) => ({
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
    const handlePublish = () => { if(!editEval) return; onSave({...editEval, isHRComplete: true}); setEditEval(null); };

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
    };
    const handleDeleteEmployee = (id: string) => {
        if(confirm('確定刪除員工資料? 此動作連同 User 帳號會一併移除。')) {
            onSaveEmployees(employees.filter((e:Employee) => e.id !== id));
            onSaveUsers(users.filter((u:User) => u.id !== id));
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
                          <select value={viewYear} onChange={e=>setViewYear(parseInt(e.target.value))} className="bg-transparent text-sm font-bold text-slate-700 py-1 cursor-pointer outline-none">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                          <span className="text-slate-300 mx-1">|</span>
                          <select value={viewTerm} onChange={e=>setViewTerm(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 py-1 pr-2 cursor-pointer outline-none">{TERMS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                      </div>
                  </h2>
                  <div className="flex gap-4 mt-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`text-sm font-medium pb-1 ${activeTab==='dashboard'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>儀表板</button>
                    <button onClick={() => setActiveTab('reviews')} className={`text-sm font-medium pb-1 ${activeTab==='reviews'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>{isGM? '全體考核狀況' : `考核管理 (${submittedCount - finalizedCount} 待審)`}</button>
                    {!isGM && <button onClick={() => setActiveTab('employees')} className={`text-sm font-medium pb-1 ${activeTab==='employees'? 'text-indigo-600 border-b-2 border-indigo-600':'text-slate-500'}`}>人員管理</button>}
                  </div>
                </div>
                {!isGM && (
                    <button onClick={() => setShowSettings(!showSettings)} className="text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg text-sm font-bold flex gap-2 w-full md:w-auto justify-center">
                        <Settings size={16}/> 系統設定 (目前: {settings.activeYear} {settings.activeTerm})
                    </button>
                )}
             </header>

             {showSettings && (
                 <div className="bg-slate-800 text-white p-6 rounded-xl shadow-xl flex gap-4 items-end animate-in fade-in slide-in-from-top-4">
                     <div><label>Active Year</label><select value={tempSettings.activeYear} onChange={e=>setTempSettings({...tempSettings, activeYear: parseInt(e.target.value)})} className="text-black block rounded p-1 w-24">{YEARS.map(y=><option key={y}>{y}</option>)}</select></div>
                     <div><label>Active Term</label><select value={tempSettings.activeTerm} onChange={e=>setTempSettings({...tempSettings, activeTerm: e.target.value})} className="text-black block rounded p-1 w-32">{TERMS.map(t=><option key={t}>{t}</option>)}</select></div>
                     <div className="flex-1"><label>Period Name (Display)</label><input className="text-black block rounded p-1 w-full" value={tempSettings.periodName} onChange={e=>setTempSettings({...tempSettings, periodName: e.target.value})}/></div>
                     <button onClick={() => { onUpdateSettings(tempSettings); setShowSettings(false); setViewYear(tempSettings.activeYear); setViewTerm(tempSettings.activeTerm); }} className="bg-green-600 px-4 py-1 rounded font-bold">Save & Apply</button>
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
                     <div className="bg-white p-6 rounded-xl shadow-sm border"><h4 className="font-bold mb-6 flex items-center gap-2"><Activity size={16}/> 各部門 Top 3 優秀員工 ({viewYear} {viewTerm})</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[Department.ENGINEERING, Department.SALES, Department.MARKETING, Department.HR].map(dept => (<div key={dept} className="bg-slate-50 p-4 rounded-xl hover:shadow-md transition-shadow"><h5 className="font-bold text-slate-500 text-sm mb-3 uppercase tracking-wider border-b pb-2">{dept}</h5><ul className="space-y-3">{topPerformers[dept]?.map((p:any, idx:number) => (<li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm"><div className="flex items-center gap-2"><span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx===0?'bg-yellow-100 text-yellow-700':idx===1?'bg-slate-100 text-slate-600':'bg-orange-50 text-orange-800'}`}>{idx+1}</span><span className="text-sm font-medium">{p.name || 'Unknown'}</span></div><span className="text-sm font-bold text-indigo-600">{p.score}</span></li>))}{(!topPerformers[dept] || topPerformers[dept].length === 0) && <li className="text-xs text-slate-400 italic">尚無資料</li>}</ul></div>))}</div></div>
                 </div>
             )}

             {activeTab === 'reviews' && (
                  <div className="grid grid-cols-12 gap-6 h-[600px]">
                      <div className="col-span-4 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                           {!isGM && <div className="p-4 border-b bg-slate-50"><button onClick={calculateZScores} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-700"><Calculator size={16}/> 執行 Z-Score 標準化 ({viewYear} {viewTerm})</button><p className="text-xs text-slate-500 mt-2 text-center">計算後將自動更新所有所有分數</p></div>}
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
const EmployeeView = ({ user, employees, evaluations, settings }: any) => {
    // Try to find employee by ID first (safer), then Name
    const emp = employees.find((e:Employee) => e.id === user.id) || employees.find((e:Employee) => e.name === user.name);
    
    // View State
    const [viewYear, setViewYear] = useState(settings.activeYear);
    const [viewTerm, setViewTerm] = useState(settings.activeTerm);

    // Fallback if not mapped
    if (!emp) return <div className="p-8 text-center bg-white rounded-xl shadow-sm text-red-500">Error: User ID {user.id} not linked to Employee record.</div>;

    const ev = evaluations.find((e:Evaluation) => e.employeeId === emp.id && e.year === viewYear && e.term === viewTerm);

    return (
        <div className="max-w-md mx-auto">
            {/* View Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-4 flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-2"><History size={16}/> 考核期間</span>
                <div className="flex gap-2">
                    <select value={viewYear} onChange={e=>setViewYear(parseInt(e.target.value))} className="bg-slate-100 rounded p-1 text-sm font-bold outline-none">{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
                    <select value={viewTerm} onChange={e=>setViewTerm(e.target.value)} className="bg-slate-100 rounded p-1 text-sm font-bold outline-none">{TERMS.map(t=><option key={t} value={t}>{t}</option>)}</select>
                </div>
            </div>

            {(!ev || !ev.isHRComplete) ? (
                <div className="p-8 text-center bg-white rounded-xl shadow-sm text-slate-500">
                    <p className="text-4xl mb-2">📭</p>
                    <p>{viewYear} {viewTerm} 尚無已發布的考核結果。</p>
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
                 const [u, e, ev] = await Promise.all([api.getUsers(), api.getEmployees(), api.getEvaluations()]);
                 setUsers(u);
                 setEmployees(e);
                 // Fix: Ensure evaluations is always an array
                 if(Array.isArray(ev)) setEvaluations(ev); else setEvaluations([]);
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

    const handleUpdateSettings = (s: SystemSettings) => setSettings(s);
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
                {currentView === 'my_eval' && <EmployeeView user={user} employees={employees} evaluations={evaluations} settings={settings} />}
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