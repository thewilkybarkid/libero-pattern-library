const Color = require('color');
const deepIterator = require('deep-iterator').default;
const flatten = require('flat');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const writeFileAsync = promisify(fs.writeFile);

/**
 * Distributes specified config to appropriate layers (sass, js, templates)
 * @type {module.ConfigDistributor}
 */
module.exports = class ConfigDistributor {

  constructor() {
    this.paths = {
      out: {
        sassVariablesPath: '/source/css/sass/variables',
        jsonFileName: '/source/js/derivedConfig.json'
      }
    };
  }

  distribute(configPaths, configGenerator) {

    console.log('Distributing config...');

    return configGenerator.generateConfig(configPaths)
      .then((config) => {
        return Promise.all(
          [
            this.distributeToSass(config.layerAllocations.sass, config.data),
            this.distributeToJs(config.layerAllocations.js, config.data),
          ]
        )
      })
      .catch(err => {
        console.error(err.message);
        process.exit(1);
      });
  }

  distributeToJs(allocations, data) {
    return ConfigDistributor.writeFile(
      ConfigDistributor.processForJs(allocations, data),
      this.paths.out.jsonFileName
    );
  }

  distributeToSass(allocations, data) {

    const fileWritePromises = [];

    // Each allocation is written to a separate file
    allocations.forEach((allocation) => {
      const dataForAllocation = {};
      dataForAllocation[allocation] = data[allocation];
      const processedItemData = ConfigDistributor.processForSass(dataForAllocation);
      const outFileName = path.join(this.paths.out.sassVariablesPath, `${allocation}.scss`);
      fileWritePromises.push(
        new Promise((resolve) => {
          resolve(ConfigDistributor.writeFile(processedItemData, outFileName));
        })
      );
    });

    return Promise.all(fileWritePromises).catch(err => { throw err; } );

  }

  static processForJs(allocations, data) {
    const processed = {};
    allocations.forEach((allocation) => {
      processed[allocation] = data[allocation];
    });
    return JSON.stringify(processed);
  }

  static processForSass(data) {
    const deepData = deepIterator(data);
    for (let {parent, key, value} of deepData) {
      if (value instanceof Color) {
        parent[key] = value.rgb().string();
      }
    }

    return Object.entries(flatten(data, {delimiter: '-'}))
      .reduce((carry, pair) => {
        const [key, value] = pair;
        return `${carry}$${key}: ${value};\n`;
      }, '');
  }

  static writeDirectory(path) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, { recursive: true}, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  static async writeFile(data, outPath) {
    let projectRootPath = process.cwd();
    const matched = projectRootPath.match(/^.*\/libero-config\/bin.*$/);
    if (matched) {
      projectRootPath = path.resolve(path.join(process.cwd(), '../..'));
    }
    const outPathDirectoryComponent = outPath.substring(0, outPath.lastIndexOf('/') + 1);
    const fullDirectoryPath = path.join(projectRootPath, outPathDirectoryComponent);
    await this.writeDirectory(fullDirectoryPath);

    const filenameComponent = outPath.substring(outPath.lastIndexOf('/') + 1);
    return writeFileAsync(path.join(fullDirectoryPath, filenameComponent), data)
      .then(() => {
        console.log(`Written config to ${path.join(outPathDirectoryComponent, filenameComponent)}`);
      })
      .catch(err => { throw err });
  }

};
