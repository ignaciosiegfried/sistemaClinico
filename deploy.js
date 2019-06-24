const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const ganache = require("ganache-cli");
const { interface, bytecode } = require('./compile');

console.log('Pasa 1');
const provider = new HDWalletProvider( 
   'rather flag mixture bitter symbol bracket wash kite odor spike object brass',
   "rinkeby.infura.io/v3/d1c66a88232341bc92fee5e8e2f792f3"
);
console.log('Pasa 2');
const web3 = new Web3();
web3.setProvider(provider);
console.log('Pasa 3');
const deploy = async () => {
  console.log('Pasa 4');
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode, arguments: ['Hi there!'] })
    .send({ gas: '4000000', gasPrice: '30000000000' , from: accounts[0] });

  console.log('Contract deployed to', result.options.address);
};

deploy()
.then(() => console.log('Success'))
.catch(err => console.log('Script failed:', err));