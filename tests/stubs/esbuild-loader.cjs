const esbuild = require("esbuild");

module.exports = function ducktionTestEsbuildLoader(source) {
  const callback = this.async();

  try {
    const result = esbuild.transformSync(source, {
      loader: "ts",
      format: "cjs",
      target: "es2022",
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    });

    callback(null, result.code, result.map);
  } catch (error) {
    callback(error);
  }
};
