const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const entries = fs
  .readdirSync(path.join(__dirname, "buildandreleasetask"))
  .filter((dir) => fs.statSync(path.join("buildandreleasetask", dir)).isDirectory())
  .reduce((acc, dir) => ({ ...acc, [dir]: `./buildandreleasetask/${dir}/${dir}` }), {}); // buildandreleasetask is equivalent to src

module.exports = {
  entry: entries,
  devtool: "inline-source-map",
  output: {
    filename: "[name]/[name].js",
    // path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
  },
  devServer: {
    // static: path.join(__dirname, "buildandreleasetask"),
    https: true,
    port: 3000,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "**/*.js", context: "buildandreleasetask" }], // src
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};
