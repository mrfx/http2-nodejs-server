const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    server: './src/server.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  }
};

