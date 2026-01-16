const { Controller } = require('egg');
const fs = require('fs');
const path = require('path');

class ArticleController extends Controller {
  async categoryAndTag() {
    const { ctx, app } = this;
    if (!app.mysql) {
      const err = new Error('数据库未配置');
      err.status = 500;
      err.code = 10002;
      throw err;
    }
    try {
      const categoriesRowsPromise = app.mysql.query('select id, sort_name from sort_list order by id desc');
      const tagsRowsPromise = app.mysql.query('select id, label_name, color from label_list order by id desc');
      const [ categoriesRows, tagsRows ] = await Promise.all([ categoriesRowsPromise, tagsRowsPromise ]);
      const categories = Array.isArray(categoriesRows)
        ? categoriesRows.map(row => ({
          id: row.id,
          name: row.sort_name,
        }))
        : [];
      const tags = Array.isArray(tagsRows)
        ? tagsRows.map(row => ({
          id: row.id,
          name: row.label_name,
          color: row.color,
        }))
        : [];
      ctx.body = {
        categories,
        tags,
      };
    } catch (err) {
      ctx.app.emit('error', err, ctx);
      const error = new Error('查询分类和标签失败');
      error.status = 500;
      error.code = 10003;
      throw error;
    }
  }

  async list() {
    const { ctx, app } = this;
    const { categoryId, page = 1, pageSize = 10 } = ctx.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const where = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    try {
      // 查询文章列表
      const articles = await app.mysql.select('article_list', {
        where,
        orders: [[ 'create_time', 'desc' ], [ 'id', 'desc' ]],
        limit,
        offset,
      });

      // 查询总数
      const total = await app.mysql.count('article_list', where);

      // 格式化数据
      const data = articles.map(item => ({
        ...item,
        // 确保 cover 是完整的 URL (如果是相对路径，且需要拼接域名，可以在这里处理，但目前只返回相对路径)
        cover: item.cover ? item.cover : null,
        // 格式化时间，如果需要
        // create_time: item.create_time,
        // update_time: item.update_time,
      }));

      ctx.body = {
        list: data,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };
    } catch (err) {
      ctx.logger.error('查询文章列表失败:', err);
      ctx.app.emit('error', err, ctx);
      const error = new Error('查询文章列表失败');
      error.status = 500;
      throw error;
    }
  }

  async detail() {
    const { ctx, app } = this;
    const { id } = ctx.params;

    if (!id) {
      ctx.body = {
        code: 400,
        message: '缺少文章ID',
        data: null,
      };
      return;
    }

    try {
      // 查询文章基本信息
      const article = await app.mysql.get('article_list', { id: Number(id) });

      if (!article) {
        ctx.body = {
          code: 404,
          message: '文章不存在',
          data: null,
        };
        return;
      }

      // 查询关联的标签 (如果需要详细的标签信息)
      // 这里通过 labelIds 字符串快速获取，或者查询 article_label 表
      // 假设我们想要返回标签的详细信息 (name, color)
      let tags = [];
      if (article.labelIds) {
        const labelIds = article.labelIds.split(',').map(v => parseInt(v)).filter(v => !isNaN(v));
        if (labelIds.length > 0) {
          tags = await app.mysql.select('label_list', {
            where: { id: labelIds },
            columns: [ 'id', 'label_name', 'color' ],
          });
        }
      }

      // 查询分类名称
      let categoryName = '';
      if (article.categoryId) {
        const category = await app.mysql.get('sort_list', { id: article.categoryId });
        if (category) {
          categoryName = category.sort_name;
        }
      }

      ctx.body = {
        ...article,
        cover: article.cover ? article.cover : null,
        tags,
        categoryName,
      };
    } catch (err) {
      ctx.logger.error('查询文章详情失败:', err);
      ctx.app.emit('error', err, ctx);
      const error = new Error('查询文章详情失败');
      error.status = 500;
      throw error;
    }
  }

