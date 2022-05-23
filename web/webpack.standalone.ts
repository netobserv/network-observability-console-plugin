const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: "./index.tsx",
  context: path.resolve(__dirname, 'src'),
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          }
        }
      },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /(\.s*[ac]ss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader'
          }
        ]
      }
    ]
  },
  devServer: {
    static: './dist',
    port: 9001,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization"
    },
    devMiddleware: {
      writeToDisk: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        router: () => 'http://localhost:9002',
        logLevel: 'debug' /*optional*/
      }
    }
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /dynamic-plugin-sdk/,
      function (resource) {
        resource.request = path.resolve(__dirname, "moduleMapper/dummy");
      }
    ),
    new MiniCssExtractPlugin(
      {
        filename: '[name].[contenthash].css',
        chunkFilename: '[name].[contenthash].css'
      }
    ),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'locales'), to: 'locales' }],
    }),
    new HtmlWebpackPlugin({
      favicon: path.join(__dirname, "static", "favicon.ico"),
      template: path.join(__dirname, "src", "index.html"),
    }),
  ],
}