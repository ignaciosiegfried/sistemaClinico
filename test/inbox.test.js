const HDWalletProvider = require('truffle-hdwallet-provider');
const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');
const assert = require('assert');
const ganache = require("ganache-cli");
const Web3 = require('web3');
const web3 = new Web3();

//const options = { gasLimit: 99999999999999 };
const options =   { gasLimit: 99999999999999 };
const provider = ganache.provider(options);
//const provider = ganache.provider();

web3.setProvider(provider);

const smartContracts = require('../compile');


const abiProxy = smartContracts['SistemaClinico.sol']['Proxy'].abi;
const byteProxy = smartContracts['SistemaClinico.sol']['Proxy'].evm.bytecode.object;
const abiSistema = smartContracts['SistemaClinico.sol']['SistemaClinico'].abi;
const byteSistema = smartContracts['SistemaClinico.sol']['SistemaClinico'].evm.bytecode.object;
const abiCentro = smartContracts['SistemaClinico.sol']['CentroMedico'].abi;
const byteCentro = smartContracts['SistemaClinico.sol']['CentroMedico'].evm.bytecode.object;
const abiMedico = smartContracts['SistemaClinico.sol']['Medico'].abi;
const byteMedico = smartContracts['SistemaClinico.sol']['Medico'].evm.bytecode.object;
const abiPaciente = smartContracts['SistemaClinico.sol']['Paciente'].abi;
const bytePaciente = smartContracts['SistemaClinico.sol']['Paciente'].evm.bytecode.object;

//console.log("pasa" ,contractsMap);

let accounts;
let proxy, sistema, centro, medico, paciente;
let sistemaNuevo
let balance
beforeEach(async () => {
  // Get a list of all accounts

  accounts = await web3.eth.getAccounts();
  //console.log("pasa accounts :\n" ,accounts);
  // Use one of those accounts to deploy
  // the contract
  proxy = await new web3.eth.Contract(abiProxy)
    .deploy({
      data: byteProxy,
      arguments: []
    })
    .send({ from: accounts[0], gas: '10000000'});
//console.log("Pasa  \n", interface_abi);
  sistema = await new web3.eth.Contract(abiSistema)
    .deploy({
      data: byteSistema,
      arguments: []
    })
    .send({ from: accounts[0], gas: '10000000' });
  centro = await new web3.eth.Contract(abiCentro)
    .deploy({
      data: byteCentro,
      arguments: []
    })
    .send({ from: accounts[1], gas: '10000000' });
  medico = await new web3.eth.Contract(abiMedico)
    .deploy({
      data: byteMedico,
      arguments: []
    })
    .send({ from: accounts[0], gas: '100000000'});
  paciente = await new web3.eth.Contract(abiPaciente)
    .deploy({
      data: bytePaciente,
      arguments: []
    })
    .send({ from: accounts[0], gas: '100000000' });
    
//console.log("Pasa  fin \n");
});

