module.exports = () => {
  return async function responseWrapper(ctx, next) {
    try {
      await next();
      if (ctx.body === undefined) return;
      if (ctx.body && typeof ctx.body.code === 'number') return;
      ctx.body = {
        code: 200,
        message: 'success',
        data: ctx.body,
      };
    } catch (err) {
      ctx.app.emit('error', err, ctx);
      ctx.status = err.status || 500;
      ctx.body = {
        code: err.code || -1,
        message: err.message || 'Internal Server Error',
        data: null,
      };
    }
  };
};
