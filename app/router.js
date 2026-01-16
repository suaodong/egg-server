/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/db/ping', controller.home.dbPing);

  // Sort routes
  router.post('/sort/add', controller.sort.add);
  router.post('/sort/update', controller.sort.update);
  router.post('/sort/delete', controller.sort.delete);
  router.get('/sort/list', controller.sort.list);

  // Auth routes
  router.post('/login', controller.auth.login);
  router.get('/user/info', controller.auth.userInfo);
  router.post('/logout', controller.auth.logout);

  // lable routes
  router.get('/label/list', controller.label.list);
  router.post('/label/add', controller.label.add);
  router.post('/label/update', controller.label.update);
  router.post('/label/delete', controller.label.delete);

  // article routes
  router.get('/article/categoryAndTag', controller.article.categoryAndTag);
  router.post('/article/save', controller.article.saveArticle);
  router.get('/article/list', controller.article.list);
  router.get('/article/detail/:id', controller.article.detail);
};
