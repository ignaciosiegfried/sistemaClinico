const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

/**
 * Makes sure that the build folder is deleted, before every compilation
 * @returns {*} - Path where the compiled sources should be saved.
 */
function compilingPreperations() {
  const buildPath = path.resolve(__dirname, 'build');
  fs.removeSync(buildPath);
  return buildPath;
}

/**
 * Returns and Object describing what to compile and what need to be returned.
 */
function createConfiguration() {
  return {
    language: 'Solidity',
    sources: {
      'SistemaClinico.sol': {
        content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'SistemaClinico.sol'), 'utf8')
      }
/*      'CitizensLibrary.sol': {
        content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'CitizensLibrary.sol'), 'utf8')
      },
      'DiagnosisLibrary.sol': {q
        content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'DiagnosisLibrary.sol'), 'utf8')
      },
      'ProfessionalsLibrary.sol': {
        content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'ProfessionalsLibrary.sol'), 'utf8')
      },
      'PublicHealthCare.sol': {
        content: fs.readFileSync(path.resolve(__dirname, 'contracts', 'PublicHealthCare.sol'), 'utf8')
      } */
    },
    settings: {
      outputSelection: { // return everything
        '*': {
            '*': ['*']
        }
      }
  }
  };
}

/**
 * Searches for dependencies in the Solidity files (import statements). All import Solidity files
 * need to be declared here.
 * @param dependency
 * @returns {*}
 */
function getImports(dependency) {
  console.log('Searching for dependency: ', dependency);
  switch (dependency) {
    case 'SistemaClinico.sol':
      return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'SistemaClinico.sol'), 'utf8')};
/*    case 'CitizensLibrary.sol':
      return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'CitizensLibrary.sol'), 'utf8')};
    case 'DiagnosisLibrary.sol':
      return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'DiagnosisLibrary.sol'), 'utf8')};
    case 'ProfessionalsLibrary.sol':
      return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'ProfessionalsLibrary.sol'), 'utf8')};
*/      
    default:
        return {error: 'File not found'}
  }
}

/**
 * Compiles the sources, defined in the config object with solc-js.
 * @param config - Configuration object.
 * @returns {any} - Object with compiled sources and errors object.
 */
function compileSources(config) {
  try {
    return JSON.parse(solc.compile(JSON.stringify(config), getImports));
  } catch (e) {
    console.log('-------------error-------------')
    console.log(e);
    console.log('-------------error-------------')
  }
}

/**
 * Shows when there were errors during compilation.
 * @param compiledSources
 */
function errorHandling(compiledSources) {
  if (!compiledSources) {
    console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n', 'NO OUTPUT');
  } else if (compiledSources.errors) { // something went wrong.
    console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n');
    compiledSources.errors.map(error => console.log(error.formattedMessage));
  }
}

/**
 * Writes the contracts from the compiled sources into JSON files, which you will later be able to
 * use in combination with web3.
 * @param compiled - Object containing the compiled contracts.
 * @param buildPath - Path of the build folder.
 */
function writeOutput(compiled, buildPath) {
  fs.ensureDirSync(buildPath);

  for (let contractFileName in compiled.contracts) {
    const contractName = contractFileName.replace('.sol', '');
    console.log('Writing: ', contractName + '.json');
    fs.outputJsonSync(
      path.resolve(buildPath, contractName + '.json'),
      compiled.contracts[contractFileName][contractName]
    );
  }
}


const buildPath = compilingPreperations();
const config = createConfiguration();
const compiled = compileSources(config);


errorHandling(compiled);
//console.log("pasa compile.js", compiled);
//console.log("pasa compile.js",  buildPath);
writeOutput(compiled, buildPath);
//console.log("pasa compile.js ya escrito",  buildPath);
const smartContracts = compiled.contracts;

module.exports = smartContracts;
