const mysql = require('mysql2/promise');

async function check() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '123456',
    database: process.env.MYSQL_DB || 'user',
  };

  console.log('正在连接数据库...', config);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功！');

    // 检查 article_list 表结构
    try {
      const [ columns ] = await connection.execute('DESCRIBE article_list');
      console.log('📊 article_list 表结构：');
      console.table(columns);
    } catch (err) {
      console.error('❌ article_list 表不存在:', err.message);
    }

    // 检查 article_label 表结构
    try {
      const [ columns ] = await connection.execute('DESCRIBE article_label');
      console.log('📊 article_label 表结构：');
      console.table(columns);
    } catch (err) {
      console.error('❌ article_label 表不存在:', err.message);
    }

    await connection.end();
  } catch (err) {
    console.error('❌ 连接或查询失败:', err.message);
  }
}

check();
