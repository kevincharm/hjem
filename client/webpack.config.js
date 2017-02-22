const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const nodeEnv = process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'

const apiRouteBase = isProd ? 'https://api.callback.hell' : 'http://localhost:3000'

const sourcePath = path.join(__dirname, './src')
const buildPath = path.join(__dirname, './www')

const plugins = [
    new ExtractTextPlugin('bundle.css'),
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: Infinity,
        filename: 'vendor.bundle.js'
    }),
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(nodeEnv),
            API_ROUTE_BASE: JSON.stringify(apiRouteBase)
        }
    }),
    new webpack.NamedModulesPlugin(),
]

const babelLoaderOptions = {
    presets: [
        ['es2015', { loose: true, modules: false }],
        'react'
    ],
    plugins: [
        'transform-class-properties',
        'transform-runtime'
    ]
}

if (isProd) {
    plugins.push(
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                screw_ie8: true,
                conditionals: true,
                unused: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                evaluate: true,
                if_return: true,
                join_vars: true,
            },
            s: {
                comments: false
            },
        })
    )
} else {
    plugins.push(
        new webpack.HotModuleReplacementPlugin()
    )
    babelLoaderOptions.presets.push('react-hmre')
}

module.exports = {
    devtool: isProd ? 'source-map' : 'eval',
    context: sourcePath,
    entry: {
        js: './index.js',
        vendor: ['react']
    },
    output: {
        path: buildPath,
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                exclude: /node_modules/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            },
            {
                test: /\.(png|jpg)$/,
                exclude: /node_modules/,
                loader: 'file-loader',
                query: {
                    name: './images/[name].[ext]'
                }
            },
            {
                test: /\.(css|scss)$/,
                loader: ExtractTextPlugin.extract({
                    fallbackLoader: 'style-loader',
                    loader: [
                        'css-loader',
                        'sass-loader'
                    ]
                })
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: babelLoaderOptions
            },
        ],
    },
    resolve: {
        extensions: [
            '.webpack-loader.js',
            '.web-loader.js',
            '.loader.js',
            '.js',
            '.jsx',
            '.scss'
        ],
        modules: [
            'node_modules',
            path.resolve(__dirname, 'node_modules'),
            sourcePath
        ]
    },
    plugins,
    devServer: {
        contentBase: sourcePath,
        historyApiFallback: true,
        publicPath: '/',
        port: 3100,
        compress: isProd,
        inline: !isProd,
        hot: !isProd,
        stats: {
            assets: true,
            children: false,
            chunks: false,
            hash: false,
            modules: false,
            publicPath: false,
            timings: true,
            version: false,
            warnings: true,
            colors: {
                green: '\u001b[32m',
            }
        },
    }
}
