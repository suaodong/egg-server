const { strict: assert } = require('node:assert');
const { app, mock } = require('egg-mock/bootstrap');
const path = require('path');
const fs = require('fs');

describe('test/app/controller/article.test.js', () => {
  const mockConn = {
    insert: async table => {
      if (table === 'article_list') {
        return { insertId: 100, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 1 }; // for article_label
    },
    update: async table => {
      if (table === 'article_list') {
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    },
    delete: async () => ({ affectedRows: 1 }),
    query: async () => ({}),
    commit: async () => {},
    rollback: async () => {},
  };

  beforeEach(() => {
    mock(app, 'mysql', {
      beginTransaction: async () => mockConn,
      literals: {
        now: new Date(),
      },
    });
  });

  it('should list articles with pagination', async () => {
    mock(app, 'mysql', {
      select: async table => {
        if (table === 'article_list') {
          return [
            { id: 1, title: 'Article 1', categoryId: 1, cover: '/public/uploads/1.png' },
            { id: 2, title: 'Article 2', categoryId: 1 },
          ];
        }
      },
      count: async () => 2,
    });

    const res = await app.httpRequest()
      .get('/article/list')
      .query({ categoryId: 1, page: 1, pageSize: 10 })
      .expect(200);

    // console.log(res.body);
    // responseWrapper wraps result in data field
    assert.equal(res.body.data.list.length, 2);
    assert.equal(res.body.data.total, 2);
    assert.equal(res.body.data.list[0].cover, '/public/uploads/1.png');
  });

  it('should get article detail', async () => {
    mock(app, 'mysql', {
      get: async table => {
        if (table === 'article_list') {
          return { id: 1, title: 'Article 1', categoryId: 1, labelIds: '1,2', cover: '/public/uploads/1.png' };
        }
        if (table === 'sort_list') {
          return { id: 1, sort_name: 'Tech' };
        }
      },
      select: async table => {
        if (table === 'label_list') {
          return [
            { id: 1, label_name: 'Tag1', color: '#fff' },
            { id: 2, label_name: 'Tag2', color: '#000' },
          ];
        }
      },
    });

    const res = await app.httpRequest()
      .get('/article/detail/1')
      .expect(200);

    // console.log(res.body);
    assert.equal(res.body.data.id, 1);
    assert.equal(res.body.data.title, 'Article 1');
    assert.equal(res.body.data.categoryName, 'Tech');
    assert.equal(res.body.data.tags.length, 2);
  });

  it('should save article with cover image', async () => {
    // 准备一个临时文件
    const tmpFile = path.join(__dirname, 'test_cover.png');
    fs.writeFileSync(tmpFile, 'fake image content');

    try {
      const res = await app.httpRequest()
        .post('/article/save')
        .field('title', 'Test Article')
        .field('description', 'Test Description')
        .field('content', 'Test Content')
        .field('categoryId', '1')
        .field('labelIds', '1,2')
        .attach('cover', tmpFile)
        .expect(200);

      assert.equal(res.body.data.id, 100);
      assert.equal(res.body.data.title, 'Test Article');
      assert.ok(res.body.data.cover.includes('/public/uploads/'));
    } finally {
      // 清理
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it('should save article without cover image', async () => {
    const res = await app.httpRequest()
      .post('/article/save')
      .field('title', 'Test Article No Cover')
      .field('content', 'Test Content')
      .field('categoryId', '1')
      .expect(200);

    assert.equal(res.body.data.id, 100); // Mock returns 100
    assert.equal(res.body.data.title, 'Test Article No Cover');
    assert.equal(res.body.data.cover, '');
  });

  it('should update article when id is provided', async () => {
    // Override mock for this test to check ID
    mockConn.update = async (table, data) => {
      if (table === 'article_list') {
        assert.equal(data.id, 200);
        return { affectedRows: 1 };
      }
    };

    const res = await app.httpRequest()
      .post('/article/save')
      .field('id', '200')
      .field('title', 'Updated Article')
      .field('content', 'Updated Content')
      .field('categoryId', '1')
      .expect(200);

    assert.equal(res.body.data.id, 200);
    assert.equal(res.body.data.title, 'Updated Article');
  });

  it('should save article with large content', async () => {
    // Create a large content string (> 100KB)
    const largeContent = 'a'.repeat(200 * 1024);

    const res = await app.httpRequest()
      .post('/article/save')
      .field('title', 'Large Article')
      .field('content', largeContent)
      .field('categoryId', '1')
      .expect(200);

    assert.equal(res.body.data.id, 100);
    assert.equal(res.body.data.content.length, 200 * 1024);
  });
});
