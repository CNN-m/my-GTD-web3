import React, { useState } from 'react';
import './App.css'; 
import GtdPanel from './GtdPanel'; 
import SchedulePanel from './SchedulePanel'; 

export default function App() {
  
  // ==================== 1. 全局数据中心 (Global State) ====================
  // 把原来在 GtdPanel 里的 tasks 移到这里统管
  const [globalTasks, setGlobalTasks] = useState([
    { id: 101, title: '整理会议录音', desc: '把上午产品讨论会的录音转成文字纪要。', status: 'inbox', time: '无硬性时间', project: '尚未分类', date: '' },
    { id: 102, title: '给王总回电话', desc: '确认验收时间。', status: 'nextStep', time: '今天 15:00', project: '官网重构', date: '' }
  ]);

  // 全局添加任务的函数
  const handleAddGlobalTask = (newTask) => {
    setGlobalTasks([...globalTasks, { ...newTask, id: Date.now() }]);
  };


  // ==================== 2. 第一页本地逻辑 ====================
  const handleAiSubmit = () => {
    console.log('向AI发送计划');
    alert('AI 已接收你的计划！');
  };

  // 改造手动提交表单：收集数据并存入全局池
  const handleManualSubmit = (event) => {
    event.preventDefault(); 
    
    // 获取表单元素
    const title = event.target.taskTitle.value;
    const desc = event.target.taskDesc.value;
    const gtdOptionValue = event.target.gtdOption.value; // 获取选中的 value (1, 2, 3, 4, 5)
    const priority = event.target.taskPriority.value;
    const projectName = event.target.projectName.value;
    const startTime = event.target.startTime.value; // 用于日历

    if (!title.trim()) {
      alert("请输入任务标题");
      return;
    }

    // 映射 GTD 选项到看板的状态码 (对应 GtdPanel 里的过滤条件)
    let mappedStatus = 'inbox'; // 默认去收件箱
    if (gtdOptionValue === "1") mappedStatus = 'nextStep';
    if (gtdOptionValue === "2") mappedStatus = 'inbox'; // 项目一般需要拆解，先放收件箱
    if (gtdOptionValue === "3") mappedStatus = 'maybe';
    if (gtdOptionValue === "4") {
      alert("已移动到垃圾箱");
      event.target.reset();
      return; // 垃圾箱的任务直接不存入看板
    }
    if (gtdOptionValue === "6") mappedStatus = 'schedule';
    if (gtdOptionValue === "6") mappedStatus = 'waiting'; // 假设日程表相关需要等待确认，或者你可以新增一个 status

    // 格式化时间 (如果选了开始时间就显示开始时间，否则显示无)
    const displayTime = startTime ? startTime.replace('T', ' ') : '无硬性时间';

    // 组装新任务数据
    const newTask = {
      title: title,
      desc: desc || '无描述',
      status: mappedStatus,
      time: displayTime,
      project: projectName || '尚未分类',
      date: startTime ? startTime.split('T')[0] : '' // 提取 YYYY-MM-DD 供日历使用
    };

    // 派发到全局数据池
    handleAddGlobalTask(newTask);
    alert('成功保存至 GTD 系统！请在下方看板查看。');
    
    // 清空表单
    event.target.reset();
  };

  const openReview = (type, count) => {
    console.log(`查看 ${type}，当前包含 ${count} 项代办`);
    alert(`正在打开 ${type} 面板，共 ${count} 项任务。`);
  };

  // ==================== 3. UI 渲染区域 ====================
  return (
    <div className="app-root">
      
      <header className="page-header">
        <h1>GTD工作流</h1>
      </header>

      {/* ==================== 第一屏：三栏弹性布局 ==================== */}
      <main className="main-container">

        {/* 左侧栏：自然语言AI输入区 */}
        <section className="column left-col">
          <div className="card">
            <div className="card-title">自然语言输入</div>
            <div className="input-wrapper">
              <textarea id="aiInput" placeholder="请输入你要执行的计划，AI将帮你智能分析并录入..."></textarea>
              <button className="btn-primary submit-btn" onClick={handleAiSubmit}>AI分析</button>
            </div>
            <div className="history-area" id="chatHistory">
              <div style={{ color: '#ccc', textAlign: 'center', marginTop: '50px', fontSize: '13px' }}>暂无对话记录</div>
            </div>
          </div>
        </section>

        {/* 中间栏：手动添加收件箱 */}
        <section className="column center-col">
          <div className="card">
            <div className="card-title">手动添加收件箱</div>
            
            <form id="manualAddForm" onSubmit={handleManualSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskTitle">标题</label>
                  {/* 重要修复：增加 name 属性以备不时之需 */}
                  <input type="text" id="taskTitle" name="taskTitle" placeholder="输入任务标题" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskDesc">描述</label>
                  <textarea id="taskDesc" name="taskDesc" className="notes" placeholder="简要描述任务内容..."></textarea>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gtdOption">GTD选项</label>
                  <select id="gtdOption" name="gtdOption">
                    <option value="1">下一步行动（一步完成）</option>
                    <option value="2">项目（多步才能完成）</option>
                    <option value="3">延后/将来可能</option>
                    <option value="4">删除/垃圾</option>
                    <option value="5">日程表</option>
                    <option value="6">等待箱</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="taskPriority">优先级</label>
                  <select id="taskPriority" name="taskPriority">
                    <option value="high">高 (High)</option>
                    <option value="medium">中 (Medium)</option>
                    <option value="low">低 (Low)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nextAction">下一步行动</label>
                  <input type="text" id="nextAction" name="nextAction" list="actionList" placeholder="选择或输入下一步" />
                  <datalist id="actionList">
                    <option value="打电话"></option>
                    <option value="发邮件"></option>
                  </datalist>
                </div>
                <div className="form-group">
                  <label htmlFor="projectName">项目</label>
                  <input type="text" id="projectName" name="projectName" list="projectList" placeholder="选择或输入归属项目" />
                  <datalist id="projectList">
                    <option value="官网重构"></option>
                    <option value="Q3营销计划"></option>
                    <option value="暂无项目"></option>
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">开始时间</label>
                  <input type="datetime-local" id="startTime" name="startTime" />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">结束时间</label>
                  <input type="datetime-local" id="endTime" name="endTime" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="taskNotes">备注</label>
                <textarea id="taskNotes" name="taskNotes" className="notes" placeholder="添加更多详细信息..."></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>保存至 GTD 系统</button>
            </form>
          </div>
        </section>

        {/* 右侧栏：回顾 (2x2网格) + AI建议 */}
        <section className="column right-col">
          {/* ... 右侧回顾和建议内容保持不变 ... */}
          <div className="card">
            <div className="card-title">状态回顾</div>
            <div className="review-grid">
              <div className="review-item item-inbox" onClick={() => openReview('收件箱', 8)}>
                <span className="review-title">收件箱待成型</span>
                <span className="review-count">8</span>
              </div>
              <div className="review-item item-action" onClick={() => openReview('下一步行动', 5)}>
                <span className="review-title">下一步行动</span>
                <span className="review-count">5</span>
              </div>
              <div className="review-item item-waiting" onClick={() => openReview('等待中', 3)}>
                <span className="review-title">等待中</span>
                <span className="review-count">3</span>
              </div>
              <div className="review-item item-trash" onClick={() => openReview('垃圾箱/备忘', 12)}>
                <span className="review-title">垃圾箱/备忘</span>
                <span className="review-count">12</span>
              </div>
            </div>

            <div className="card-title" style={{ marginTop: '10px' }}>本周建议（AI智能分析）</div>
            <ul className="suggestion-list" id="aiSuggestions">
              <li>建议优先处理“官网重构”项目，距离截止日期还有3天。</li>
              <li>您的“收件箱”积压了8个想法，建议本周抽空理清分类。</li>
              <li>系统发现您在周五下午效率较高，建议将策略规划安排在此时段。</li>
            </ul>
          </div>
        </section>

      </main>

      {/* ==================== 第二屏：看板模块 ==================== */}
      {/* 4. 【关键传递】把全局数据当做礼物 (props) 送给子组件 */}
      <GtdPanel globalTasks={globalTasks} setGlobalTasks={setGlobalTasks} /> 

      {/* ==================== 第三屏：日程表面板 ==================== */}
      <SchedulePanel globalTasks={globalTasks} />

    </div> 
  );
}
