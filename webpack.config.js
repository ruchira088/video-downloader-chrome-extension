const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const packageJson = require("./package.json")

const manifestFile = (json) => ({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  ...json,
})

module.exports = {
  mode: process.env.NODE_ENV || "development",
  devtool: "inline-source-map",
  entry: {
    content: path.resolve(__dirname, "src", "scripts", "Content.ts"),
    "config-page": path.resolve(__dirname, "src", "scripts", "ConfigPage.ts"),
    "service-worker": path.resolve(__dirname, "src", "scripts", "ServiceWorker.ts"),
  },
  module: {
    rules: [
      {
        test: /\.([tj])s$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "build"),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "manifest.json",
          to: "manifest.json",
          transform: (content) => JSON.stringify(manifestFile(JSON.parse(content)), null, 2),
        },
        { from: "*.html", context: "src/html" },
        { from: "icons/*.png" },
      ],
    }),
  ],
}
