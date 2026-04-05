
import React from 'react';
import './GtdPanel.css'; 

export default function GtdPanel() {
  
  const handleProjectClick = (projectId) => {
    console.log('点击项目:', projectId);
  };

  const handleAddProject = (e) => {
    e.preventDefault(); 
    console.log('提交新项目！');
  };

  // 处理复选框点击（防止事件冒泡导致误触）
  const handleCheck = (e) => {
    e.stopPropagation();
    console.log('标记为已完成');
  };

  return (
    <div className="gtd-panel-wrapper">
      <hr className="divider" />
      
      {/* 面板主容器 */}
      <div className="panel-container">
        
        {/* ================= 左侧区域：四大竖栏看板 (占比 72%) ================= */}
        <div className="panel-left kanban-board">
          
          {/* 1. 收件箱 */}
          <div className="kanban-column">
            <h3 className="kanban-title"> 收件箱</h3>
            <div className="kanban-content">
              {/* 任务小卡片 */}
              <div className="task-card">
                <div className="task-header">
                  <input type="checkbox" onChange={handleCheck} />
                  <span className="task-title">整理会议录音</span>
                </div>
                <p className="task-desc">把上午产品讨论会的录音转成文字纪要。</p>
                <div className="task-meta">
                  <span className="task-time"> 无硬性时间</span>
                  <span className="task-project"> 尚未分类</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 下一步行动 */}
          <div className="kanban-column">
            <h3 className="kanban-title"> 下一步行动</h3>
            <div className="kanban-content">
              <div className="task-card">
                <div className="task-header">
                  <input type="checkbox" onChange={handleCheck} />
                  <span className="task-title">给王总回电话</span>
                </div>
                <p className="task-desc">确认下周三的项目验收时间，记得带上最新的数据报表。</p>
                <div className="task-meta">
                  <span className="task-time highlight"> 今天 15:00</span>
                  <span className="task-project"> 官网重构</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 等待箱 */}
          <div className="kanban-column">
            <h3 className="kanban-title"> 等待箱</h3>
            <div className="kanban-content">
              <div className="task-card">
                <div className="task-header">
                  <input type="checkbox" onChange={handleCheck} />
                  <span className="task-title">等前端确认接口</span>
                </div>
                <p className="task-desc">登录模块的 API 还需要前端同事联调测试。</p>
                <div className="task-meta">
                  <span className="task-time">无硬性时间</span>
                  <span className="task-project">Q3营销计划</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 也许将来 */}
          <div className="kanban-column">
            <h3 className="kanban-title">也许将来</h3>
            <div className="kanban-content">
              <div className="task-card">
                <div className="task-header">
                  <input type="checkbox" onChange={handleCheck} />
                  <span className="task-title">学习 Python 数据分析</span>
                </div>
                <p className="task-desc">找时间系统学习一下 Pandas，对以后看报表有帮助。</p>
                <div className="task-meta">
                  <span className="task-time"> 无硬性时间</span>
                  <span className="task-project">个人成长</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= 右侧区域：项目与表单 (占比 28%) ================= */}
        <div className="panel-right">
          
          {/* 上半部分：项目卡片区 */}
          <div className="panel-card project-area">
            <h3 className="panel-title">进行中的项目</h3>
            <div className="vertical-scroll">
              <div className="project-card" onClick={() => handleProjectClick(1)}>
                <h4>官网重构 <span>(进行中)</span></h4>
                <p>进度：已完成原型设计...</p>
              </div>
              <div className="project-card" onClick={() => handleProjectClick(2)}>
                <h4>Q3营销计划 <span>(缺资源)</span></h4>
                <p>进度：等待财务预算审批...</p>
              </div>
            </div>
          </div>

          {/* 下半部分：添加新项目 (表单标签外置) */}
          <div className="panel-card add-project-area">
            <h3 className="panel-title">添加新项目</h3>
            <form className="project-form" onSubmit={handleAddProject}>
              
              <div className="form-field">
                <label>项目名称</label>
                <input type="text" placeholder="输入项目名称" required />
              </div>
              
              <div className="form-field">
                <label>项目描述</label>
                <textarea placeholder="简要描述该项目..." rows="2"></textarea>
              </div>
              
              <div className="form-field">
                <label>项目目的</label>
                <textarea placeholder="想要达成什么目标？" rows="2"></textarea>
              </div>
              <div className="form-field">
                <label>总体发展阶段</label>
                <input type="text" placeholder="项目完成的多种阶段" />
              </div>
              
              <div className="form-field">
                <label>下一步行动</label>
                <input type="text" placeholder="拆解第一步该做什么" />
              </div>
              
              <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>提交新项目</button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}