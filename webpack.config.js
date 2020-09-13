const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
    mode: process.env.NODE_ENV || "development",
    entry: {
        content: path.resolve(__dirname, "src", "Index.ts")
    },
    module: {
        rules: [
            {
                test: /\.([tj])s$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ ".ts", ".js" ]
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "build")
    },
    plugins: [
        new CopyPlugin({
            patterns: [ { from: "src/manifest.json", to: "manifest.json" }]
        })
    ]
}
