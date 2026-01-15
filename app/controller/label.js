const { Controller } = require('egg');

class LabelController extends Controller {
  async list() {
    const { ctx, app } = this;

    if (!app.mysql) {
      const err = new Error('数据库未配置');
      err.status = 500;
      err.code = 10002;
      throw err;
    }

    const sortList = await app.mysql.select('label_list');
    ctx.body = sortList;
  }
  async add() {
    const { ctx, app } = this;
    const { label_name, color } = ctx.request.body || {};
    if (!label_name || !label_name.trim()) {
      ctx.body = {
        code: 201,
        message: '标签名称不能为空',
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
    const name = label_name.trim();
    const exists = await app.mysql.get('label_list', { label_name: name, color });
    if (exists) {
      ctx.body = {
        code: 201,
        message: '标签已存在',
        data: null,
      };
      return;
    }
    const result = await app.mysql.insert('label_list', {
      label_name: name,
      color,
    });
    if (!result || !result.insertId) {
      const err = new Error('标签新增失败');
      err.status = 500;
      err.code = 10003;
      throw err;
    }
    ctx.body = {
      id: result.insertId,
      label_name: name,
      color,
    };
  }

  async update() {
    const { ctx, app } = this;
    const { id, label_name, color } = ctx.request.body || {};
    const sortId = Number(id);
    if (!sortId || !Number.isInteger(sortId)) {
      ctx.body = {
        code: 201,
        message: '标签ID不合法',
        data: null,
      };
      return;
    }
    if (!label_name || !label_name.trim()) {
      ctx.body = {
        code: 201,
        message: '标签名称不能为空',
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
    const name = label_name.trim();
    const current = await app.mysql.get('label_list', { id: sortId });
    if (!current) {
      ctx.body = {
        code: 201,
        message: '标签不存在',
        data: null,
      };
      return;
    }
    const duplicates = await app.mysql.query(
      'select id from label_list where label_name = ? and color = ? and id <> ?',
      [ name, color, sortId ]
    );
    if (Array.isArray(duplicates) && duplicates.length > 0) {
      ctx.body = {
        code: 201,
        message: '标签名称已存在',
        data: null,
      };
      return;
    }
    const result = await app.mysql.update('label_list', { id: sortId, label_name: name, color });
    if (!result || result.affectedRows !== 1) {
      const err = new Error('标签编辑失败');
      err.status = 500;
      err.code = 10003;
      throw err;
    }
    ctx.body = {
      id: sortId,
      label_name: name,
      color,
    };
  }

  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body || {};
    const sortId = Number(id);
    if (!sortId || !Number.isInteger(sortId)) {
      ctx.body = {
        code: 201,
        message: '标签ID不合法',
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
    const result = await app.mysql.delete('label_list', { id: sortId });
    if (!result || result.affectedRows !== 1) {
      ctx.body = {
        code: 201,
        message: '标签不存在或删除失败',
        data: null,
      };
      return;
    }
    ctx.body = true;
  }


}

module.exports = LabelController;

