import React, { useState } from 'react';
import './GtdPanel.css';

// 接收 globalTasks 和 globalProjects
export default function GtdPanel({ globalTasks, setGlobalTasks, globalProjects, setGlobalProjects }) {
  
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);

  // 1. 操作任务状态
  const handleToggleTask = (id) => {
    setGlobalTasks(globalTasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };
  const handleDeleteTask = (id) => {
    setGlobalTasks(globalTasks.map(task => task.id === id ? { ...task, status: 'trash' } : task));
  };

  // 2. 项目操作
  const handleProjectClick = (id) => {
    console.log("查看项目详情:", id);
    // 这里未来用来触发阶段三的项目画中画弹窗
  };

  // 恢复的“在此处直接添加项目”逻辑
  const handleAddProject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('pName');
    const desc = formData.get('pDesc');
    const stage = formData.get('pStage');

    if (!name || !name.trim()) { alert("请输入项目名称"); return; }

    const newProject = {
      id: Date.now(),
      name: name,
      status: '新计划',
      desc: stage ? `阶段：${stage} | ${desc}` : desc
    };

    setGlobalProjects([{ ...newProject }, ...globalProjects]); // 加到全局池
    e.currentTarget.reset(); 
    setShowCompletedProjects(false); 
  };

  const handleCompleteProject = (e, id) => {
    e.stopPropagation(); 
    setGlobalProjects(globalProjects.map(p => p.id === id ? { ...p, status: '已完成' } : p));
  };

  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    setGlobalProjects(globalProjects.filter(p => p.id !== id));
  };


  // 3. 自动排序
  const sortTasks = (tasksList) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return tasksList.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pA = priorityWeight[a.priority] || 0;
      const pB = priorityWeight[b.priority] || 0;
      return pB - pA;
    });
  };

  // 4. 拖拽逻辑
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('draggedTaskId', taskId);
  };
  const handleDragOver = (e) => {
    e.preventDefault(); 
  };
  const handleDrop = (e, targetStatus) => {
    const taskId = parseInt(e.dataTransfer.getData('draggedTaskId'), 10);
    setGlobalTasks(globalTasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
  };

  // 渲染任务卡片
  const renderTaskCard = (task) => (
    <div 
      key={task.id} 
      className={`task-card ${task.completed ? 'task-completed' : ''}`}
      draggable 
      onDragStart={(e) => handleDragStart(e, task.id)}
      style={{ cursor: 'grab', borderLeft: task.priority === 'high' ? '4px solid #f5222d' : task.priority === 'medium' ? '4px solid #faad14' : 'none' }}
    >
      <div className="task-header">
        <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} />
        <span className="task-title">{task.title}</span>
        {task.completed && <button onClick={() => handleDeleteTask(task.id)} className="task-delete-btn">删除</button>}
      </div>
      <p className="task-desc">{task.desc}</p>
      <div className="task-meta">
        <span style={{ fontWeight: task.priority === 'high' ? 'bold' : 'normal', color: task.priority === 'high' ? '#f5222d' : '#999' }}>
          [{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}] {task.time}
        </span>
        <span className="task-project">{task.project}</span>
      </div>
    </div>
  );

  const safeTasks = globalTasks || [];
  const safeProjects = globalProjects || [];

  return (
    <div className="gtd-panel-wrapper">
      <hr className="divider" />
      <div className="panel-container">
        
        {/* 左侧看板 */}
        <div className="panel-left kanban-board">
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'inbox')}>
            <h3 className="kanban-title">收件箱</h3>
            <div className="kanban-content">
              {sortTasks(safeTasks.filter(t => t.status === 'inbox')).map(renderTaskCard)}
            </div>
          </div>
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'nextStep')}>
            <h3 className="kanban-title">下一步行动</h3>
            <div className="kanban-content">
              {sortTasks(safeTasks.filter(t => t.status === 'nextStep')).map(renderTaskCard)}
            </div>
          </div>
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'waiting')}>
            <h3 className="kanban-title"> 等待箱</h3>
            <div className="kanban-content">
              {sortTasks(safeTasks.filter(t => t.status === 'waiting')).map(renderTaskCard)}
            </div>
          </div>
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'maybe')}>
            <h3 className="kanban-title"> 也许将来</h3>
            <div className="kanban-content">
              {sortTasks(safeTasks.filter(t => t.status === 'maybe')).map(renderTaskCard)}
            </div>
          </div>
        </div>

        {/* 右侧项目区域 */}
        <div className="panel-right">
           <div className="panel-card project-area">
            <h3 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{showCompletedProjects ? '已归档项目' : '进行中的项目'}</span>
              <span className="header-toggle-link" onClick={() => setShowCompletedProjects(!showCompletedProjects)}>
                {showCompletedProjects ? '返回进行中' : '查看已完成'}
              </span>
            </h3>
            <div className="vertical-scroll">
              {safeProjects.filter(p => showCompletedProjects ? p.status === '已完成' : p.status !== '已完成').map((proj) => (
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
              ))}
            </div>
          </div>
          
          {/* 【修复】加回了添加新项目的表单！ */}
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