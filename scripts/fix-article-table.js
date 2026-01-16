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

    // 修改 content 字段类型为 TEXT
    try {
      await connection.execute('ALTER TABLE article_list MODIFY COLUMN content LONGTEXT');
      console.log('✅ 已将 content 字段修改为 LONGTEXT 类型');
    } catch (err) {
      console.error('❌ 修改 content 字段失败:', err.message);
    }

    // 修改 description 字段类型为 LONGTEXT，避免过长时报错
    try {
      await connection.execute('ALTER TABLE article_list MODIFY COLUMN description LONGTEXT');
      console.log('✅ 已将 description 字段修改为 LONGTEXT 类型');
    } catch (err) {
      console.error('❌ 修改 description 字段失败:', err.message);
    }

    await connection.end();
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
  }
}

modifyTable();