  async saveArticle() {
    const { ctx, app } = this;
    const { id, title, description, content, categoryId, labelIds } = ctx.request.body;

    // 参数校验
    if (!title || !content || !categoryId) {
      ctx.body = {
        code: 201,
        message: '必填参数不能为空(title, content, categoryId)',
        data: null,
      };
      return;
    }

    let coverUrl = '';

    // 处理文件上传
    // 注意：需要在 config.default.js 中开启 config.multipart = { mode: 'file' };
    if (ctx.request.files && ctx.request.files.length > 0) {
      for (const file of ctx.request.files) {
        if (file.field === 'cover') {
          try {
            // 生成文件名：时间戳 + 随机数 + 后缀
            const extname = path.extname(file.filename).toLowerCase();
            const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}${extname}`;

            // 目标目录：app/public/uploads
            const targetDir = path.join(app.baseDir, 'app/public/uploads');
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }

            const targetPath = path.join(targetDir, filename);

            // 移动文件
            fs.copyFileSync(file.filepath, targetPath);
            // 删除临时文件
            fs.unlinkSync(file.filepath);

            // 生成访问 URL
            coverUrl = `/public/uploads/${filename}`;
          } catch (err) {
            ctx.logger.error('文件上传失败:', err);
            // 即使上传失败，也可能继续保存文章，或者抛出错误，这里选择记录日志但不中断（除非封面必须）
          }
        }
      }
    }

    // 如果没有上传新文件，但 body 里有 cover 字段（可能是旧图片的 URL 或者前端传的字符串），尝试使用
    if (!coverUrl && ctx.request.body.cover) {
      // 简单判断一下是否是 URL 格式，或者是之前的路径
      coverUrl = ctx.request.body.cover;
    }

    let conn;
    try {
      conn = await app.mysql.beginTransaction();

      // 准备入库数据
      const articleData = {
        title,
        description: description || '',
        content,
        categoryId,
        labelIds: labelIds || '', // 仍保留该字段，作为冗余存储
        cover: coverUrl,
      };

      let articleId;

      if (id) {
        // === 编辑模式 ===
        articleId = Number(id);
        const updateResult = await conn.update('article_list', {
          id: articleId,
          ...articleData,
          update_time: app.mysql.literals.now, // 更新时间
        });

        if (updateResult.affectedRows !== 1) {
          throw new Error('文章更新失败或文章不存在');
        }
      } else {
        // === 新增模式 ===
        articleData.create_time = app.mysql.literals.now;
        const insertResult = await conn.insert('article_list', articleData);

        if (insertResult.affectedRows === 1) {
          articleId = insertResult.insertId;
        } else {
          throw new Error('文章保存失败');
        }
      }

      // === 处理标签关联 (article_label) ===
      // 1. 解析 labelIds (假设是 "1,2,3" 格式)
      const labelIdList = labelIds ? String(labelIds).split(',').map(v => parseInt(v))
        .filter(v => !isNaN(v)) : [];

      // 2. 删除旧关联
      if (id) {
        await conn.delete('article_label', { article_id: articleId });
      }

      // 3. 插入新关联
      if (labelIdList.length > 0) {
        // 批量插入
        // mysql 插件 insert 方法一次只能插入一条，或者使用 query 拼 SQL
        // 为简单起见，循环插入 (注意性能，但标签数通常不多)
        // 或者构建 bulk insert sql
        const values = labelIdList.map(lid => `(${articleId}, ${lid})`).join(',');
        if (values) {
          await conn.query(`INSERT INTO article_label (article_id, label_id) VALUES ${values}`);
        }
      }

      await conn.commit();

      ctx.body = {
        id: articleId,
        ...articleData,
        create_time: id ? undefined : new Date(), // 简单处理，实际应查库或返回 literals
      };

    } catch (err) {
      if (conn) await conn.rollback();
      ctx.logger.error('保存文章出错:', err);
      ctx.app.emit('error', err, ctx);
      const error = new Error('文章保存异常: ' + err.message);
      error.status = 500;
      throw error;
    }
  }
}

module.exports = ArticleController;
