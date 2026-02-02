const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be inside the project folder
  // so that it is included in the deployment build.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
