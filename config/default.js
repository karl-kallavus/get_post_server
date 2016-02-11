'use strict';

var path = require('path');

var projectRoot = path.dirname(__dirname);

module.exports = {
  projectRoot,
  publicRoot: path.join(projectRoot, 'public'),
  port: 3000
};

