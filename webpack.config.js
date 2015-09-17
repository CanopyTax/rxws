var path = require('path');
var webpack = require('webpack');

module.exports = {
	resolve: {
		extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
	},
	entry: {
		main: './src/rxws.js'
	},
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'rxws.js'
	},
	module: {
		loaders: [{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		}]
	},
	externals: {
		rx: "rx",
		"node-uuid": "uuid"
	},
	plugins: [new webpack.optimize.UglifyJsPlugin({minimize: true})]
}
