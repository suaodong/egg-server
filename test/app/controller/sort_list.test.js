const { strict: assert } = require('node:assert');
const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/sort_list.test.js', () => {
  it('should get sort list', async () => {
    // 先插入一条数据用于查询
    await app.mysql.insert('sort_list', { sort_name: 'test_query_list' });

    const res = await app.httpRequest()
      .get('/sort/list')
      .expect(200);

    assert.equal(res.body.code, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some(item => item.sort_name === 'test_query_list'));
  });

  it('should get sort list by sort_name', async () => {
    const res = await app.httpRequest()
      .get('/sort/list?sort_name=test_query_list')
      .expect(200);

    assert.equal(res.body.code, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(res.body.data[0].sort_name, 'test_query_list');
  });
});
