const path = require("path")
const webpack = require("webpack")
const CopyPlugin = require("copy-webpack-plugin")
const packageJson = require("./package.json")

const manifestFile = (json) => ({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  ...json,
})

const buildTarget = process.env.BUILD_TARGET ?? path.resolve(__dirname, "build")

// tsc emits type-stripped JS here (tsconfig `outDir`); webpack bundles that rather than the .ts sources,
// since TypeScript 7 is the native compiler and ships no JS API for a webpack loader to call into.
const tsBuild = path.resolve(__dirname, ".tsbuild")

console.log(`Building to ${buildTarget}`)

const isProduction = process.env.NODE_ENV === "production"

module.exports = {
  mode: process.env.NODE_ENV || "development",
  devtool: isProduction ? "source-map" : "inline-source-map",
  performance: { hints: false },
  entry: {
    content: path.resolve(tsBuild, "content", "Content.js"),
    "action-page": path.resolve(tsBuild, "action-page", "ActionPage.js"),
    "service-worker": path.resolve(tsBuild, "worker", "ServiceWorker.js"),
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        type: "asset/resource",
        generator: {
          filename: "styles/[name].css",
        },
        use: ["sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
  output: {
    filename: "[name].bundle.js",
    path: buildTarget,
    publicPath: "",
    clean: true,
  },
  plugins: [
    // tsc only emits JS, so the stylesheets the entrypoints import (`./styles/*.scss`, siblings of the .ts
    // files) have no counterpart under .tsbuild. Resolve those requests back to their originals in src/.
    new webpack.NormalModuleReplacementPlugin(/\.s[ac]ss$/, (resource) => {
      const absolute = path.resolve(resource.context, resource.request)

      if (absolute.startsWith(tsBuild + path.sep)) {
        resource.request = path.resolve(__dirname, "src", path.relative(tsBuild, absolute))
      }
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "manifest.json",
          to: "manifest.json",
          transform: (content) => JSON.stringify(manifestFile(JSON.parse(content)), null, 2),
        },
        { from: "*.html", context: "src/action-page" },
        { from: "icons/*" },
        { from: "images/*" },
      ],
    }),
  ],
}
