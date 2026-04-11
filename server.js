const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const path = require('path'); // [新增] 引入 path 模块处理路径

const app = express();
app.use(cors());
app.use(express.json());

let db;

// 初始化数据库
(async () => {
    db = await open({
        // [修复] 使用 __dirname 和 path.join 生成绝对路径，解决重启后找不到文件的问题
        filename: path.join(__dirname, 'gtd_data.db'), 
        driver: sqlite3.Database
    });

    // 创建表（如果不存在）
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, data TEXT);
        CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT);
    `);
})();

// API: 获取所有数据 (保持不变)
app.get('/api/data', async (req, res) => {
    const tasks = await db.all('SELECT data FROM tasks');
    const projects = await db.all('SELECT data FROM projects');
    res.json({
        tasks: tasks.map(t => JSON.parse(t.data)),
        projects: projects.map(p => JSON.parse(p.data))
    });
});

// API: 保存数据
app.post('/api/save', async (req, res) => {
    const { tasks, projects } = req.body;
    
    try {
        // [修复] 开启事务：接下来的操作如果在 commit 前报错，都不会真正写入硬盘
        await db.exec('BEGIN TRANSACTION'); 
        
        await db.run('DELETE FROM tasks');
        for (let t of tasks) {
            await db.run('INSERT INTO tasks (id, data) VALUES (?, ?)', [t.id, JSON.stringify(t)]);
        }

        await db.run('DELETE FROM projects');
        for (let p of projects) {
            await db.run('INSERT INTO projects (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)]);
        }
        
        // [修复] 全部顺利执行完毕，提交事务，真正保存到硬盘
        await db.exec('COMMIT'); 
        res.json({ status: 'success' });
        
    } catch (error) {
        // [修复] 万一中间报错了，回滚撤销之前的 DELETE 和 INSERT 操作，保护旧数据
        await db.exec('ROLLBACK'); 
        console.error('数据保存失败:', error);
        res.status(500).json({ status: 'error', message: '数据保存失败，已回滚保护原数据' });
    }
});

// 监听 3001 端口，允许局域网访问 (保持不变)
app.listen(3001, '0.0.0.0', () => {
    console.log('后端服务器已启动: http://localhost:3001');
});