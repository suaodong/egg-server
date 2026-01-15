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

    // 检查表结构
    try {
      const [ columns ] = await connection.execute('DESCRIBE sort_list');
      console.log('📊 sort_list 表结构：');
      console.table(columns);
    } catch (err) {
      console.error('❌ sort_list 表可能不存在:', err.message);
      // 尝试创建表（如果不存在）
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS sort_list (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sort_name VARCHAR(255) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      console.log('尝试创建 sort_list 表...');
      await connection.execute(createTableSQL);
      console.log('✅ sort_list 表创建成功（或已存在）');
    }

    // 查询数据
    const [ rows ] = await connection.execute('SELECT * FROM sort_list');
    console.log('📊 sort_list 表中的数据：');
    console.table(rows);

    await connection.end();
  } catch (err) {
    console.error('❌ 连接或查询失败:', err.message);
  }
}

check();
