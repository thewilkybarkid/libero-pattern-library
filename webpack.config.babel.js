export default (mode, entry, output) => {

  return {
    mode,
    entry,

    output: {
      path: output,
      filename: '[name].bundle.js'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      "useBuiltIns": "usage",
                      "corejs": 3,
                    }
                  ]
                ]
              }
            }
          ]
        }
      ]
    },

    optimization: {
      splitChunks: {
        chunks: 'all'
      },
      usedExports: true
    },

    stats: 'verbose',
    devtool: 'source-map'
  };

};
