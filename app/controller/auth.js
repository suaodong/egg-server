const { Controller } = require('egg');
const crypto = require('node:crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64url(input) {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
}

function verifyToken(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [ headerEncoded, payloadEncoded, signature ] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (signature !== expected) return null;
  try {
    const json = decodeBase64url(payloadEncoded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

class AuthController extends Controller {
  async login() {
    const { ctx, app, service } = this;
    const { username, password } = ctx.request.body || {};
    console.log('\x1b[32m%s\x1b[0m', 16, username, password);

    if (!username || !password) {
      ctx.body = {
        code: 201,
        msg: '用户名或密码错误',
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

    const user = await service.user.findByUsername(username);
    console.log('\x1b[32m%s\x1b[0m', 32, user);
    if (!user || user.password !== password) {
      ctx.body = {
        code: 201,
        message: '用户名或密码错误',
        data: null,
      };
      return;
    }

    if (Number(user.ty) === 1) {
      ctx.body = {
        code: 201,
        message: '用户已停用',
        data: null,
      };
      return;
    }

    const payload = {
      id: user.id,
      username: user.username,
      ts: Date.now(),
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const secret = app.config.keys || 'default_secret';

    const headerEncoded = base64url(JSON.stringify(header));
    const payloadEncoded = base64url(JSON.stringify(payload));
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const token = `${headerEncoded}.${payloadEncoded}.${signature}`;

    ctx.body = {
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  async userInfo() {
    const { ctx, app, service } = this;
    const auth = ctx.get('authorization');
    const queryToken = ctx.query.token;
    let token = '';
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice(7);
    } else if (typeof queryToken === 'string') {
      token = queryToken;
    }

    const secret = app.config.keys || 'default_secret';
    const payload = verifyToken(token, secret);
    if (!payload || !payload.username) {
      const err = new Error('未登录或 token 无效');
      err.status = 401;
      err.code = 10005;
      throw err;
    }

    const user = await service.user.findByUsername(payload.username);
    if (!user) {
      const err = new Error('用户不存在');
      err.status = 404;
      err.code = 10006;
      throw err;
    }

    if (Number(user.ty) === 1) {
      const err = new Error('用户已停用');
      err.status = 403;
      err.code = 10004;
      throw err;
    }

    ctx.body = {
      id: user.id,
      username: user.username,
      ty: Number(user.ty),
    };
  }

  async logout() {
    const { ctx } = this;
    ctx.body = null;
  }
}

module.exports = AuthController;
