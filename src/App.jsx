import React from 'react';
import './App.css'; 
import GtdPanel from './GtdPanel'; // 引入第二页的看板组件

export default function App() {
  
  // ==================== JavaScript 逻辑区域 ====================
  const handleAiSubmit = () => {
    console.log('向AI发送计划');
    alert('AI 已接收你的计划！');
  };

  const handleManualSubmit = (event) => {
    event.preventDefault(); 
    console.log('手动保存任务单');
    alert('表单已拦截并提交！');
  };

  // 点击右上角 2x2 卡片的事件
  const openReview = (type, count) => {
    console.log(`查看 ${type}，当前包含 ${count} 项代办`);
    alert(`正在打开 ${type} 面板，共 ${count} 项任务。`);
  };

  // ==================== UI 渲染区域 ====================
  return (
    <div className="app-root">
      
      {/* 标题居左 */}
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

        {/* 中间栏：手动添加收件箱 (严格的一行两个布局) */}
        <section className="column center-col">
          <div className="card">
            <div className="card-title">手动添加收件箱</div>
            
            <form id="manualAddForm" onSubmit={handleManualSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskTitle">标题</label>
                  <input type="text" id="taskTitle" placeholder="输入任务标题" />
                </div>
              </div>
            <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskDesc">描述</label>
                  {/* 这里复用了底部备注的 className="notes"，让它自动变高 */}
                  <textarea id="taskDesc" className="notes" placeholder="简要描述任务内容..."></textarea>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gtdOption">GTD选项</label>
                  <select id="gtdOption">
                    <option value="1">执行项（下一步行动）</option>
                    <option value="2">项目（多步才能完成）</option>
                    <option value="3">延后/将来可能</option>
                    <option value="4">删除/垃圾</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="taskPriority">优先级</label>
                  <select id="taskPriority">
                    <option value="high">高 (High)</option>
                    <option value="medium">中 (Medium)</option>
                    <option value="low">低 (Low)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nextAction">下一步行动</label>
                  <input type="text" id="nextAction" list="actionList" placeholder="选择或输入下一步" />
                  <datalist id="actionList">
                    <option value="打电话"></option>
                    <option value="发邮件"></option>
                  </datalist>
                </div>
                <div className="form-group">
                  <label htmlFor="projectName">项目</label>
                  <input type="text" id="projectName" list="projectList" placeholder="选择或输入归属项目" />
                  <datalist id="projectList">
                    <option value="官网重构"></option>
                    <option value="Q3营销计划"></option>
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">开始时间</label>
                  <input type="datetime-local" id="startTime" />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">结束时间</label>
                  <input type="datetime-local" id="endTime" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label htmlFor="taskNotes">备注</label>
                <textarea id="taskNotes" className="notes" placeholder="添加更多详细信息..."></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>保存至 GTD 系统</button>
            </form>
          </div>
        </section>

        {/* 右侧栏：回顾 (2x2网格) + AI建议 */}
        <section className="column right-col">
          <div className="card">
            
            <div className="card-title">状态回顾</div>
            
            {/* 2x2 网格卡片，展示数字 */}
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
            
            {/* 纯净版列表，无图案 */}
            <ul className="suggestion-list" id="aiSuggestions">
              <li>建议优先处理“官网重构”项目，距离截止日期还有3天。</li>
              <li>您的“收件箱”积压了8个想法，建议本周抽空理清分类。</li>
              <li>系统发现您在周五下午效率较高，建议将策略规划安排在此时段。</li>
            </ul>

          </div>
        </section>

      </main>

      {/* ==================== 第二屏：看板模块 ==================== */}
      <GtdPanel /> 

    </div>
  );
}