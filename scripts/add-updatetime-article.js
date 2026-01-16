const mysql = require('mysql2/promise');

async function modifyTable() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '123456',
    database: process.env.MYSQL_DB || 'user',
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功！');

    // 检查 update_time 字段是否存在
    const [ columns ] = await connection.execute('SHOW COLUMNS FROM article_list LIKE "update_time"');

    if (columns.length === 0) {
      console.log('正在添加 update_time 字段...');
      try {
        await connection.execute('ALTER TABLE article_list ADD COLUMN update_time DATETIME DEFAULT NULL');
        console.log('✅ update_time 字段添加成功');
      } catch (err) {
        console.error('❌ 添加 update_time 字段失败:', err.message);
      }
    } else {
      console.log('⚠️ update_time 字段已存在，跳过添加');
    }

    await connection.end();
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
  }
}

modifyTable();
