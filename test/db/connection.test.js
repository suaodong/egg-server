const { strict: assert } = require('node:assert');
const { app } = require('egg-mock/bootstrap');

describe('test/db/connection.test.js', () => {
  it('should connect to mysql and select 1', async () => {
    const rows = await app.mysql.query('select 1 as result');
    assert.equal(rows[0].result, 1);
  });
});

