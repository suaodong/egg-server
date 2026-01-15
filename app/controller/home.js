const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  async dbPing() {
    const { ctx, app } = this;
    if (!app.mysql) {
      ctx.body = {
        connected: false,
        message: 'mysql is not configured',
      };
      return;
    }

    try {
      const rows = await app.mysql.query('select 1 as result');
      const result = Array.isArray(rows) && rows.length > 0 ? rows[0].result : null;
      ctx.body = {
        connected: true,
        result,
      };
    } catch (err) {
      ctx.app.emit('error', err, ctx);
      ctx.body = {
        connected: false,
        message: 'mysql connection failed',
      };
    }
  }
}

module.exports = HomeController;
