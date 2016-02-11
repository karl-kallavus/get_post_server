'use strict';

const server = require('./server');
const config = require('config');

server.listen(config.get('port'), () => {
  console.log(server.address());
});
