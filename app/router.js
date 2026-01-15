/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/db/ping', controller.home.dbPing);
  router.post('/login', controller.auth.login);
  router.get('/user/info', controller.auth.userInfo);
  router.post('/logout', controller.auth.logout);
};
