import React, { useState } from 'react';
import './GtdPanel.css';

export default function GtdPanel({ globalTasks, setGlobalTasks, globalProjects, setGlobalProjects, saveToCloud }) {
  
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // ====================== 修复 1：勾选任务，只更新，不新增 ======================
  const handleToggleTask = (id) => {
    const updatedTask = globalTasks.find(t => t.id === id);
    if (!updatedTask) return;

    const newTasks = globalTasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setGlobalTasks(newTasks);
    saveToCloud('task', { ...updatedTask, completed: !updatedTask.completed });
  };

  const handleDeleteTask = (id) => {
    const updatedTask = globalTasks.find(t => t.id === id);
    if (!updatedTask) return;

    const newTasks = globalTasks.map(t => 
      t.id === id ? { ...t, status: 'trash' } : t
    );
    setGlobalTasks(newTasks);
    saveToCloud('task', { ...updatedTask, status: 'trash' });
  };

  const handleProjectClick = (id) => {
    setSelectedProject(globalProjects.find(p => p.id === id));
  };

  const closeProjectModal = () => setSelectedProject(null);

  const updateProjectContext = (updatedProject) => {
    setGlobalProjects(globalProjects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    ));
    setSelectedProject(updatedProject);
    saveToCloud('project', updatedProject);
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('pName');
    const desc = formData.get('pDesc');
    const purpose = formData.get('pPurpose');
    const stageStr = formData.get('pStage') || '初始阶段';
    
    if (!name || !name.trim()) return;

    const parsedStages = stageStr.split('-').filter(s => s.trim() !== '').map((s, index) => ({ 
      id: Date.now() + index, 
      name: s.trim(), 
      subtasks: [] 
    }));

    const newProject = {
      id: Date.now(),
      name,
      status: '新计划',
      desc: desc || '暂无描述',
      purpose: purpose || '',
      stages: parsedStages.length > 0 
        ? parsedStages 
        : [{ id: Date.now(), name: '初始阶段', subtasks: [] }],
      logs: []
    };

    setGlobalProjects([newProject, ...globalProjects]);
    saveToCloud('project', newProject);
    e.currentTarget.reset();
    setShowCompletedProjects(false);
  };

  const handleCompleteProject = (e, id) => {
    e.stopPropagation();
    const updatedProject = globalProjects.find(p => p.id === id);
    if (!updatedProject) return;

    setGlobalProjects(globalProjects.map(p => 
      p.id === id ? { ...p, status: '已完成' } : p
    ));
    saveToCloud('project', { ...updatedProject, status: '已完成' });
  };

  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    setGlobalProjects(globalProjects.filter(p => p.id !== id));
  };

  const editTextField = (field, oldValue) => {
    const newValue = prompt(`修改内容：`, oldValue);
    if (newValue && newValue.trim() !== '') {
      updateProjectContext({ ...selectedProject, [field]: newValue });
    }
  };

  const editStageName = (stageId, oldName) => {
    const newName = prompt("修改阶段名称：", oldName);
    if (newName) {
      updateProjectContext({
        ...selectedProject,
        stages: selectedProject.stages.map(s =>
          s.id === stageId ? { ...s, name: newName } : s
        )
      });
    }
  };

  const addStage = () => {
    const name = prompt("输入新阶段名称：");
    if (name) {
      updateProjectContext({
        ...selectedProject,
        stages: [...selectedProject.stages, { id: Date.now(), name, subtasks: [] }]
      });
    }
  };

  const toggleSubtask = (stageId, subtaskId) => {
    updateProjectContext({
      ...selectedProject,
      stages: selectedProject.stages.map(s =>
        s.id === stageId
          ? {
              ...s,
              subtasks: s.subtasks.map(t =>
                t.id === subtaskId ? { ...t, completed: !t.completed } : t
              )
            }
          : s
      )
    });
  };

  const editSubtaskTitle = (stageId, subtaskId, oldTitle) => {
    const newTitle = prompt("修改任务名称：", oldTitle);
    if (newTitle) {
      updateProjectContext({
        ...selectedProject,
        stages: selectedProject.stages.map(s =>
          s.id === stageId
            ? {
                ...s,
                subtasks: s.subtasks.map(t =>
                  t.id === subtaskId ? { ...t, title: newTitle } : t
                )
              }
            : s
        )
      });
    }
  };

  const addSubtask = (stageId) => {
    const title = prompt("输入新拆解任务：");
    if (title) {
      updateProjectContext({
        ...selectedProject,
        stages: selectedProject.stages.map(s =>
          s.id === stageId
            ? {
                ...s,
                subtasks: [...s.subtasks, { id: Date.now(), title, completed: false }]
              }
            : s
        )
      });
    }
  };

  const addLog = () => {
    const title = prompt("输入记录标题：");
    if (!title) return;
    const text = prompt("输入记录详情：");
    updateProjectContext({
      ...selectedProject,
      logs: [...selectedProject.logs, { id: Date.now(), title, text: text || '' }]
    });
  };

  const editLog = (logId, field, oldValue) => {
    const newValue = prompt(`修改记录：`, oldValue);
    if (newValue) {
      updateProjectContext({
        ...selectedProject,
        logs: selectedProject.logs.map(l =>
          l.id === logId ? { ...l, [field]: newValue } : l
        )
      });
    }
  };

  const sortTasks = (tasksList) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return [...tasksList].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (weights[b.priority] || 0) - (weights[a.priority] || 0);
    });
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('draggedTaskId', taskId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetStatus) => {
    const taskId = parseInt(e.dataTransfer.getData('draggedTaskId'), 10);
    const updatedTask = globalTasks.find(t => t.id === taskId);
    if (!updatedTask) return;

    const newTasks = globalTasks.map(t =>
      t.id === taskId ? { ...t, status: targetStatus } : t
    );
    setGlobalTasks(newTasks);
    saveToCloud('task', { ...updatedTask, status: targetStatus });
  };

  const renderTaskCard = (task) => (
    <div key={task.id} className={`task-card ${task.completed ? 'task-completed' : ''}`} draggable onDragStart={(e) => handleDragStart(e, task.id)} style={{ cursor: 'grab', borderLeft: task.priority === 'high' ? '4px solid #555' : task.priority === 'medium' ? '4px solid #999' : 'none' }}>
      <div className="task-header">
        <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} />
        <span className="task-title">{task.title}</span>
        {task.completed && <button onClick={() => handleDeleteTask(task.id)} className="task-delete-btn">删除</button>}
      </div>
      <p className="task-desc">{task.desc}</p>
      <div className="task-meta">
        <span style={{ fontWeight: task.priority === 'high' ? 'bold' : 'normal', color: task.priority === 'high' ? '#333' : '#999' }}>
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
        
        <div className="panel-left kanban-board">
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'inbox')}>
            <h3 className="kanban-title">📥 收件箱</h3>
            <div className="kanban-content">{sortTasks(safeTasks.filter(t => t.status === 'inbox')).map(renderTaskCard)}</div>
          </div>
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'nextStep')}>
            <h3 className="kanban-title">🚀 下一步行动</h3>
            <div className="kanban-content">{sortTasks(safeTasks.filter(t => t.status === 'nextStep')).map(renderTaskCard)}</div>
          </div>
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'waiting')}>
            <h3 className="kanban-title">⏳ 等待箱</h3>
            <div className="kanban-content">{sortTasks(safeTasks.filter(t => t.status === 'waiting')).map(renderTaskCard)}</div>
          </div>
          <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'maybe')}>
            <h3 className="kanban-title">💡 也许将来</h3>
            <div className="kanban-content">{sortTasks(safeTasks.filter(t => t.status === 'maybe')).map(renderTaskCard)}</div>
          </div>
        </div>

        <div className="panel-right">
          <div className="panel-card project-area">
            <h3 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{showCompletedProjects ? '已归档项目' : '进行中的项目'}</span>
              <span className="header-toggle-link" onClick={() => setShowCompletedProjects(!showCompletedProjects)}>
                {showCompletedProjects ? '返回进行中' : '查看已完成'}
              </span>
            </h3>
            <div className="vertical-scroll">

              {/* ====================== 修复 2：进行中项目只显示未完成、未删除 ====================== */}
              {safeProjects
                .filter(p => {
                  if (showCompletedProjects) {
                    return p.status === '已完成';
                  } else {
                    return p.status !== '已完成' && p.status !== '删除';
                  }
                })
                .map((proj) => (
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
          
          <div className="panel-card add-project-area">
            <h3 className="panel-title">添加新项目</h3>
            <form className="project-form" onSubmit={handleAddProject}>
              <div className="form-field"><label>项目名称</label><input name="pName" type="text" required /></div>
              <div className="form-field"><label>总体发展阶段 (用短横线 "-" 分隔)</label><input name="pStage" type="text" placeholder="例如：设计-开发-测试" /></div>
              <div className="form-field"><label>项目目的</label><textarea name="pPurpose" rows="2"></textarea></div>
              <div className="form-field"><label>项目描述</label><textarea name="pDesc" rows="2"></textarea></div>
              <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>提交新项目</button>
            </form>
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="modal-overlay" onClick={closeProjectModal}>
          <div className="proj-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="proj-detail-header">
              <h2><span className="editable-text" onClick={() => editTextField('name', selectedProject.name)}>{selectedProject.name}</span> <span className="status-tag">{selectedProject.status}</span></h2>
              <button className="close-btn" onClick={closeProjectModal}>×</button>
            </div>
            <div className="proj-detail-body">
              <div className="proj-purpose-area"><span className="proj-label">项目目的：</span><span className="editable-text" onClick={() => editTextField('purpose', selectedProject.purpose)}>{selectedProject.purpose || '点击添加项目目的...'}</span></div>
              <div className="proj-section">
                <h3 className="section-title">项目流程与任务拆解 <button className="add-btn-small" onClick={addStage}>+ 添加阶段</button></h3>
                <div className="proj-timeline">
                  {selectedProject.stages && selectedProject.stages.length > 0 ? selectedProject.stages.map((stage) => (
                    <div key={stage.id} className="proj-timeline-row">
                      <div className="proj-timeline-left"><div className="timeline-dot"></div><span className="editable-text stage-name" onClick={() => editStageName(stage.id, stage.name)}>{stage.name}</span></div>
                      <div className="proj-timeline-right">
                        <div className="proj-subtask-list">
                          {stage.subtasks.map(st => (
                            <div key={st.id} className={`proj-subtask-item ${st.completed ? 'completed' : ''}`}>
                              <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(stage.id, st.id)} />
                              <span className="editable-text" onClick={() => editSubtaskTitle(stage.id, st.id, st.title)}>{st.title}</span>
                            </div>
                          ))}
                          <button className="add-btn-text" onClick={() => addSubtask(stage.id)}>+ 添加行动</button>
                        </div>
                      </div>
                    </div>
                  )) : <p className="proj-empty">暂无阶段，点击上方按钮添加。</p>}
                </div>
              </div>
              <div className="proj-section" style={{ marginTop: '20px' }}>
                <h3 className="section-title">进度记录与反思 <button className="add-btn-small" onClick={addLog}>+ 添加记录</button></h3>
                <div className="proj-log-list">
                  {selectedProject.logs && selectedProject.logs.length > 0 ? selectedProject.logs.map(log => (
                    <div key={log.id} className="proj-log-item">
                      <div className="proj-log-photo">照片<br/>占位</div>
                      <div className="proj-log-content">
                        <div className="proj-log-title editable-text" onClick={() => editLog(log.id, 'title', log.title)}><strong>{selectedProject.name}：</strong>{log.title || '点击添加标题'}</div>
                        <div className="proj-log-text editable-text" onClick={() => editLog(log.id, 'text', log.text)}>{log.text || '点击添加详细的反思与记录...'}</div>
                      </div>
                    </div>
                  )) : <p className="proj-empty" style={{ margin: '10px 0' }}>暂无进度记录，点击上方按钮添加。</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}