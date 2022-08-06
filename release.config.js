module.exports = {
  branches: [
    'master',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
  ],

  tagFormat: 'docupdf-v${version}',
};
