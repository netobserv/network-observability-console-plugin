
/* eslint-env node */
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import * as path from 'path';

//const NodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  // No regular entry points. The remote container entry is handled by ConsoleRemotePlugin.
  entry: {},
  context: path.resolve(__dirname, 'src'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
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
          // Creates `style` nodes from JS strings
          // Insert styles at top of document head using function
          // Check https://webpack.js.org/loaders/style-loader/#function
          {
            loader: "style-loader", options: {
              insert: function insertAtTop(element: any) {
                const parent = document.querySelector("head");
                // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
                const lastInsertedElement = (window as any)._lastElementInsertedByStyleLoader;

                if (!lastInsertedElement) {
                  parent!.insertBefore(element, parent!.firstChild);
                } else if (lastInsertedElement.nextSibling) {
                  parent!.insertBefore(element, lastInsertedElement.nextSibling);
                } else {
                  parent!.appendChild(element);
                }

                // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
                (window as any)._lastElementInsertedByStyleLoader = element;
              },
            }
          },
          // Translates CSS into CommonJS
          "css-loader",
        ],
      },
    ],
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
    new ConsoleRemotePlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'locales'), to: 'locales' },
        { from: path.resolve(__dirname, 'assets'), to: 'assets' },
      ],
    }),
  ],
  devtool: 'source-map',
  optimization: {
    chunkIds: 'named',
    minimize: false,
  },
};

if (process.env.FLAVOR === 'static') {
  module.exports.output.path = path.resolve(__dirname, 'dist', 'static');
}

if (process.env.NODE_ENV === 'production') {
  module.exports.mode = 'production';
  module.exports.output.filename = '[name]-bundle-[hash].min.js';
  module.exports.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  module.exports.optimization.chunkIds = 'deterministic';
  module.exports.optimization.minimize = true;
  // Causes error in --mode=production due to scope hoisting
  module.exports.optimization.concatenateModules = false;
  // Manage dependencies from package.json file. Replace all devDependencies 'import' by 'require'
  /*module.exports.externals = NodeExternals({
    fileName: './package.json',
    includeInBundle: ['dependencies'],
    excludeFromBundle: ['devDependencies']
  });*/
}

export default module.exports;