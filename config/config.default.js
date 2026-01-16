/* eslint valid-jsdoc: "off" */
require('dotenv').config();

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1768440164691_6772';

  config.multipart = {
    mode: 'file',
    fileSize: '50mb', // Max file size
    fieldSize: '10mb', // Max field size (for text fields like content)
  };

  config.middleware = [ 'responseWrapper' ];

  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.logger = {
    level: 'INFO',
    consoleLevel: 'INFO',
    disableConsoleAfterReady: false,
  };

  if (process.env.MYSQL_HOST) {
    config.mysql = {
      client: {
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB || 'test',
      },
      app: true,
      agent: false,
    };
  }

  const userConfig = {};

  return {
    ...config,
    ...userConfig,
  };
};
