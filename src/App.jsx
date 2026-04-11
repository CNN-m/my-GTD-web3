import React, { useState, useEffect } from 'react';
import './App.css'; 
import GtdPanel from './GtdPanel'; 
import SchedulePanel from './SchedulePanel'; 

export default function App() {
  const API_BASE_URL = "https://gtd-date-api.2180295860.workers.dev";

  // =============== 【核心修复】登录状态：从 localStorage 完整恢复 ===============
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem("userId") || null;
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || "";
  });
  const [password, setPassword] = useState("");

  const [globalTasks, setGlobalTasks] = useState([]);
  const [globalProjects, setGlobalProjects] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // =============== 【核心修复】登录状态变化时，同步到 localStorage ===============
  useEffect(() => {
    if (userId && username) {
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);
    }
  }, [userId, username]);

  // =============== 退出登录 ===============
  const handleLogout = () => {
    setUserId(null);
    setUsername("");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setGlobalTasks([]);
    setIsDataLoaded(false);
    alert("已退出登录");
  };

  // =============== 【核心修复】登录逻辑：登录成功后存储完整信息 ===============
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserId(data.user_id);
        setUsername(data.username); // 登录成功后，保存用户名到状态
        alert("登录成功！");
      } else {
        alert(data.msg);
      }
    } catch (e) {
      console.error("登录失败", e);
      alert("登录失败，请检查网络");
    }
  };

  // =============== 注册 ===============
  const handleRegister = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      alert(data.msg);
    } catch (e) {
      console.error("注册失败", e);
      alert("注册失败，请检查网络");
    }
  };

  // =============== 【核心修复】加载用户的云端任务：优化触发逻辑 ===============
  useEffect(() => {
    if (!userId) return;

    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get-tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await res.json();
        if (data.ok) {
          // 修复任务解析，确保兼容不同存储格式
          const tasks = (data.tasks || []).map(t => {
            try {
              return typeof t.content === 'string' ? JSON.parse(t.content) : t.content;
            } catch (err) {
              console.error("任务解析失败", t.content, err);
              return t.content;
            }
          });
          setGlobalTasks(tasks);
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error("获取数据失败", error);
      }
    };

    fetchTasks();
  }, [userId]); // 依赖 userId，只要 userId 变化就重新拉取

  // =============== 保存任务到云端 ===============
  const saveTaskToCloud = async (task) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE_URL}/save-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          content: JSON.stringify(task),
        }),
      });
    } catch (e) {
      console.error("保存失败", e);
    }
  };

  const handleAddGlobalTask = (newTask) => {
    const task = { ...newTask, id: Date.now() };
    setGlobalTasks(prev => [task, ...prev]);
    saveTaskToCloud(task);
  };

  const handleAddGlobalProject = (newProject) => {
    setGlobalProjects(prev => [{ ...newProject, id: Date.now() }, ...prev]);
  };

  // ==================== AI 部分不变 ====================
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
        { id: Date.now() + 1, title: 'AI提取任务 1: ' + userText.substring(0, 5), desc: userText, status: 'inbox', priority: 'high', project: '尚未分类', time: '无硬性时间', date: '', completed: false },
        { id: Date.now() + 2, title: 'AI提取任务 2: 顺便处理...', desc: '自动拆解的补充事项', status: 'nextStep', priority: 'medium', project: '尚未分类', time: '无硬性时间', date: '', completed: false }
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
    aiParsedTasks.forEach(task => saveTaskToCloud(task));
    setIsAiModalOpen(false);
    setAiParsedTasks([]);
  };

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
      handleAddGlobalProject(newProject);
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

    handleAddGlobalTask(newTask);
    event.target.reset();
  };

  const [reviewModal, setReviewModal] = useState({ isOpen: false, title: '', statusKey: '' });
  const counts = {
    inbox: globalTasks.filter(t => t.status === 'inbox' && !t.completed).length,
    nextStep: globalTasks.filter(t => t.status === 'nextStep' && !t.completed).length,
    waiting: globalTasks.filter(t => t.status === 'waiting' && !t.completed).length,
    trash: globalTasks.filter(t => t.status === 'trash').length
  };
  const openReview = (title, statusKey) => setReviewModal({ isOpen: true, title, statusKey });
  const closeReview = () => setReviewModal({ isOpen: false, title: '', statusKey: '' });

  // =============== 未登录 → 只显示登录页面 ===============
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
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
          />
        </div>

        <button 
          onClick={handleLogin}
          style={{ width: '100%', padding: '12px', fontSize: '16px', marginBottom: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          登录
        </button>

        <button 
          onClick={handleRegister}
          style={{ width: '100%', padding: '12px', fontSize: '16px', background: '#f5f5f5', border: 'none', borderRadius: '6px' }}
        >
          注册账号
        </button>
      </div>
    );
  }

  // =============== 已登录 → 显示完整 GTD 系统 ===============
  return (
    <div className="app-root">
      <header className="page-header">
        <h1>GTD工作流</h1>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>欢迎，{username} 👋</span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '14px' }}>退出登录</button>
        </div>
      </header>

      <main className="main-container">
        <section className="column left-col">
          <div className="card">
            <div className="card-title">自然语言输入</div>
            <div className="input-wrapper">
              <textarea id="aiInput" placeholder="输入一堆杂乱的计划，AI帮你拆解..."></textarea>
              <button className="btn-primary submit-btn" onClick={handleAiSubmit}>AI分析</button>
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
              <div className="form-row"><div className="form-group"><label htmlFor="taskTitle">标题</label><input type="text" id="taskTitle" name="taskTitle" required /></div></div>
              <div className="form-row"><div className="form-group"><label htmlFor="taskDesc">描述</label><textarea id="taskDesc" name="taskDesc" className="notes"></textarea></div></div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="gtdOption">GTD选项</label>
                  <select id="gtdOption" name="gtdOption">
                    <option value="1">下一步行动</option><option value="2">项目</option><option value="3">延后/将来</option><option value="4">删除/垃圾</option><option value="5">日程表</option><option value="6">等待箱</option>
                  </select>
                </div>
                <div className="form-group"><label htmlFor="taskPriority">优先级</label>
                  <select id="taskPriority" name="taskPriority"><option value="high">高 (High)</option><option value="medium">中 (Medium)</option><option value="low">低 (Low)</option></select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="nextAction">下一步行动</label><input type="text" id="nextAction" name="nextAction" list="actionList" /></div>
                <div className="form-group"><label htmlFor="projectName">项目</label><input type="text" id="projectName" name="projectName" list="projectList" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="startTime">开始时间</label><input type="datetime-local" id="startTime" name="startTime" /></div>
                <div className="form-group"><label htmlFor="endTime">结束时间</label><input type="datetime-local" id="endTime" name="endTime" /></div>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}><label htmlFor="taskNotes">备注</label><textarea id="taskNotes" name="taskNotes" className="notes"></textarea></div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>保存至 GTD 系统</button>
            </form>
          </div>
        </section>

        <section className="column right-col">
          <div className="card">
            <div className="card-title">状态回顾</div>
            <div className="review-grid">
              <div className="review-item item-inbox" onClick={() => openReview('收件箱待处理', 'inbox')}><span className="review-title">收件箱待成型</span><span className="review-count">{counts.inbox}</span></div>
              <div className="review-item item-action" onClick={() => openReview('下一步行动', 'nextStep')}><span className="review-title">下一步行动</span><span className="review-count">{counts.nextStep}</span></div>
              <div className="review-item item-waiting" onClick={() => openReview('等待中', 'waiting')}><span className="review-title">等待中</span><span className="review-count">{counts.waiting}</span></div>
              <div className="review-item item-trash" onClick={() => openReview('垃圾箱/备忘', 'trash')}><span className="review-count">{counts.trash}</span></div>
            </div>
            <div className="card-title" style={{ marginTop: '10px' }}>本周建议（AI智能分析）</div>
            <ul className="suggestion-list">
              <li>建议优先处理“官网重构”项目，距离截止日期还有3天。</li>
              <li>您的“收件箱”积压了{counts.inbox}个想法，建议本周理清。</li>
            </ul>
          </div>
        </section>
      </main>

      <GtdPanel globalTasks={globalTasks} setGlobalTasks={setGlobalTasks} globalProjects={globalProjects} setGlobalProjects={setGlobalProjects} /> 
      <SchedulePanel 
        globalTasks={globalTasks} 
        setGlobalTasks={setGlobalTasks} 
        globalProjects={globalProjects} 
      />

      {isAiModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content ai-modal" style={{ width: '800px', maxWidth: '90vw' }}>
            <div className="modal-header"><h2>🤖 AI 任务解析结果确认</h2><button onClick={() => setIsAiModalOpen(false)} className="close-btn">×</button></div>
            <div className="modal-body" style={{ background: '#f4f6f8' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>AI 为您拆解了以下任务，请修改确认后批量导入 GTD 系统：</p>
              {aiParsedTasks.map((t) => (
                <div key={t.id} className="ai-task-row" style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', color: '#f5222d' }} onClick={() => removeAiTask(t.id)}>🗑️ 舍弃此项</span>
                  <div className="form-group" style={{ flex: '1 1 100%' }}><label>标题</label><input type="text" value={t.title} onChange={(e) => handleAiTaskChange(t.id, 'title', e.target.value)} style={{ width: '100%' }} /></div>
                  <div className="form-group" style={{ flex: '1 1 30%' }}><label>GTD 归类</label>
                    <select value={t.status} onChange={(e) => handleAiTaskChange(t.id, 'status', e.target.value)} style={{ width: '100%' }}>
                      <option value="inbox">📥 收件箱</option><option value="nextStep">🚀 下一步行动</option><option value="waiting">⏳ 等待箱</option><option value="maybe">💡 也许将来</option><option value="schedule">📅 日程表</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '1 1 30%' }}><label>优先级</label>
                    <select value={t.priority} onChange={(e) => handleAiTaskChange(t.id, 'priority', e.target.value)} style={{ width: '100%' }}>
                      <option value="high">高</option><option value="medium">中</option><option value="low">低</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '1 1 30%' }}><label>归属项目</label><input type="text" value={t.project} onChange={(e) => handleAiTaskChange(t.id, 'project', e.target.value)} style={{ width: '100%' }}/></div>
                </div>
              ))}
            </div>
            <div className="modal-header" style={{ justifyContent: 'flex-end', background: '#fff' }}><button className="btn-primary" onClick={handleApproveAiTasks}>全部确认并导入系统</button></div>
          </div>
        </div>
      )}

      {reviewModal.isOpen && (
        <div className="modal-overlay" onClick={closeReview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>{reviewModal.title}</h2><button onClick={closeReview} className="close-btn">×</button></div>
            <div className="modal-body">
              {globalTasks.filter(t => t.status === reviewModal.statusKey).map(task => (
                <div key={task.id} className="modal-task-card"><h4>{task.title}</h4><p>{task.desc}</p><span className="modal-tag">{task.project}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}