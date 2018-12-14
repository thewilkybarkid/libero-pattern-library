const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const fixtures = require('./fixtures/configFixtures');
const ConfigDistributor = require('../../libero-config/bin/ConfigDistributor');

const spy = sinon.spy;

chai.use(chaiAsPromised);
const expect = chai.expect;

const standAloneConfigFixtureFilePath = './fixtures/configFixtureStandAlone';
const standAloneConfigFixture = require(standAloneConfigFixtureFilePath);

describe('A DistributeConfig class', () => {

  context('instantiated object', () => {

    let configDistributor;

    beforeEach(() => {
      configDistributor = new ConfigDistributor();
    });

    describe('distribute method', () => {

      let configPaths;

      it('initiates config generation with the config paths supplied', () => {
        const configGeneratorMock = {
          generateConfig: () => {
            return Promise.resolve(standAloneConfigFixture);
          },
        };
        spy(configGeneratorMock, 'generateConfig');

        const configPaths = fixtures.configPaths;
        return configDistributor.distribute(configPaths, configGeneratorMock).then(() => {
          expect(configGeneratorMock.generateConfig.calledOnceWithExactly(configPaths)).to.be.true;
        });
      });

    });

  });

  describe('processForSass static method', () => {

    context('when supplied with a JavaScript object defining data for SASS variables', () => {

      let sassConfigFixture;

      beforeEach(() => {
        sassConfigFixture = fixtures.sassConfigToProcess.input;
      });

      it('correctly converts the JavaScript into a string wrapping corresponding SASS variable declarations', () => {
        const processed = ConfigDistributor.processForSass(sassConfigFixture);
        expect(processed).to.deep.equal(fixtures.sassConfigToProcess.expected);
      });

    });

  });

  describe('processForJs static method', () => {

    context('when supplied with a JavaScript object defining data for the JavaScript layer', () => {

      let jsConfigFixture;

      beforeEach(() => {
        jsConfigFixture = fixtures.jsConfigToProcess.input;
      });

      it('correctly converts the JavaScript into the appropriate JSON', () => {
        const processed = ConfigDistributor.processForJs(['breakpoints'], jsConfigFixture);
        expect(processed).to.deep.equal(JSON.stringify(fixtures.jsConfigToProcess.input));
      });

    });

  });

});
