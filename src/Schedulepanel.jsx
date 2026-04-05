import React, { useState } from 'react';
import './SchedulePanel.css';

export default function SchedulePanel() {
  // 默认设置为 2026年4月5日 (当前系统时间)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 5)); 
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 5));

  // 模拟从后端获取的当月任务数据
  const [tasks, setTasks] = useState([
    { id: 1, date: '2026-04-05', title: '完成官网重构视觉定稿', time: '10:00 - 12:00', desc: '核对首页及产品页的黑白灰极简设计风格是否达标。', priority: '高', completed: false },
    { id: 2, date: '2026-04-05', title: '周度团队同步会', time: '14:30 - 15:30', desc: '对齐 Q3 营销计划的初步资源缺口。', priority: '中', completed: false },
    { id: 3, date: '2026-04-06', title: '提交财务预算审批', time: '16:00 - 16:30', desc: '附带最新的 ROI 预测模型。', priority: '高', completed: false },
  ]);

  // 日历逻辑：生成 5x7 (35格) 的日期数组
  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 当月第一天是星期几
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 当月总天数
    
    // 将星期日(0)转换为7，方便以星期一为起始计算
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    
    const days = [];
    // 填充上个月的尾巴
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, fullDate: new Date(year, month - 1, prevMonthDays - i) });
    }
    // 填充当月
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, fullDate: new Date(year, month, i) });
    }
    // 填充下个月的开头，补齐 35 格 (5行 * 7列)
    let nextMonthDay = 1;
    while (days.length < 35) {
      days.push({ day: nextMonthDay++, isCurrentMonth: false, fullDate: new Date(year, month + 1, nextMonthDay - 1) });
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  // 格式化日期辅助函数 (用于匹配和显示)
  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const displayDateStr = `${selectedDate.getFullYear()}年${String(selectedDate.getMonth() + 1).padStart(2, '0')}月${String(selectedDate.getDate()).padStart(2, '0')}日`;

  // 当前选中的日期包含的任务
  const currentTasks = tasks.filter(task => task.date === formatDateStr(selectedDate));

  // 交互控制
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => {
    const today = new Date(2026, 3, 5); // 回到设定好的当前时间
    setCurrentDate(today);
    setSelectedDate(today);
  };
  const handleDateClick = (date) => setSelectedDate(date);
  
  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="schedule-panel-wrapper">
      <hr className="divider" />
      <div className="schedule-container">
        
        {/* ================= 左侧：日历模块 (65%) ================= */}
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
            {/* 星期表头 */}
            {weekDays.map(day => (
              <div key={day} className="cal-weekday">{day}</div>
            ))}
            
            {/* 35格日期 */}
            {calendarDays.map((item, index) => {
              const isSelected = formatDateStr(item.fullDate) === formatDateStr(selectedDate);
              const isToday = formatDateStr(item.fullDate) === formatDateStr(new Date(2026, 3, 5));
              
              return (
                <div 
                  key={index} 
                  className={`cal-cell ${item.isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateClick(item.fullDate)}
                >
                  <span className="cell-date">{item.day}</span>
                  {/* 可在此处扩展：如果在 tasks 中查到当日有任务，显示一个小灰点 */}
                  {tasks.some(t => t.date === formatDateStr(item.fullDate)) && <div className="task-dot"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 右侧：日程卡片模块 (35%) ================= */}
        <div className="schedule-right">
          <div className="daily-header">
            <h2 className="daily-title">{displayDateStr} <span>今日日程</span></h2>
            <button className="btn-outline">从 GTD 导入</button>
          </div>

          <div className="daily-task-list">
            {currentTasks.length > 0 ? (
              currentTasks.map(task => (
                <div key={task.id} className={`daily-task-card ${task.completed ? 'completed' : ''}`}>
                  <div className="daily-task-header">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => toggleTask(task.id)} 
                    />
                    <span className="daily-task-title">{task.title}</span>
                  </div>
                  <div className="daily-task-body">
                    <div className="daily-task-time">时间：{task.time}</div>
                    <div className="daily-task-desc">{task.desc}</div>
                    <div className="daily-task-priority">优先级：{task.priority}</div>
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