const mysql = require('mysql2/promise');

async function addCreateTime() {
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

    try {
      await connection.execute('ALTER TABLE article_list ADD COLUMN create_time DATETIME DEFAULT NULL');
      console.log('✅ 已添加 create_time 字段');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('⚠️ create_time 字段已存在');
      } else {
        console.error('❌ 添加 create_time 字段失败:', err.message);
      }
    }

    await connection.end();
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
  }
}

addCreateTime();
