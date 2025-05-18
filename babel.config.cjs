module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    
    '@babel/preset-env',
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    
    '@babel/plugin-syntax-import-meta',
  ],
};


// module.exports = {
//   presets: [
//     '@babel/preset-env',
//     '@babel/preset-typescript',
//     '@babel/preset-react',
//   ],
//   plugins: [
    
//     '@babel/plugin-syntax-import-meta',
//   ],
// };