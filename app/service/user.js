const { Service } = require('egg');

class UserService extends Service {
  async findByUsername(username) {
    console.log('[Debug] findByUsername called with:', username);
    // 检查数据库配置是否生效
    const dbConfig = this.app.config.mysql;
    console.log('[Debug] DB Config:', {
      host: dbConfig?.client?.host,
      database: dbConfig?.client?.database,
      user: dbConfig?.client?.user,
    });

    if (!username) {
      console.log('[Debug] Username is empty, returning null');
      return null;
    }

    try {
      const row = await this.app.mysql.get('app_user', { username });
      console.log('[Debug] Query Result:', row);
      return row || null;
    } catch (err) {
      console.error('[Debug] Query Error:', err);
      throw err;
    }
  }
}

module.exports = UserService;

