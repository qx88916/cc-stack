module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": ".",
            "@cabconnect/shared": "../../packages/shared/index.ts",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};