import React, { useState } from 'react';
import './SchedulePanel.css';

export default function SchedulePanel({ globalTasks = [], setGlobalTasks, globalProjects = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 5)); 
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 5));

  // 控制导入弹窗的状态
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCategory, setImportCategory] = useState('inbox'); // 默认选中收件箱

  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, fullDate: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, fullDate: new Date(year, month, i) });
    }
    let nextMonthDay = 1;
    while (days.length < 35) {
      days.push({ day: nextMonthDay++, isCurrentMonth: false, fullDate: new Date(year, month + 1, nextMonthDay - 1) });
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const displayDateStr = `${selectedDate.getFullYear()}年${String(selectedDate.getMonth() + 1).padStart(2, '0')}月${String(selectedDate.getDate()).padStart(2, '0')}日`;

  const currentTasks = globalTasks.filter(task => 
    task.status === 'schedule' && task.date === formatDateStr(selectedDate)
  );

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => {
    const today = new Date(2026, 3, 5); 
    setCurrentDate(today);
    setSelectedDate(today);
  };
  const handleDateClick = (date) => setSelectedDate(date);

  // ==================== 核心导入逻辑 ====================
  // 1. 导入普通看板任务
  const handleImportTask = (task) => {
    setGlobalTasks(globalTasks.map(t => 
      t.id === task.id ? { ...t, status: 'schedule', date: formatDateStr(selectedDate) } : t
    ));
  };

  // 2. 导入项目中的拆解子任务
  const handleImportProjectSubtask = (proj, subtask) => {
    const newTask = {
      id: Date.now(),
      title: `${proj.name}：${subtask.title}`, 
      desc: '从项目拆解导入',
      status: 'schedule',
      priority: 'medium',
      time: '全天', 
      project: proj.name,
      date: formatDateStr(selectedDate),
      completed: subtask.completed
    };
    setGlobalTasks([newTask, ...globalTasks]); 
  };

  return (
    <div className="schedule-panel-wrapper">
      <hr className="divider" />
      <div className="schedule-container">
        
        {/* 左侧：日历模块 */}
        <div className="schedule-left">
          <div className="cal-header">
            <h2 className="cal-title">日程表</h2>
            <div className="cal-controls">
              <span className="cal-month-display">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</span>
              <button className="cal-btn" onClick={handlePrevMonth}>上个月</button>
              <button className="cal-btn" onClick={handleToday}>本月</button>
              <button className="cal-btn" onClick={handleNextMonth}>下个月</button>
            </div>
          </div>

          <div className="cal-grid">
            {weekDays.map(day => <div key={day} className="cal-weekday">{day}</div>)}
            {calendarDays.map((item, index) => {
              const isSelected = formatDateStr(item.fullDate) === formatDateStr(selectedDate);
              const isToday = formatDateStr(item.fullDate) === formatDateStr(new Date(2026, 3, 5));
              // 统计该日期有几个日程任务
              const dayTasksCount = globalTasks.filter(t => t.status === 'schedule' && t.date === formatDateStr(item.fullDate)).length;
              
              return (
                <div 
                  key={index} 
                  className={`cal-cell ${item.isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateClick(item.fullDate)}
                >
                  <span className="cell-date">{item.day}</span>
                  {dayTasksCount > 0 && (
                    <div className="task-dot-indicator">
                      <div className="task-dot"></div>
                      <span className="task-dot-count">{dayTasksCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：日程卡片模块 */}
        <div className="schedule-right">
          <div className="daily-header">
            <h2 className="daily-title">{displayDateStr} <span>今日日程</span></h2>
            <button className="btn-outline" onClick={() => setIsImportModalOpen(true)}>从 GTD 导入</button>
          </div>

          <div className="daily-task-list">
            {currentTasks.length > 0 ? (
              currentTasks.map(task => (
                <div key={task.id} className={`daily-task-card ${task.completed ? 'completed' : ''}`}>
                  <div className="daily-task-header">
                    <input type="checkbox" checked={task.completed} onChange={() => {
                      setGlobalTasks(globalTasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t));
                    }}/>
                    <span className="daily-task-title">{task.title}</span>
                  </div>
                  <div className="daily-task-body">
                    <div className="daily-task-time">时间：{task.time.includes(' ') ? task.time.split(' ')[1] : task.time}</div>
                    <div className="daily-task-desc">{task.desc}</div>
                    <div className="daily-task-priority">项目：{task.project}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">当日暂无日程安排</div>
            )}
          </div>
        </div>

      </div>

      {/* ==================== 高级导入弹窗 (拥有左导航右列表的结构) ==================== */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="import-modal-content" onClick={e => e.stopPropagation()}>
            
            <div className="import-modal-header">
              <h2>导入任务至 <span>{displayDateStr}</span></h2>
              <button className="close-btn" onClick={() => setIsImportModalOpen(false)}>×</button>
            </div>

            <div className="import-modal-body">
              {/* 左侧：竖向分类导航 */}
              <div className="import-sidebar">
                <button className={`import-tab ${importCategory === 'inbox' ? 'active' : ''}`} onClick={() => setImportCategory('inbox')}>📥 收件箱</button>
                <button className={`import-tab ${importCategory === 'nextStep' ? 'active' : ''}`} onClick={() => setImportCategory('nextStep')}>🚀 下一步行动</button>
                <button className={`import-tab ${importCategory === 'waiting' ? 'active' : ''}`} onClick={() => setImportCategory('waiting')}>⏳ 等待项</button>
                <button className={`import-tab ${importCategory === 'maybe' ? 'active' : ''}`} onClick={() => setImportCategory('maybe')}>💡 也许将来</button>
                <button className={`import-tab ${importCategory === 'projects' ? 'active' : ''}`} onClick={() => setImportCategory('projects')}>📂 进行中项目</button>
              </div>

              {/* 右侧：可选任务列表 */}
              <div className="import-content">
                {importCategory !== 'projects' ? (
                  /* 渲染普通看板任务 */
                  globalTasks.filter(t => t.status === importCategory && !t.completed).length > 0 ? (
                    globalTasks.filter(t => t.status === importCategory && !t.completed).map(t => (
                      <div key={t.id} className="import-task-item">
                        <span className="import-task-title">{t.title}</span>
                        <button className="import-btn" onClick={() => handleImportTask(t)}>导入</button>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">该分类下暂无待办任务</p>
                  )
                ) : (
                  /* 渲染项目及子任务 */
                  globalProjects.filter(p => p.status !== '已完成').length > 0 ? (
                    globalProjects.filter(p => p.status !== '已完成').map(p => (
                      <div key={p.id} className="import-project-group">
                        <h4 className="import-project-name">{p.name}</h4>
                        {p.stages && p.stages.map(s => (
                          s.subtasks && s.subtasks.filter(st => !st.completed).map(st => (
                            <div key={st.id} className="import-task-item">
                              <span className="import-task-title">{st.title}</span>
                              <button className="import-btn" onClick={() => handleImportProjectSubtask(p, st)}>导入</button>
                            </div>
                          ))
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">暂无进行中的项目</p>
                  )
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}