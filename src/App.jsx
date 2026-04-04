import React from 'react';
import './App.css'; // 引入刚才的样式文件

export default function App() {
  
  // 以前放在 <script> 里的 JavaScript 逻辑，现在要写在组件内部这里
  const handleAiSubmit = () => {
    // 实际开发中可以通过 React 的 useState 来获取输入框的值
    console.log('向AI发送计划');
    alert('提交按钮被点击啦！');
  };

  const handleManualSubmit = (event) => {
    event.preventDefault(); // 阻止页面默认刷新
    console.log('手动保存任务单');
    alert('表单已拦截并提交！');
  };

  const openReview = (type) => {
    console.log('点击了回顾模块:', type);
  };

  // return 里面放的就是页面的 UI 结构 (注意 class 变成了 className)
  return (
    <>
      {/* 顶部大标题 */}
      <header className="page-header">
        <h1>GTD工作流</h1>
      </header>

      {/* 三栏弹性布局主容器 */}
      <main className="main-container">

        {/* ==================== 左侧栏：自然语言AI输入区 ==================== */}
        <section className="column left-col">
          <div className="card">
            <div className="ai-captcha-hint">AI captcha</div>
            <div className="card-title">自然语言输入</div>
            
            <div className="input-wrapper">
              <textarea id="aiInput" placeholder="请输入你要执行的计划，AI将帮你智能分析并录入..."></textarea>
              <button className="btn-primary submit-btn" onClick={handleAiSubmit}>提交</button>
            </div>
            
            <div className="history-area" id="chatHistory">
              <div style={{ color: '#ccc', textAlign: 'center', marginTop: '50px' }}>暂无对话记录</div>
            </div>
          </div>
        </section>

        {/* ==================== 中间栏：手动添加收件箱 ==================== */}
        <section className="column center-col">
          <div className="card">
            <div className="card-title">手动添加收件箱</div>
            
            <form id="manualAddForm" onSubmit={handleManualSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskTitle">标题</label>
                  <input type="text" id="taskTitle" placeholder="输入任务标题" />
                </div>
                <div className="form-group">
                  <label htmlFor="taskDesc">描述</label>
                  <input type="text" id="taskDesc" placeholder="简要描述任务内容" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gtdOption">GTD选项</label>
                  <select id="gtdOption">
                    <option value="1">1. 执行项（下一步行动）</option>
                    <option value="2">2. 项目（多步才能完成）</option>
                    <option value="3">3. 延后/将来可能</option>
                    <option value="4">4. 删除/垃圾</option>
                    <option value="5">5. 参考资料</option>
                    <option value="6">6. 日程表</option>
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
                    <option value="开会"></option>
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

        {/* ==================== 右侧栏：回顾 + AI建议 ==================== */}
        <section className="column right-col">
          <div className="card" style={{ flex: '0 0 auto' }}>
            <div className="card-title">回顾</div>
            <div className="review-grid">
              <div className="review-item" onClick={() => openReview('inbox')}>收件箱待成型</div>
              <div className="review-item" onClick={() => openReview('action')}>待行动</div>
              <div className="review-item" onClick={() => openReview('q7_answer')}>第7题的答案</div>
              <div className="review-item" onClick={() => openReview('someday')}>垃圾邮箱/将来可能做的备忘</div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-title">本周建议（AI智能建议）</div>
            <ul className="suggestion-list" id="aiSuggestions">
              <li>🎯 建议优先处理“官网重构”项目，距离截止日期还有3天。</li>
              <li>🧹 您的“收件箱待成型”积压了5个想法，建议本周抽空清空。</li>
              <li>💡 发现您在周五下午效率较高，建议将“策略规划”安排在此时段。</li>
            </ul>
          </div>
        </section>

      </main>
    </>
  );
}