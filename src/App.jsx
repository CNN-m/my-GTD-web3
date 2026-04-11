import React, { useState, useEffect } from 'react';
import './App.css'; 
import GtdPanel from './GtdPanel'; 
import SchedulePanel from './SchedulePanel'; 

export default function App() {
  const API_BASE_URL = "https://gtd-date-api.2180295860.workers.dev";

  // =============== 【核心修复1】登录状态持久化（从localStorage完整恢复） ===============
  const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true); // 新增加载状态，防止UI闪烁

  const [globalTasks, setGlobalTasks] = useState([]);
  const [globalProjects, setGlobalProjects] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // =============== 【核心修复2】登录状态变化时，同步到localStorage ===============
  useEffect(() => {
    if (userId && username) {
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);
    }
    setIsLoading(false); // 状态初始化完成
  }, [userId, username]);

  // =============== 退出登录（安全清理所有状态） ===============
  const handleLogout = () => {
    setUserId(null);
    setUsername("");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setGlobalTasks([]);
    setGlobalProjects([]);
    setIsDataLoaded(false);
    alert("已安全退出，所有状态已清空");
  };

  // =============== 登录逻辑（修复：登录成功后立即加载完整数据） ===============
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserId(data.user_id);
        setUsername(data.username);
        alert("登录成功！正在加载您的所有数据...");
        // 登录成功后立即加载完整数据（任务+项目）
        await loadAllUserData(data.user_id);
      } else {
        alert(data.msg);
      }
    } catch (e) {
      console.error("登录失败", e);
      alert("登录失败，请检查网络或账号密码");
    } finally {
      setIsLoading(false);
    }
  };

  // =============== 注册逻辑（修复：注册后自动登录并加载数据） ===============
  const handleRegister = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("注册成功！正在登录...");
        // 注册成功后自动登录并加载数据
        await handleLogin();
      } else {
        alert(data.msg);
      }
    } catch (e) {
      console.error("注册失败", e);
      alert("注册失败，请检查网络或用户名是否已存在");
    } finally {
      setIsLoading(false);
    }
  };

  // =============== 【核心修复3】加载完整用户数据（任务+项目） ===============
  const loadAllUserData = async (userId) => {
    try {
      setIsLoading(true);
      
      // 1. 加载任务数据
      const tasksRes = await fetch(`${API_BASE_URL}/get-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const tasksData = await tasksRes.json();
      const parsedTasks = tasksData.ok ? (tasksData.tasks || []).map(t => {
        try {
          return typeof t.content === 'string' ? JSON.parse(t.content) : t.content;
        } catch (err) {
          console.error("任务解析失败", t.content, err);
          return t.content || {};
        }
      }) : [];
      
      // 2. 加载项目数据（新增！）
      const projectsRes = await fetch(`${API_BASE_URL}/get-projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const projectsData = await projectsRes.json();
      const parsedProjects = projectsData.ok ? (projectsData.projects || []).map(p => {
        try {
          return typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
        } catch (err) {
          console.error("项目解析失败", p.content, err);
          return p.content || {};
        }
      }) : [];
      
      // 3. 更新状态
      setGlobalTasks(parsedTasks);
      setGlobalProjects(parsedProjects);
      setIsDataLoaded(true);
      console.log("✅ 数据加载完成：任务", parsedTasks.length, "个，项目", parsedProjects.length, "个");
    } catch (error) {
      console.error("❌ 获取完整数据失败", error);
      alert("数据加载失败，请重试或联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // =============== 【核心修复4】用户ID变化时自动加载数据（刷新时触发） ===============
  useEffect(() => {
    if (userId && !isDataLoaded) {
      loadAllUserData(userId); // 登录状态恢复后，自动加载完整数据
    }
  }, [userId, isDataLoaded]);

  // =============== 【核心修复5】云端保存函数（任务+项目都支持） ===============
  const saveToCloud = async (type, content) => {
    if (!userId) return false;
    try {
      const endpoint = type === 'task' ? '/save-task' : '/save-project';
      await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          content: JSON.stringify(content),
        }),
      });
      return true;
    } catch (e) {
      console.error(`❌ ${type}保存失败`, e);
      return false;
    }
  };

  // =============== 任务管理（修复：添加时同步云端） ===============
  const handleAddGlobalTask = (newTask) => {
    const task = { ...newTask, id: Date.now() };
    setGlobalTasks(prev => [task, ...prev]);
    saveToCloud('task', task); // 同步到云端
  };

  // =============== 项目管理（新增：添加时同步云端） ===============
  const handleAddGlobalProject = (newProject) => {
    const project = { ...newProject, id: Date.now() };
    setGlobalProjects(prev => [project, ...prev]);
    saveToCloud('project', project); // 同步到云端
  };

  // =============== AI批量解析（修复：导入时同步云端） ===============
  const [chatHistory, setChatHistory] = useState([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiParsedTasks, setAiParsedTasks] = useState([]); 

  const handleAiSubmit = () => {
    const aiInputBox = document.getElementById('aiInput');
    const userText = aiInputBox.value;
    if (!userText.trim()) return;

    setChatHistory(prev => [{ role: 'user', text: userText, id: Date.now() }, ...prev]);
    aiInputBox.value = '';

    setTimeout(() => {
      setChatHistory(prev => [{ role: 'ai', text: '已为您将长段落拆解为多个子任务，请在弹窗中检查并确认导入。', id: Date.now() }, ...prev]);
      const mockParsedTasks = [
        { id: Date.now()+1, title: 'AI提取任务 1: ' + userText.substring(0, 5), desc: userText, status: 'inbox', priority: 'high', project: '尚未分类', time: '无硬性时间', date: '', completed: false },
        { id: Date.now()+2, title: 'AI提取任务 2: 顺便处理...', desc: '自动拆解的补充事项', status: 'nextStep', priority: 'medium', project: '尚未分类', time: '无硬性时间', date: '', completed: false }
      ];
      setAiParsedTasks(mockParsedTasks);
      setIsAiModalOpen(true); 
    }, 1000);
  };

  const handleAiTaskChange = (taskId, field, value) => {
    setAiParsedTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
  };

  const removeAiTask = (taskId) => {
    setAiParsedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleApproveAiTasks = () => {
    setGlobalTasks(prev => [...aiParsedTasks, ...prev]);
    aiParsedTasks.forEach(task => saveToCloud('task', task)); // 同步到云端
    setIsAiModalOpen(false);
    setAiParsedTasks([]);
  };

  // =============== 手动表单提交（修复：项目添加同步云端） ===============
  const handleManualSubmit = (event) => {
    event.preventDefault(); 
    const title = event.target.taskTitle.value;
    const desc = event.target.taskDesc.value;
    const gtdOptionValue = event.target.gtdOption.value; 
    const priority = event.target.taskPriority.value; 
    const projectName = event.target.projectName.value;
    const startTime = event.target.startTime.value; 

    if (gtdOptionValue === "2") {
      const newProject = {
        name: title,
        status: '新计划',
        desc: desc || '暂无描述',
        purpose: '',
        stages: [],
        logs: []
      };
      handleAddGlobalProject(newProject); // 已包含云端保存
      event.target.reset();
      return; 
    }

    let mappedStatus = 'inbox'; 
    if (gtdOptionValue === "1") mappedStatus = 'nextStep';
    if (gtdOptionValue === "3") mappedStatus = 'maybe';
    if (gtdOptionValue === "4") mappedStatus = 'trash'; 
    if (gtdOptionValue === "5") mappedStatus = 'schedule';
    if (gtdOptionValue === "6") mappedStatus = 'waiting'; 

    const displayTime = startTime ? startTime.replace('T', ' ') : '无硬性时间';

    const newTask = {
      title: title, desc: desc || '无描述', status: mappedStatus, priority: priority, time: displayTime, project: projectName || '尚未分类', date: startTime ? startTime.split('T')[0] : '', completed: false
    };

    handleAddGlobalTask(newTask); // 已包含云端保存
    event.target.reset();
  };

  // =============== 状态回顾 ===============
  const [reviewModal, setReviewModal] = useState({ isOpen: false, title: '', statusKey: '' });
  const counts = {
    inbox: globalTasks.filter(t => t.status === 'inbox' && !t.completed).length,
    nextStep: globalTasks.filter(t => t.status === 'nextStep' && !t.completed).length,
    waiting: globalTasks.filter(t => t.status === 'waiting' && !t.completed).length,
    trash: globalTasks.filter(t => t.status === 'trash').length
  };
  const openReview = (title, statusKey) => setReviewModal({ isOpen: true, title, statusKey });
  const closeReview = () => setReviewModal({ isOpen: false, title: '', statusKey: '' });

  // =============== 加载中状态显示 ===============
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>加载中...</div>
        <div style={{ width: '50px', height: '50px', border: '5px solid #0070f3', borderTop: '5px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style jsx global>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // =============== 未登录 → 登录/注册页面 ===============
  if (!userId) {
    return (
      <div style={{
        maxWidth: '400px',
        margin: '100px auto',
        padding: '30px',
        border: '1px solid #ddd',
        borderRadius: '12px',
        background: '#fff'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>GTD 工作流 · 登录</h2>

        <div style={{ marginBottom: '15px' }}>
          <input
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>

        <button 
          onClick={handleLogin}
          style={{ width: '100%', padding: '12px', fontSize: '16px', marginBottom: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          登录
        </button>

        <button 
          onClick={handleRegister}
          style={{ width: '100%', padding: '12px', fontSize: '16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
        >
          注册账号
        </button>
      </div>
    );
  }

  // =============== 已登录 → 完整GTD系统 ===============
  return (
    <div className="app-root">
      <header className="page-header">
        <h1>GTD工作流</h1>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>欢迎，{username} 👋</span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>退出登录</button>
        </div>
      </header>

      <main className="main-container">
        <section className="column left-col">
          <div className="card">
            <div className="card-title">自然语言输入</div>
            <div className="input-wrapper">
              <textarea id="aiInput" placeholder="输入一堆杂乱的计划，AI帮你拆解..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}></textarea>
              <button className="btn-primary submit-btn" onClick={handleAiSubmit} style={{ marginTop: '10px', padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>AI分析</button>
            </div>
            <div className="history-area" id="chatHistory" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
              {chatHistory.length === 0 ? <div style={{ color: '#ccc', textAlign: 'center', marginTop: '50px', fontSize: '13px' }}>暂无对话记录</div> : chatHistory.map(msg => (
                <div key={msg.id} style={{ background: msg.role === 'ai' ? '#f0f2f5' : '#e6f7ff', padding: '10px', borderRadius: '8px', marginBottom: '10px', textAlign: 'left', fontSize: '13px', borderLeft: msg.role === 'ai' ? '3px solid #ccc' : '3px solid #1890ff' }}>
                  <strong>{msg.role === 'ai' ? '🤖 AI助手' : '👤 您'}: </strong>{msg.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="column center-col">
          <div className="card">
            <div className="card-title">手动添加收件箱</div>
            <form id="manualAddForm" onSubmit={handleManualSubmit}>
              <div className="form-row"><div className="form-group"><label htmlFor="taskTitle">标题</label><input type="text" id="taskTitle" name="taskTitle" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div></div>
              <div className="form-row"><div className="form-group"><label htmlFor="taskDesc">描述</label><textarea id="taskDesc" name="taskDesc" className="notes" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}></textarea></div></div>
              <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}><label htmlFor="gtdOption">GTD选项</label>
                  <select id="gtdOption" name="gtdOption" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <option value="1">下一步行动</option><option value="2">项目</option><option value="3">延后/将来</option><option value="4">删除/垃圾</option><option value="5">日程表</option><option value="6">等待箱</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}><label htmlFor="taskPriority">优先级</label>
                  <select id="taskPriority" name="taskPriority" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}><option value="high">高 (High)</option><option value="medium">中 (Medium)</option><option value="low">低 (Low)</option></select>
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}><label htmlFor="nextAction">下一步行动</label><input type="text" id="nextAction" name="nextAction" list="actionList" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
                <div className="form-group" style={{ flex: 1 }}><label htmlFor="projectName">项目</label><input type="text" id="projectName" name="projectName" list="projectList" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}><label htmlFor="startTime">开始时间</label><input type="datetime-local" id="startTime" name="startTime" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
                <div className="form-group" style={{ flex: 1 }}><label htmlFor="endTime">结束时间</label><input type="datetime-local" id="endTime" name="endTime" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}><label htmlFor="taskNotes">备注</label><textarea id="taskNotes" name="taskNotes" className="notes" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}></textarea></div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>保存至 GTD 系统</button>
            </form>
          </div>
        </section>

        <section className="column right-col">
          <div className="card">
            <div className="card-title">状态回顾</div>
            <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="review-item item-inbox" onClick={() => openReview('收件箱待处理', 'inbox')} style={{ padding: '10px', background: '#e8f4f8', borderRadius: '6px', cursor: 'pointer' }}><span className="review-title">收件箱待成型</span><span className="review-count" style={{ float: 'right', fontWeight: 'bold' }}>{counts.inbox}</span></div>
              <div className="review-item item-action" onClick={() => openReview('下一步行动', 'nextStep')} style={{ padding: '10px', background: '#e6f7ff', borderRadius: '6px', cursor: 'pointer' }}><span className="review-title">下一步行动</span><span className="review-count" style={{ float: 'right', fontWeight: 'bold' }}>{counts.nextStep}</span></div>
              <div className="review-item item-waiting" onClick={() => openReview('等待中', 'waiting')} style={{ padding: '10px', background: '#f0f8fb', borderRadius: '6px', cursor: 'pointer' }}><span className="review-title">等待中</span><span className="review-count" style={{ float: 'right', fontWeight: 'bold' }}>{counts.waiting}</span></div>
              <div className="review-item item-trash" onClick={() => openReview('垃圾箱/备忘', 'trash')} style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}><span className="review-title">垃圾箱/备忘</span><span className="review-count" style={{ float: 'right', fontWeight: 'bold' }}>{counts.trash}</span></div>
            </div>
            <div className="card-title" style={{ marginTop: '10px' }}>本周建议（AI智能分析）</div>
            <ul className="suggestion-list" style={{ paddingLeft: '20px' }}>
              <li>建议优先处理“官网重构”项目，距离截止日期还有3天。</li>
              <li>您的“收件箱”积压了{counts.inbox}个想法，建议本周理清。</li>
            </ul>
          </div>
        </section>
      </main>

      <GtdPanel globalTasks={globalTasks} setGlobalTasks={setGlobalTasks} globalProjects={globalProjects} setGlobalProjects={setGlobalProjects} saveToCloud={saveToCloud} /> 
      <SchedulePanel 
        globalTasks={globalTasks} 
        setGlobalTasks={setGlobalTasks} 
        globalProjects={globalProjects} 
        saveToCloud={saveToCloud}
      />

      {/* AI解析弹窗 */}
      {isAiModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content ai-modal" style={{ width: '800px', maxWidth: '90vw', background: '#fff', borderRadius: '12px', padding: '20px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h2>🤖 AI 任务解析结果确认</h2><button onClick={() => setIsAiModalOpen(false)} className="close-btn" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button></div>
            <div className="modal-body" style={{ background: '#f4f6f8', padding: '15px', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>AI 为您拆解了以下任务，请修改确认后批量导入 GTD 系统：</p>
              {aiParsedTasks.map((t) => (
                <div key={t.id} className="ai-task-row" style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', color: '#f5222d' }} onClick={() => removeAiTask(t.id)}>🗑️ 舍弃此项</span>
                  <div className="form-group" style={{ flex: '1 1 100%' }}><label>标题</label><input type="text" value={t.title} onChange={(e) => handleAiTaskChange(t.id, 'title', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
                  <div className="form-group" style={{ flex: '1 1 30%' }}><label>GTD 归类</label>
                    <select value={t.status} onChange={(e) => handleAiTaskChange(t.id, 'status', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <option value="inbox">📥 收件箱</option><option value="nextStep">🚀 下一步行动</option><option value="waiting">⏳ 等待箱</option><option value="maybe">💡 也许将来</option><option value="schedule">📅 日程表</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '1 1 30%' }}><label>优先级</label>
                    <select value={t.priority} onChange={(e) => handleAiTaskChange(t.id, 'priority', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <option value="high">高</option><option value="medium">中</option><option value="low">低</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '1 1 30%' }}><label>归属项目</label><input type="text" value={t.project} onChange={(e) => handleAiTaskChange(t.id, 'project', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}/></div>
                </div>
              ))}
            </div>
            <div className="modal-header" style={{ justifyContent: 'flex-end', background: '#fff', marginTop: '15px' }}><button className="btn-primary" onClick={handleApproveAiTasks} style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>全部确认并导入系统</button></div>
          </div>
        </div>
      )}

      {/* 状态回顾弹窗 */}
      {reviewModal.isOpen && (
        <div className="modal-overlay" onClick={closeReview} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '600px', maxWidth: '90vw' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h2>{reviewModal.title}</h2><button onClick={closeReview} className="close-btn" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button></div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {globalTasks.filter(t => t.status === reviewModal.statusKey).map(task => (
                <div key={task.id} className="modal-task-card" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}><h4 style={{ margin: '0 0 8px 0' }}>{task.title}</h4><p style={{ margin: '0 0 8px 0', color: '#666' }}>{task.desc}</p><span className="modal-tag" style={{ background: '#e6f7ff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{task.project}</span></div>
              ))}
              {globalTasks.filter(t => t.status === reviewModal.statusKey).length === 0 && (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>暂无任务</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}