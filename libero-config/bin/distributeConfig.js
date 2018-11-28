const ConfigGenerator = require('./ConfigGenerator');
const ConfigDistributor = require('./ConfigDistributor');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const readFileAsync = promisify(fs.readFile);

const configSpecFilepath = path.join(path.resolve(__dirname, '..'), 'configRegister.json');

function useConfigSpec(rawData) {
  const data = JSON.parse((rawData));
  const configPaths = data.configPaths;

  // Combine all configs specified in configPaths into one config
  const configGenerator = new ConfigGenerator(configPaths);

  // Distribute defined parts of the config to specified technology layers
  const configDistributor = new ConfigDistributor();
  return configDistributor.distribute(configPaths, configGenerator)
                   .catch((err) => { throw err; });
}

function distribute() {
  return readFileAsync(configSpecFilepath)
    .then(useConfigSpec)
    .catch((err) => {
      throw err;
    });
}

module.exports = distribute;

if (require.main === module) {
  distribute();
}

