module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  globals: {
    web3: true,
    artifacts: true,
    contract: true,
    context: true,
    before: true,
    beforeEach: true,
    it: true,
    assert: true,
  },
  rules: {
    'max-len': ['error', { code: 180 }],
    'no-bitwise': false,
  },
};
