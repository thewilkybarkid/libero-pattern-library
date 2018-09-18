const path = require('path');
const sassTrue = require('sass-true');

// TODO: derive from directory listing rather than explicitly describing
[
  'utility-functions.spec.scss',
  'mixins--spacing.spec.scss'
].forEach((filename) => {
  sassTrue.runSass(
    {
      file: path.join(__dirname, filename)
    },
    describe,
    it);
});

