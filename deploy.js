const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const ganache = require("ganache-cli");
require('events').EventEmitter.prototype._maxListeners = 1000;
const smartContracts = require('./compile');

const abiProxy     = smartContracts['SistemaClinico.sol']['Proxy'].abi;
const byteProxy    = smartContracts['SistemaClinico.sol']['Proxy'].evm.bytecode.object;
const abiSistema   = smartContracts['SistemaClinico.sol']['SistemaClinico'].abi;
const byteSistema  = smartContracts['SistemaClinico.sol']['SistemaClinico'].evm.bytecode.object;
const abiCentro    = smartContracts['SistemaClinico.sol']['CentroMedico'].abi;
const byteCentro   = smartContracts['SistemaClinico.sol']['CentroMedico'].evm.bytecode.object;
const abiMedico    = smartContracts['SistemaClinico.sol']['Medico'].abi;
const byteMedico   = smartContracts['SistemaClinico.sol']['Medico'].evm.bytecode.object;
const abiPaciente  = smartContracts['SistemaClinico.sol']['Paciente'].abi;
const bytePaciente = smartContracts['SistemaClinico.sol']['Paciente'].evm.bytecode.object;

const web3 = new Web3();
const options = { gasLimit: 99999999999999 };
web3.setProvider(ganache.provider(options));

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log('Attempting to deploy from account', accounts);

  proxy = await new web3.eth.Contract(abiProxy)
      .deploy({
        data: byteProxy,
        arguments: []
    })
    .send({ from: accounts[0], gas: '10000000'});
  console.log('Contract proxy deployed to', proxy.options.address);
  sistema = await new web3.eth.Contract(abiSistema)
    .deploy({
      data: byteSistema,
      arguments: []
  })
  .send({ from: accounts[0], gas: '10000000' });
  console.log('Contract sistema deployed to', sistema.options.address);
  centro = await new web3.eth.Contract(abiCentro)
    .deploy({
      data: byteCentro,
      arguments: []
  })
  .send({ from: accounts[1], gas: '10000000' });
  console.log('Contract centro deployed to', centro.options.address);
  medico = await new web3.eth.Contract(abiMedico)
    .deploy({
      data: byteMedico,
      arguments: []
  })
  .send({ from: accounts[0], gas: '100000000'});
  console.log('Contract medico deployed to', medico.options.address);
  paciente = await new web3.eth.Contract(abiPaciente)
    .deploy({
      data: bytePaciente,
      arguments: []
  })
  .send({ from: accounts[0], gas: '100000000' });
  console.log('Contract paciente deployed to', paciente.options.address);
};

deploy()
.then(() => console.log('Success'))
.catch(err => console.log('Script failed:', err));