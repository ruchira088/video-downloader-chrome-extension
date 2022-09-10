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
    content: path.resolve(__dirname, "src", "content", "Content.ts"),
    "action-page": path.resolve(__dirname, "src", "action-page", "ActionPage.tsx"),
    "service-worker": path.resolve(__dirname, "src", "worker", "ServiceWorker.ts")
  },
  module: {
    rules: [
      {
        test: /\.(ts|js|tsx|jsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "styles/",
              name: "[name].css"
            }
          },
          "sass-loader"
        ]
      }
    ],
  },
  resolve: {
    extensions: [".ts", ".js", "jsx", ".tsx"],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "build"),
    publicPath: ""
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "manifest.json",
          to: "manifest.json",
          transform: (content) => JSON.stringify(manifestFile(JSON.parse(content)), null, 2),
        },
        { from: "*.html", context: "src/action-page" },
        { from: "icons/*" },
        { from: "images/*" }
      ],
    }),
  ],
}
