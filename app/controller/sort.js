const { Controller } = require('egg');

class SortController extends Controller {
  async add() {
    const { ctx, app } = this;
    const { sort_name } = ctx.request.body || {};
    if (!sort_name || !sort_name.trim()) {
      ctx.body = {
        code: 201,
        message: '分类名称不能为空',
        data: null,
      };
      return;
    }
    if (!app.mysql) {
      const err = new Error('数据库未配置');
      err.status = 500;
      err.code = 10002;
      throw err;
    }
    const name = sort_name.trim();
    const exists = await app.mysql.get('sort_list', { sort_name: name });
    if (exists) {
      ctx.body = {
        code: 201,
        message: '分类已存在',
        data: null,
      };
      return;
    }
    const result = await app.mysql.insert('sort_list', {
      sort_name: name,
      create_time: app.mysql.literals.now,
    });
    if (!result || !result.insertId) {
      const err = new Error('分类新增失败');
      err.status = 500;
      err.code = 10003;
      throw err;
    }
    ctx.body = {
      id: result.insertId,
      sort_name: name,
    };
  }

  async update() {
    const { ctx, app } = this;
    const { id, sort_name } = ctx.request.body || {};
    const sortId = Number(id);
    if (!sortId || !Number.isInteger(sortId)) {
      ctx.body = {
        code: 201,
        message: '分类ID不合法',
        data: null,
      };
      return;
    }
    if (!sort_name || !sort_name.trim()) {
      ctx.body = {
        code: 201,
        message: '分类名称不能为空',
        data: null,
      };
      return;
    }
    if (!app.mysql) {
      const err = new Error('数据库未配置');
      err.status = 500;
      err.code = 10002;
      throw err;
    }
    const name = sort_name.trim();
    const current = await app.mysql.get('sort_list', { id: sortId });
    if (!current) {
      ctx.body = {
        code: 201,
        message: '分类不存在',
        data: null,
      };
      return;
    }
    const duplicates = await app.mysql.query('select id from sort_list where sort_name = ? and id <> ?', [ name, sortId ]);
    if (Array.isArray(duplicates) && duplicates.length > 0) {
      ctx.body = {
        code: 201,
        message: '分类名称已存在',
        data: null,
      };
      return;
    }
    const result = await app.mysql.update('sort_list', { id: sortId, sort_name: name });
    if (!result || result.affectedRows !== 1) {
      const err = new Error('分类编辑失败');
      err.status = 500;
      err.code = 10003;
      throw err;
    }
    ctx.body = {
      id: sortId,
      sort_name: name,
    };
  }

  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body || {};
    const sortId = Number(id);
    if (!sortId || !Number.isInteger(sortId)) {
      ctx.body = {
        code: 201,
        message: '分类ID不合法',
        data: null,
      };
      return;
    }
    if (!app.mysql) {
      const err = new Error('数据库未配置');
      err.status = 500;
      err.code = 10002;
      throw err;
    }
    const result = await app.mysql.delete('sort_list', { id: sortId });
    if (!result || result.affectedRows !== 1) {
      ctx.body = {
        code: 201,
        message: '分类不存在或删除失败',
        data: null,
      };
      return;
    }
    ctx.body = true;
  }

  async list() {
    const { ctx, app } = this;

    if (!app.mysql) {
      const err = new Error('数据库未配置');
      err.status = 500;
      err.code = 10002;
      throw err;
    }

    const sortList = await app.mysql.select('sort_list');
    ctx.body = sortList;
  }
}

module.exports = SortController;

