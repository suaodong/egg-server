const mysql = require('mysql2/promise');

async function check() {
  const host = process.env.MYSQL_HOST;
  if (!host) {
    console.error('❌ 错误: 未设置 MYSQL_HOST 环境变量。请先运行 .\\mysql-env.ps1');
    process.exit(1);
  }

  const config = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'test',
  };

  console.log('正在连接数据库...', config);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功！');

    const [ rows ] = await connection.execute('SELECT * FROM app_user LIMIT 10');
    console.log('📊 app_user 表中的前 10 条数据：');
    console.table(rows);

    await connection.end();
  } catch (err) {
    console.error('❌ 连接或查询失败:', err.message);
  }
}

check();
