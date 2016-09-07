var webpack = require('webpack');
module.exports = {
    entry: './src/vue-validator-manage.js',
    output: {
        path: 'builds',
        filename: 'vue-validator-manage.js'
    },
    module: {
        loaders: [{
            test: /\.js/,
            loader: 'babel',
            query: {
                presets: ['es2015']
            },
            // include: __dirname + '/src',
        }, {
            test: /\.html/,
            loader: 'html',
        }],
    }
};
