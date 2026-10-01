'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-querybuilder.cjs.production.js');
} else {
  module.exports = require('./react-querybuilder.cjs.development.js');
}
