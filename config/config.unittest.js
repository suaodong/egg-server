const path = require('path');

module.exports = appInfo => {
  return {
    logger: {
      dir: path.join(appInfo.baseDir, 'logs/unittest'),
    },
  };
};
