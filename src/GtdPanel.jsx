import React, { useState } from 'react';
import './GtdPanel.css';

// 【修复关键点 1】：这里必须加上 { globalTasks }，张开嘴巴接收 App.jsx 传来的数据
export default function GtdPanel({ globalTasks, setGlobalTasks }) {
  
  // 1. 项目数据池 (项目依然由 GtdPanel 自己管)
  const [projects, setProjects] = useState([
    { id: 1, name: '官网重构', status: '进行中', desc: '进度：已完成原型设计...' },
    { id: 2, name: 'Q3营销计划', status: '缺资源', desc: '进度：等待财务预算审批...' }
  ]);

  const [showCompletedProjects, setShowCompletedProjects] = useState(false);

  // 【修复关键点 2】：这里已经彻底删除了旧的 const [tasks, setTasks] = useState(...)

  const handleProjectClick = (id) => {
    console.log("查看项目详情:", id);
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('pName');
    const desc = formData.get('pDesc');
    const stage = formData.get('pStage');

    if (!name || !name.trim()) {
      alert("请输入项目名称");
      return;
    }

    const newProject = {
      id: Date.now(),
      name: name,
      status: '新计划',
      desc: stage ? `阶段：${stage} | ${desc}` : desc
    };

    setProjects([...projects, newProject]);
    e.currentTarget.reset(); 
    setShowCompletedProjects(false); 
  };

  const handleCompleteProject = (e, id) => {
    e.stopPropagation(); 
    setProjects(projects.map(p => 
      p.id === id ? { ...p, status: '已完成' } : p
    ));
  };

  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleCheck = (id) => {
    console.log('任务完成:', id);
    // 可选：如果要实现打勾后删除任务，可以在这里调用 setGlobalTasks
  };

  const displayedProjects = projects.filter(p => 
    showCompletedProjects ? p.status === '已完成' : p.status !== '已完成'
  );

  // 防御性编程：如果 globalTasks 还没传过来，为了防止白屏，默认给个空数组
  const safeTasks = globalTasks || [];

  return (
    <div className="gtd-panel-wrapper">
      <hr className="divider" />
      
      <div className="panel-container">
        {/* ================= 左侧区域：四大看板 ================= */}
        <div className="panel-left kanban-board">
          
          {/* 1. 收件箱 */}
          <div className="kanban-column">
            <h3 className="kanban-title">📥 收件箱</h3>
            <div className="kanban-content">
              {/* 【修复关键点 3】：把所有的 tasks.filter 换成了 safeTasks.filter */}
              {safeTasks.filter(t => t.status === 'inbox').map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <input type="checkbox" onChange={() => handleCheck(task.id)} />
                    <span className="task-title">{task.title}</span>
                  </div>
                  <p className="task-desc">{task.desc}</p>
                  <div className="task-meta">
                    <span>{task.time}</span>
                    <span className="task-project">{task.project}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 下一步行动 */}
          <div className="kanban-column">
            <h3 className="kanban-title">🚀 下一步行动</h3>
            <div className="kanban-content">
              {safeTasks.filter(t => t.status === 'nextStep').map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <input type="checkbox" onChange={() => handleCheck(task.id)} />
                    <span className="task-title">{task.title}</span>
                  </div>
                  <p className="task-desc">{task.desc}</p>
                  <div className="task-meta">
                    <span className="highlight">{task.time}</span>
                    <span className="task-project">{task.project}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 等待箱 */}
          <div className="kanban-column">
            <h3 className="kanban-title">⏳ 等待箱</h3>
            <div className="kanban-content">
              {safeTasks.filter(t => t.status === 'waiting').map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <input type="checkbox" onChange={() => handleCheck(task.id)} />
                    <span className="task-title">{task.title}</span>
                  </div>
                  <p className="task-desc">{task.desc}</p>
                  <div className="task-meta">
                    <span>{task.time}</span>
                    <span className="task-project">{task.project}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 也许将来 */}
          <div className="kanban-column">
            <h3 className="kanban-title">💡 也许将来</h3>
            <div className="kanban-content">
              {safeTasks.filter(t => t.status === 'maybe').map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <input type="checkbox" onChange={() => handleCheck(task.id)} />
                    <span className="task-title">{task.title}</span>
                  </div>
                  <p className="task-desc">{task.desc}</p>
                  <div className="task-meta">
                    <span>{task.time}</span>
                    <span className="task-project">{task.project}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= 右侧区域：项目与表单 ================= */}
        <div className="panel-right">
          
          <div className="panel-card project-area">
            <h3 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{showCompletedProjects ? '已归档项目' : '进行中的项目'}</span>
              <span 
                className="header-toggle-link"
                onClick={() => setShowCompletedProjects(!showCompletedProjects)}
              >
                {showCompletedProjects ? '返回进行中' : '查看已完成'}
              </span>
            </h3>
            
            <div className="vertical-scroll">
              {displayedProjects.length > 0 ? (
                displayedProjects.map((proj) => (
                  <div key={proj.id} className={`project-card ${proj.status === '已完成' ? 'proj-completed' : ''}`} onClick={() => handleProjectClick(proj.id)}>
                    <div className="proj-card-header">
                      <h4>{proj.name} <span>({proj.status})</span></h4>
                      <div className="proj-actions">
                        {proj.status !== '已完成' && (
                          <button onClick={(e) => handleCompleteProject(e, proj.id)} className="action-btn btn-finish">完成</button>
                        )}
                        <button onClick={(e) => handleDeleteProject(e, proj.id)} className="action-btn btn-delete">删除</button>
                      </div>
                    </div>
                    <p>{proj.desc}</p>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', color: '#999', marginTop: '20px', fontSize: '13px'}}>
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <div className="panel-card add-project-area">
            <h3 className="panel-title">添加新项目</h3>
            <form className="project-form" onSubmit={handleAddProject}>
              <div className="form-field">
                <label>项目名称</label>
                <input name="pName" type="text" placeholder="输入项目名称" required />
              </div>
              <div className="form-field">
                <label>项目描述</label>
                <textarea name="pDesc" placeholder="简要描述该项目..." rows="2"></textarea>
              </div>
              <div className="form-field">
                <label>项目目的</label>
                <textarea name="pPurpose" placeholder="想要达成什么目标？" rows="2"></textarea>
              </div>
              <div className="form-field">
                <label>总体发展阶段</label>
                <input name="pStage" type="text" placeholder="项目完成的多种阶段" />
              </div>
              <div className="form-field">
                <label>下一步行动</label>
                <input name="pNextAction" type="text" placeholder="拆解第一步该做什么" />
              </div>
              <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>提交新项目</button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}