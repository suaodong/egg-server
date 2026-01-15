const { strict: assert } = require('node:assert');
const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/login.test.js', () => {
  it('should login success with valid user', async () => {
    const user = {
      id: 1,
      username: 'testuser',
      password: '123456',
      ty: 0,
    };

    app.mockService('user', 'findByUsername', async username => {
      if (username === user.username) return user;
      return null;
    });

    const res = await app.httpRequest()
      .post('/login')
      .send({
        username: 'testuser',
        password: '123456',
      })
      .expect(200);

    assert.equal(res.body.code, 200);
    assert.equal(res.body.message, 'success');
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.id, user.id);
    assert.equal(res.body.data.user.username, user.username);
  });

  it('should fail when user disabled', async () => {
    const user = {
      id: 1,
      username: 'disabled',
      password: '123456',
      ty: 1,
    };

    app.mockService('user', 'findByUsername', async username => {
      if (username === user.username) return user;
      return null;
    });

    const res = await app.httpRequest()
      .post('/login')
      .send({
        username: 'disabled',
        password: '123456',
      })
      .expect(200);

    assert.equal(res.body.code, 201);
  });
});
