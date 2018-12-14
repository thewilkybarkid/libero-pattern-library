const glob = require('glob');
const sassTrue = require('sass-true');

glob.sync('**/*.spec.scss')
  .forEach(file => {
    sassTrue.runSass(
      {
        file,
      },
      describe,
      it);
  })
;
