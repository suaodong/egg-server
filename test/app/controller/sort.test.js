const { strict: assert } = require('node:assert');
const { app, mock } = require('egg-mock/bootstrap');

describe('test/app/controller/sort.test.js', () => {
  it('should get sort list', async () => {
    // 由于我们直接用的 app.mysql，mockService 无法使用（因为没有对应的 Service 类）
    // 所以我们需要 mock app.mysql 对象

    mock(app, 'mysql', {
      select: async table => {
        if (table === 'sort_list') {
          return [
            { id: 1, sort_name: '测试分类1' },
            { id: 2, sort_name: '测试分类2' },
          ];
        }
        return [];
      },
      // 同时也 mock 其他可能用到的方法，防止报错
      query: async () => [],
    });

    const res = await app.httpRequest()
      .get('/sort/list')
      .expect(200);

    assert.equal(res.body.code, 200);
    assert.equal(res.body.message, 'success');
    assert(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].sort_name, '测试分类1');
  });
});
