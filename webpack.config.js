var path = require('path');

module.exports = {
	resolve: {
		extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
	},
	entry: {
		main: './src/test.js'
	},
	devtool: 'srouce-map',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'rxws.js'
	},
	module: {
		loaders: [{
			test: /\.ts$/,
			loader: 'ts-loader'
		}]
	}
}
