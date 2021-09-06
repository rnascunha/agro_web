const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const Copy_Plugin = require("copy-webpack-plugin");
const Html_Webpack_Plugin = require('html-webpack-plugin');
// const Workbox_Plugin = require('workbox-webpack-plugin');
const webpack = require('webpack');

module.exports = (public_path) => {
    return {
        entry: {
            //Main
            index: path.resolve(__dirname, '..', './src/index.js'),
        },
        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    exclude: /node_modules/,
                    use: ['babel-loader']
                },
                {
                    test: /\.(css)$/,
                    exclude: [
                        path.resolve(__dirname, '..', './src/css'),
                    ],
                    use: ['css-loader']
                },
                {
                  test: /\.(html)$/,
                  exclude: /node_modules/,
                  use: {loader: 'raw-loader'}
                }
            ]
        },
        resolve: {
            extensions: ['*', '.js']
        },
        plugins: [
            new CleanWebpackPlugin(),
            new Html_Webpack_Plugin({
                template: path.resolve(__dirname, '..', './src/index.html'),
                favicon: path.resolve(__dirname, '..', './icons/favicon.ico'),
                inject: true,
                chunks: ['index'],
            }),
            // new Workbox_Plugin.GenerateSW({
            //     clientsClaim: true,
            //     skipWaiting: true,
            //     runtimeCaching: [{
            //         urlPattern: /.*/,
            //         handler: 'StaleWhileRevalidate',
            //     }]
            // }),
            new webpack.DefinePlugin({
                publicPath: JSON.stringify(public_path),
            }),
            new Copy_Plugin({
                patterns: [
                    path.resolve(__dirname, '..', 'src', 'sw.js'),
                    path.resolve(__dirname, '..', 'src', 'manifest.json'),
                    path.resolve(__dirname, '..', 'icons', 'icon-128x128.png'),
                    path.resolve(__dirname, '..', 'icons', "icon-192x192.png"),
                    path.resolve(__dirname, '..', 'icons', 'icon-256x256.png'),
                    path.resolve(__dirname, '..', 'icons', 'icon-512x512.png')
                ]
            })
        ],
        output: {
            path: path.resolve(__dirname, '..', './dist/'),
            filename: '[name].[contenthash].js',
            publicPath: public_path
        },
        devServer: {
          // watchFiles: ['../src/*']
          // static: {
          //   watch: { ignored: [/node_modules/] }
          // }
            // contentBase: path.resolve(__dirname, '..', './dist/'),
            // publicPath: public_path
        },
        optimization: {
            moduleIds: 'deterministic',
    //        runtimeChunk: 'single',
            splitChunks: {
                chunks: 'all',
                name(module) {
                    const moduleFileName = module.identifier().split(/[/\\]/).reduceRight(item => item);
                    return 'vendor-' + moduleFileName;
                },
            },
        },
    }
}
