const deepIterator = require('deep-iterator').default;
const deepMerge = require('deepmerge');
const isMergeableObject = require('./isMergeableObject');
const jexl = require('jexl');

/**
 * Generates one fully merged config file from multiple sources
 * @type {module.ConfigGenerator}
 */
module.exports = class ConfigGenerator {

  constructor() {}

  loadConfigs(configPaths, pathPrefix) {
    if (!Array.isArray(configPaths)) {
      throw new Error('loadConfigs must he supplied with an array');
    }

    const configs = [];
    const prefix = pathPrefix || '../';
    configPaths.forEach((configPath) => {
      const path = `${prefix}${configPath}`;
      configs.push(require(path));
    });

    return configs;
  }

  getPropertyFromAllConfigs(property, configs) {
    return configs.map((config) => {
      return config[property] || {};
    });
  }

  getDataFromConfigs(configs) {
    return this.getPropertyFromAllConfigs('data', configs);
  }

  getAllocationsFromAllConfigs(configs) {
    return this.getPropertyFromAllConfigs('layerAllocations', configs);
  }

  allocateToLayers(configs) {
    const accumulatedAllocations = deepMerge.all(this.getAllocationsFromAllConfigs(configs));
    Object.keys(accumulatedAllocations).forEach((key) => {
      accumulatedAllocations[key] = Array.from(new Set(accumulatedAllocations[key]));
    });
    return accumulatedAllocations;
  }

  mergeConfigs(configs) {
    return deepMerge.all(this.getDataFromConfigs(configs), { isMergeableObject });
  }

  async generateConfig(configPaths) {
    const configs = this.loadConfigs(configPaths);
    const mergedConfig = this.mergeConfigs(configs);
    const data = await ConfigGenerator.processDeferredConfig(mergedConfig);

    return {
      data: data,
      layerAllocations: this.allocateToLayers(configs)
    };
  }

  static async processExpression(expression, context) {
    const normalised = expression.replace('!expression', '');
    return await jexl.eval(normalised, context);
  }

  static async processDeferredConfig(config) {
    const deepData = deepIterator(config);
    for (let {parent, key, value} of deepData) {
      if (typeof value === 'string' && value.indexOf('!expression ') > -1) {
        parent[key] = await ConfigGenerator.processExpression(value, config);
      }
    }

    return config;
  }

};
