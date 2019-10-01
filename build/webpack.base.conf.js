const path = require("path");


module.exports = {
	context: path.resolve(__dirname, "../"),
	entry: "./src/instance.js",
	output: {
		path: path.resolve("dist"),
		filename: "y-vue.js"
	},
	resolve: {
		extensions: [".js", ".ts"],
		alias: {
			"@": "./src"
		}
	},
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			options: {
				presets: ['es2015'],
				plugins: ['transform-runtime']
			}
		}]
	}
}
