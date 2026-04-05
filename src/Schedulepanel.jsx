import React, { useState } from 'react';
import './SchedulePanel.css';

// 【修改 1】：张开嘴巴，接收 App.jsx 传过来的 globalTasks
export default function SchedulePanel({ globalTasks = [] }) {
  // 保持当前日期为你的设定时间 2026年4月5日
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 5)); 
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 5));

  // 【修改 2】：已经删除了这里原本写死的 const [tasks, setTasks] = useState(...)

  // 日历逻辑：生成 5x7 (35格) 的日期数组
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

  // 格式化日期辅助函数 (例如输出 2026-04-05)
  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const displayDateStr = `${selectedDate.getFullYear()}年${String(selectedDate.getMonth() + 1).padStart(2, '0')}月${String(selectedDate.getDate()).padStart(2, '0')}日`;

  // 【修改 3】：【核心联动】从 globalTasks 里面筛选出状态为 schedule，且日期等于当前选中日期的任务！
  const currentTasks = globalTasks.filter(task => 
    task.status === 'schedule' && task.date === formatDateStr(selectedDate)
  );

  // 交互控制
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => {
    const today = new Date(2026, 3, 5); 
    setCurrentDate(today);
    setSelectedDate(today);
  };
  const handleDateClick = (date) => setSelectedDate(date);

  return (
    <div className="schedule-panel-wrapper">
      <hr className="divider" />
      <div className="schedule-container">
        
        {/* ================= 左侧：日历模块 ================= */}
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
            {weekDays.map(day => (
              <div key={day} className="cal-weekday">{day}</div>
            ))}
            
            {calendarDays.map((item, index) => {
              const isSelected = formatDateStr(item.fullDate) === formatDateStr(selectedDate);
              const isToday = formatDateStr(item.fullDate) === formatDateStr(new Date(2026, 3, 5));
              
              // 【修改 4】：判断全局任务中，有没有某一项任务的日期刚好等于这个格子的日期
              const hasTask = globalTasks.some(t => t.status === 'schedule' && t.date === formatDateStr(item.fullDate));
              
              return (
                <div 
                  key={index} 
                  className={`cal-cell ${item.isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateClick(item.fullDate)}
                >
                  <span className="cell-date">{item.day}</span>
                  {/* 如果这一天有任务，显示一个小灰点 */}
                  {hasTask && <div className="task-dot"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 右侧：日程卡片模块 ================= */}
        <div className="schedule-right">
          <div className="daily-header">
            <h2 className="daily-title">{displayDateStr} <span>今日日程</span></h2>
            <button className="btn-outline">从 GTD 导入</button>
          </div>

          <div className="daily-task-list">
            {/* 动态渲染该日期的日程任务 */}
            {currentTasks.length > 0 ? (
              currentTasks.map(task => (
                <div key={task.id} className="daily-task-card">
                  <div className="daily-task-header">
                    <input type="checkbox" />
                    <span className="daily-task-title">{task.title}</span>
                  </div>
                  <div className="daily-task-body">
                    {/* 显示具体的时间点，比如 14:00 */}
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
    </div>
  );
}