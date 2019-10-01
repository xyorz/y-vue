const merge = require("webpack-merge");
const baseConfig = require("./webpack.base.conf");

module.exports = merge(baseConfig, {
	// devServer: {
	// 	hot: true,
	// 	host: "127.0.0.1",
	// 	port: "8002",
	// 	open: false
	// }
	devtool: "cheap-module-eval-source-map"
});
