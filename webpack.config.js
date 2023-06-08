const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './getlinks.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'app.js',
    library : 'lib'
  },
  plugins: [new HtmlWebpackPlugin({
    template: './download.html'
  })],
};