const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './public/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js',
    library: 'lib'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,                                                                                                                                                             
        use: ["style-loader", "css-loader"],                                                                                                                          
      },  
      {
        test: /\.(png|jpg|gif|ttf)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|ico|woff|woff2|ttf|svg|eot)$/,
        use: {
            loader: 'file-loader',
            options: { 
                name: '[name].[ext]',
                useRelativePath: true
            }
        }
    },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: './public/img',
        }
      ]
    }
    )
  ],
};