describe('sistema', () => {
  //
  // DEPLOYs
  //
  it('deploys contract Proxy', () => {
    assert.ok(proxy.options.address);
  });
  it('deploys contract SistemaClinico', () => {
    assert.ok(sistema.options.address);
  });
  it('deploys contract CentroMedico', () => {
    assert.ok(centro.options.address);
  });
  it('deploys contract Medico', () => {
    assert.ok(medico.options.address);
  });
  it('deploys contract Proxy', () => {
    assert.ok(paciente.options.address);
  });
  //
  // PROXY
  //
  it('getmanager', async () => {
    const ProxyPrueba = await new web3.eth.Contract(abiProxy)
    .deploy({
      data: byteProxy,
      arguments: []
    })
    .send({ from: accounts[0], gas: '1000000000' });
    const addr = await proxy.methods.getmanager().call();
    assert.equal(accounts[0], addr);
  });
  it('setFactoryAddr y getFactoryAddr. Actualizar y obtener address sistema Clinico', async () => {
    sistemaNuevo = await new web3.eth.Contract(abiSistema)
    .deploy({
      data: byteSistema,
      arguments: []
    })
    .send({ from: accounts[0], gas: '1000000000' });
    await proxy.methods.setFactoryAddr(sistemaNuevo.options.address).send({ from: accounts[0] });
    const addr = await proxy.methods.getFactoryAddr().call();
    assert.equal(sistemaNuevo.options.address, addr);
  });
  it('newSistema. Asociar sistema clinico al proxy', async () => {
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] });
    const message =  await sistema.methods.getDescripcion().call();
    assert.equal(message, 'Sistema 1');
  });
  it('newSistema Solo manager', async () => {
    let saltaAvisoOk;
    try{
      await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[1] });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
  });
  it('setFactoryAddr Solo manager', async () => {
    let saltaAvisoOk;
    try{
      await proxy.methods.setFactoryAddr(sistema.options.address).send({ from: accounts[1] });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
  });
  it('getFactoryAddr Solo manager', async () => {
    let saltaAvisoOk;
    try{
      await proxy.methods.getFactoryAddr().call({ from: accounts[1] });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
  });
  it('getmanager Solo manager', async () => {
    let saltaAvisoOk;
    try{
      await proxy.methods.getmanager().call({ from: accounts[1] });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
  });
  //
  // SISTEMA CLINICO
  //
  it('newCentroMedico. Incluir centro medico en el sistema clinico', async () => {
    const nombreNewCentro = "Centro 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el cnetro médico
    await sistema.methods.newCentroMedico(accounts[1], nombreNewCentro, centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // obtencion del nombre del centro medico que se ha asociado en la sentencia anterior
    const nomCentro = await centro.methods.getNombre().call();
    assert.equal(nomCentro, nombreNewCentro);
  });
  it('newCentroMedico. Solo manager', async () => {
    let saltaAvisoOk;
    const nombreNewCentro = "Centro 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el cnetro médico
    try{
      // se asocia el sistema clinico con el cnetro médico
      await sistema.methods.newCentroMedico(accounts[1], nombreNewCentro, centro.options.address ).send({ from: accounts[1] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);    
  });
  it('newCentroMedico. Centro medico ya existe', async () => {
    let saltaAvisoOk;
    const nombreNewCentro = "Centro 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el cnetro médico
    await sistema.methods.newCentroMedico(accounts[1], nombreNewCentro, centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    try{
      // se asocia duplicado el sistema clinico con el cnetro médico
      await sistema.methods.newCentroMedico(accounts[1], nombreNewCentro, centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);  
  });
  //
  it('newMedico. Incluir medico en el Centro Medico', async () => {
    const nombreNewMedico = "Medico 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], nombreNewMedico, medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // obtencion del nombre del centro medico que se ha asociado en la sentencia anterior
    const nomMedico = await medico.methods.getNombre().call();

    assert.equal(nomMedico, nombreNewMedico);
  });
  it('newMedico. Solo manager', async () => {
    let saltaAvisoOk;
    const nombreNewMedico = "Medico 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    try{
      // se asocia el sistema clinico con el cnetro médico
      await sistema.methods.newMedico(accounts[2], accounts[1], nombreNewMedico, medico.options.address ).send({ from: accounts[1] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
    
  });
  it('newMedico. Medico ya existe', async () => {
    let saltaAvisoOk;
    const nombreNewMedico = "Medico 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], nombreNewMedico, medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    try{
      // se asocia duplicado el centro medico con el médico
      await sistema.methods.newMedico(accounts[2], accounts[1], nombreNewMedico, medico.options.address ).send({ from: accounts[1] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
  });
  //
  it('newPaciente. Incluir paciente en Medico', async () => {
    const nombreNewPaciente = "Paciente 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico con el paciente
    await sistema.methods.newPaciente(accounts[3], accounts[2], nombreNewPaciente, paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // obtencion del nombre del centro medico que se ha asociado en la sentencia anterior
    const nomPaciente = await paciente.methods.getNombre().call();

    assert.equal(nomPaciente, nombreNewPaciente);
  });
  it('newPaciente. Solo manager', async () => {
    let saltaAvisoOk;
    const nombreNewPaciente = "Paciente 1";
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico con el paciente
    try{
      // se asocia el medico con el paciente
      await sistema.methods.newPaciente(accounts[3], accounts[2], nombreNewPaciente, paciente.options.address ).send({ from: accounts[1] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
    
  });
  it('newPaciente. Paciente ya existe', async () => {
    const nombreNewPaciente = "Paciente 1";
    let saltaAvisoOk;
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico con el paciente
    await sistema.methods.newPaciente(accounts[3], accounts[2], nombreNewPaciente, paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    try{
      // se asocia duplicado el medico con el paciente
      await sistema.methods.newPaciente(accounts[3], accounts[2], nombreNewPaciente, paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);   
  });
  //
  it('setDescripcion y getDescripcion. Cambiar la descripcion del sistema clinico', async () => {
    const newDescripcion = "Sistema clinico cambiado";
    // se llama al metodo de cambio de descripción 
    await sistema.methods.setDescripcion(newDescripcion).send({ from: accounts[0] , gas: '1000000000'});
    // obtencion del nombre del centro medico que se ha asociado en la sentencia anterior
    const descripcion = await sistema.methods.getDescripcion().call();

    assert.equal(descripcion, newDescripcion);
  });
  //
  it('esMedico. indica si una direccion pertenece a un contrato de medico', async () => {
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });  
    // llamada a esMedico con un medico existente    
    const es=(await sistema.methods.esMedico(accounts[2]).call() );
    // llamada a esMedico con un medico inexistente    
    const noEs = !(await sistema.methods.esMedico(accounts[1]).call());
    assert(es && noEs);  
  });
  //
  it('getManager. Recupera la dirección del manager', async () => {
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // llamada a getManager   
    const man=(await sistema.methods.getManager().call());
    assert.equal(accounts[0], man);
  });
  //
  //getWalletCttCentro
  it('getWalletCttCentro. Recupera la dirección del centro partiendo de su wallet', async () => {
    let eaddrCentros;
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // llamada a esMedico con un medico existente    
    const addrCentro=await sistema.methods.getWalletCttCentro(accounts[1]).call() ;
    assert.equal(addrCentro, centro.options.address);
  });
  //
  it('getWalletCttMedico. Recupera la dirección del medico partiendo de su wallet', async () => {
    // se tiene que crear primero la asociacion del proxy con el sistema clinico
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });  
    // llamada a getWalletCttMedico
    const addrMedico =await sistema.methods.getWalletCttMedico(accounts[2]).call() ;
    assert.equal(addrMedico, medico.options.address);
  });
  //
  it('getWalletCttPaciente. Recupera la dirección del paciente partiendo de su wallet', async () => {
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico con el paciente
    await sistema.methods.newPaciente(accounts[3], accounts[2], "Paciente 1", paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    const addrPaciente =await sistema.methods.getWalletCttPaciente(accounts[3]).call() ;
    assert.equal(addrPaciente, paciente.options.address);
  });
  //
  it('altatDiagnostico y getDiagnostico. Se da de alta diagnostico de un paciente por parte del medico', async () => {
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico con el paciente
    await sistema.methods.newPaciente(accounts[3], accounts[2], "Paciente 1", paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // alta de diagnostico del paciente 1 por parte del medico 1
    await medico.methods.altatDiagnostico(accounts[3], 20190620, "sintoma del paciente 1 del dia 20190620", "Esta es la parte del tratamient del paciente", 14 ).send({ from: accounts[0] , gas: '1000000000' });
    
    const NumD = await paciente.methods.getNumDiagnosticos().call();
    const diagnostico = await paciente.methods.getDiagnostico(NumD - 1).call() ;
    //console.log("pasa ", diagnostico[0], " ", diagnostico[1]," ", diagnostico[2], " ", diagnostico[3]);
    //console.log("pasa   ", await paciente.methods.getDiagnostico(NumD - 1).call());
    assert.ok(diagnostico[0] == 20190620 &&  diagnostico[1] == "sintoma del paciente 1 del dia 20190620" && diagnostico[2] == "Esta es la parte del tratamient del paciente" && diagnostico[3] == 14 );
  });
  //
  it('altatDiagnostico. Un medico no puede diagnosticarse a si mismo. medico == paciente', async () => {
    let saltaAvisoOk;
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro medico con el médico
    await sistema.methods.newMedico(accounts[2], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico con el paciente
    await sistema.methods.newPaciente(accounts[2], accounts[2], "Paciente 1", paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    try{
      // alta de diagnostico del paciente ==  medico
      await medico.methods.altatDiagnostico(accounts[2], 20190620, "sintoma del paciente 1 del dia 20190620", "Esta es la parte del tratamient del paciente", 14 ).send({ from: accounts[0] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
  });
  //
  // accounts[0] -> sistema clinico
  // accounts[1] -> Centro 1
  // accounts[2] -> Centro 2
  // accounts[3] -> Medico 1
  // accounts[4] -> Medico 2
  // accounts[5] -> Paciente 1
  // accounts[6] -> Paciente 2
  it('cambioMedicoToCentro. Cambio de medico de un centro a otro', async () => {
    let saltaAvisoOk;
    await proxy.methods.newSistema(sistema.options.address, "Sistema 1").send({ from: accounts[0] , gas: '1000000000'});
    // se asocia el sistema clinico con el centro médico
    await sistema.methods.newCentroMedico(accounts[1], "Centro 1", centro.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se hace el deploy del segundo centro medico
    const centro2 = await new web3.eth.Contract(abiCentro)
    .deploy({
      data: byteCentro,
      arguments: []
    })
    .send({ from: accounts[1], gas: '10000000' });
    
    // se asocia el sistema clinico con el centro2
    await sistema.methods.newCentroMedico(accounts[2], "Centro 2", centro2.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el centro 1 con medico 1 
    await sistema.methods.newMedico(accounts[3], accounts[1], "Medico 1", medico.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se hace el deploy del segundo medico
    const medico2 = await new web3.eth.Contract(abiMedico)
      .deploy({
      data: byteMedico,
      arguments: []
    })
    .send({ from: accounts[0], gas: '100000000'});
    
    // se asocia el centro 1 con medico 2 
    await sistema.methods.newMedico(accounts[4], accounts[1], "Medico 2", medico2.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se asocia el medico 1 con el paciente 1    
    await sistema.methods.newPaciente(accounts[5], accounts[3], "Paciente 1", paciente.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    // se hace el deploy del segundo paciente
    
    const paciente2 = await new web3.eth.Contract(abiPaciente)
    .deploy({
      data: bytePaciente,
      arguments: []
    })
    .send({ from: accounts[0], gas: '100000000'});
    // se asocia el medico 1 con el paciente 2
    await sistema.methods.newPaciente(accounts[6], accounts[3], "Paciente 2", paciente2.options.address ).send({ from: accounts[0] , gas: '1000000000' });
    
    const numMedicosCentro1Ini = await centro.methods.getNumMedicos().call();
    const numPacientesMedico1Ini = await medico.methods.getNumPacientes().call();
    const numMedicosCentro2Ini = await centro2.methods.getNumMedicos().call();
    const numPacientesMedico2Ini = await medico2.methods.getNumPacientes().call();
    

    console.log("numMedicosCentro1Inii= ", numMedicosCentro1Ini)
    console.log("numPacientesMedico1Ini= ", numPacientesMedico1Ini)
    console.log("numMedicosCentro2Inii= ", numMedicosCentro2Ini)
    console.log("numPacientesMedico2Ini= ", numPacientesMedico2Ini)
    // se ejecuta el cambio de medico de centro
    // accounts[0] -> sistema clinico
    // accounts[1] -> Centro 1
    // accounts[2] -> Centro 2
    // accounts[3] -> Medico 1
    // accounts[4] -> Medico 2
    // accounts[5] -> Paciente 1
    // accounts[6] -> Paciente 2
    await sistema.methods.cambioMedicoToCentro(accounts[2], accounts[3], accounts[3]).send({ from: accounts[0] , gas: '1000000000' });
    const numMedicosCentro1Fin = await centro.methods.getNumMedicos().call();
    const numPacientesMedico1Fin = await medico.methods.getNumPacientes().call();
    const numMedicosCentro2Fin = await centro2.methods.getNumMedicos().call();
    const numPacientesMedico2Fin = await medico2.methods.getNumPacientes().call();
    console.log("numMedicosCentro1Fin= ", numMedicosCentro1Fin)
    console.log("numPacientesMedico1Fin= ", numPacientesMedico1Fin)
    console.log("numMedicosCentro2Fin= ", numMedicosCentro2Fin)
    console.log("numPacientesMedico2Fin= ", numPacientesMedico2Fin)

    /*
    try{
      // alta de diagnostico del paciente ==  medico
      await medico.methods.altatDiagnostico(accounts[2], 20190620, "sintoma del paciente 1 del dia 20190620", "Esta es la parte del tratamient del paciente", 14 ).send({ from: accounts[0] , gas: '1000000000' });
      saltaAvisoOk=false;
    }catch(e) {
      saltaAvisoOk=true;
    }
    assert(saltaAvisoOk);
    */
  });
  //
  //
  //
  //
});