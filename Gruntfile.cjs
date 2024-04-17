const buildTools = require('lincd-cli/config-grunt');
module.exports = buildTools.generateGruntConfig('lincd', {
  target: 'es6',
  externals: {
    html2plaintext: 'thisIsNotAvailableInTheBrowser',
    react: 'React',
    'react-dom': 'ReactDOM',
    'prop-types': 'PropTypes',
  },
  declarations: false,
  debug: false,
  analyse: false,
  filename: 'lincd',
  tsConfigOverwrites: {
    compilerOptions: {
      module: 'commonjs',
    },
  },
});
