module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['transform-import-meta', {
      module: 'ES6',
      meta: {
        env: 'process.env'
      }
    }]
  ]
};