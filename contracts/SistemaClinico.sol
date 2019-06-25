pragma solidity ^0.5.2;

contract Proxy {

    address private manager;
    address private SistemaClinicoAddr;

    modifier OnlyMan() {
        require(manager == msg.sender, "Operacion solo del manager.");
        _;
    }
    event envdireccion(address, address);
    event Prueba(string str, address _addr1, address _addr2);
    
    constructor() public {
        manager = msg.sender;
    }
    // se enlaza contrato proxy con sistema clinico
    function newSistema(address _SistemaClinicoAddr, string memory _descripcion) public OnlyMan() payable {
        SistemaClinicoAddr = _SistemaClinicoAddr;
        SistemaClinicoInterface(SistemaClinicoAddr).setValues(manager, _descripcion);
    }
    // se actualiza el address del sistema clinico del proxy
    function setFactoryAddr(address _sistemaAddr) public  OnlyMan() {
        SistemaClinicoAddr = _sistemaAddr;
    }
    function getFactoryAddr() public view OnlyMan() returns(address) {
        return(SistemaClinicoAddr);
    }
    function getmanager() public view OnlyMan() returns(address){
        return manager;
    }
}

contract SistemaClinicoInterface {
    function setValues(address _manager, string memory _descripcion) public;
    function newCentroMedico(address _walletCentro, string memory _NombreCentro, address _newAddrCentro) public;    
    function newMedico(address _walletMedico, address _walletCentro, string memory _nombre, address _newAddrMedico) public;
    function newPaciente(address _wllPac, address _walletMedico, string memory _nombre, address _newAddrPaciente) public;
    function getDescripcion() public view returns(string memory);
    function setDescripcion(string memory) public;
    function getManager() public view returns(address);
    function getWalletCttCentro(address _walletCentro) public view returns(address);
    function getWalletCttMedico(address _walletMedico) public view returns(address);
    function esMedico(address _addrMedico) public view returns(bool);
    function getWalletCttPaciente(address _wllPac) public view returns(address);
    function cambioMedicoToCentro( address _walletCentroDest, address _walletMedico, address _walletMedicoHeredaPacientes) public;
}

contract SistemaClinico {
    address private manager;
    string private descripcion;
    string private direccion;

    uint private numCentros=0;

    enum Estados {vivo,muerto,desaparecido}
    Estados estado;

    mapping(address => address) private WalletCttCentro;
    mapping(address => address) private WalletCttMedico;
    mapping(address => address) private WalletCttPaciente;
    
    
    mapping(address => bool) private CentrosMedicos;
    address[] private addrCentros;
    
    event eventoAddr(string, address, address);
    //event eventonum(string, int);
    
    
    modifier ValOnlyMan() {
        //emit eventoAddr("pasa ", manager, msg.sender);
        require(manager == msg.sender, "Operacion solo del manager.");
        _;
    }
    modifier ValEsCentro(address _walletCentro) {
        //emit eventoAddr("validamos el centro", _walletCentro);
        require(esCentro(_walletCentro), "El centro no existe.");
        //esCentro(_walletCentro);
        
        _;
    }
    modifier ValNoEsCentro(address _walletCentro) {
        //emit eventoAddr("validamos el centro", _walletCentro);
        require(noEsCentro(_walletCentro), "El centro ya existe.");
        //esCentro(_walletCentro);
        
        _;
    }
    modifier ValEsMedico(address _walletMedico) {
        require(esMedico(_walletMedico), "Wallet de médico no existe");
        _;
    }
    modifier ValNoEsMedico(address _walletMedico) {
        require(!esMedico(_walletMedico), "Wallet de médico ya existe");
        _;
    }
    modifier ValEsPaciente(address _wllPac) {
        require(esPaciente(_wllPac),"Wallet de paciente no existe.");
        _;
    }
    modifier ValNoEsPaciente(address _wllPac) {
        require(!esPaciente(_wllPac),"Wallet de paciente existe.");
        _;
    }
    event dispSddr(string, address);
    event eventEstados(uint e);
    constructor() public payable{
        numCentros = 0;
    }
    function setValues(address _manager, string memory _descripcion) public {
        manager = _manager;
        descripcion = _descripcion;
    }
    //
    // se enlaza contrato sistema clinico con Centro medico
    function newCentroMedico(address _walletCentro, string memory _NombreCentro, address _newAddrCentro) public ValOnlyMan() ValNoEsCentro(_walletCentro) {
        numCentros++;
        CentrosMedicos[_newAddrCentro] = true;
        addrCentros.push(_newAddrCentro);
        setWalletCttCentro(_walletCentro, _newAddrCentro);
        CentroMedicoInterface(_newAddrCentro).setValues(manager, _walletCentro, _NombreCentro,address(this),numCentros);
    }
    //
    // se enlaza contrato Centro medico con medico
    function newMedico(address _walletMedico, address _walletCentro, string memory _nombre, address _newAddrMedico) public ValOnlyMan() ValNoEsMedico(_walletMedico) {
        address centroMedico = getWalletCttCentro(_walletCentro); 
        CentroMedicoInterface(centroMedico).addNumMedicos();
        CentroMedicoInterface(centroMedico).asociarMedico(_newAddrMedico);
        setWalletCttMedico(_walletMedico, _newAddrMedico);
        MedicoInterface(_newAddrMedico).setValues(manager, _walletMedico, _nombre,address(this),centroMedico,CentroMedicoInterface(centroMedico).getNumMedicos());
    }
    //
    // se enlaza contrato medico con paciente
    function newPaciente(address _wllPac, address _walletMedico, string memory _nombre, address _newAddrPaciente) public ValOnlyMan() ValNoEsPaciente(_wllPac) {
        address medico = getWalletCttMedico(_walletMedico); 
        MedicoInterface(medico).addNumPacientes();
        MedicoInterface(medico).asociarPaciente(_newAddrPaciente);
        setWalletCttPaciente(_wllPac,_newAddrPaciente);
        PacienteInterface(_newAddrPaciente).setValues(manager, _wllPac, _nombre, address(this), MedicoInterface(medico).getCentro() , medico, MedicoInterface(medico).getNumPacientes(), uint(Estados.vivo) );
    }
    function getDescripcion() public view returns(string memory){
        return(descripcion);
    }
    function setDescripcion(string memory _descripcion) public{
        descripcion = _descripcion;
    }
    function getManager() public view returns(address) {
        return(manager);
    }
    //
    // se obtiene la direccion del contrato centro medico a partir de la direccion del wallet
    function getWalletCttCentro(address _walletCentro) public view returns(address) {
        return(WalletCttCentro[_walletCentro]);
    }
    //
    // se almacena la direccion del contrato centro medico con la direccion del wallet como indice
    function setWalletCttCentro(address _walletCentro, address _cttCentro) private ValNoEsCentro(_walletCentro) {
        WalletCttCentro[_walletCentro] = _cttCentro;
    }
    function esCentro(address _addrCentro) private view returns(bool) {
        return(getWalletCttCentro(_addrCentro) != address(0));
    }
    function noEsCentro(address _addrCentro) private view returns(bool) {
        return(getWalletCttCentro(_addrCentro) == address(0));
    }
    //
    // se obtiene la direccion del contrato medico a partir de la direccion del wallet
    function getWalletCttMedico(address _walletMedico) public view returns(address) {
        return(WalletCttMedico[_walletMedico]);
    }
    //
    // se almacena la direccion del contrato medico con la direccion del wallet como indice
    function setWalletCttMedico(address _walletMedico, address _cttMedico) private {
        require(!esMedico(_walletMedico), "Operación solo realizable a wallet de medicos");
        WalletCttMedico[_walletMedico] = _cttMedico;
    }
    function esMedico(address _addrMedico) public view returns(bool) {
        return(getWalletCttMedico(_addrMedico) != address(0));
    }
    //
    // se obtiene la direccion del contrato paciente a partir de la direccion del wallet
    function getWalletCttPaciente(address _wllPac) public view returns(address) {
        return(WalletCttPaciente[_wllPac]);
    }
    //
    // se almacena la direccion del contrato paciente con la direccion del wallet como indice
    function setWalletCttPaciente(address _walletPaciente, address _cttPaciente) private ValNoEsPaciente(_walletPaciente){
        WalletCttPaciente[_walletPaciente] = _cttPaciente;
    }
    function esPaciente(address _addrPaciente) private view returns(bool) {
        return(getWalletCttPaciente(_addrPaciente) != address(0));
    }
    //
    // se realiza el cambio de centro de un medico. Para eso hay que informar del médico que se queda con sus pacientes (_walletMedicoHeredaPacientes)
    function cambioMedicoToCentro( address _walletCentroDest, address _walletMedico, address _walletMedicoHeredaPacientes) public {
        address centroOri = MedicoInterface(getWalletCttMedico(_walletMedico)).getCentro();
        address centroDest = getWalletCttCentro(_walletCentroDest);
        address medicoIni = getWalletCttMedico(_walletMedico);
        address medicoFin = getWalletCttMedico(_walletMedicoHeredaPacientes);
        // recorremos todos los pacientes del medico origen       
        for (int n = (int(MedicoInterface(medicoIni).getNumPacientes()) - 1); n >= 0; n-- ) {
            // cada peciente lo asociamos al medico que hereda
            MedicoInterface(medicoFin).asociarPaciente(MedicoInterface(medicoIni).getaddrPacientes(uint(n)));
            MedicoInterface(medicoFin).addNumPacientes();
            // cambiamos al nuevo medico de cabecera para el paciente cambiado
            PacienteInterface(PacienteInterface(MedicoInterface(medicoFin).getaddrPacientes(MedicoInterface(medicoFin).getNumPacientes()-1))).setMedicoCabecera(medicoFin);
            // cada peciente lo desvinculamos del medico origen
            MedicoInterface(medicoIni).desvincularPaciente(MedicoInterface(medicoIni).getaddrPacientes(uint(n)));
            // descontamos numero de pacientes origen
            MedicoInterface(medicoIni).subNumPacientes();
        }
        // ya están migrados todos los pacientes del medico que se cambia de centro al que los hereda.
        // cambiamos al medico de centro
        CentroMedicoInterface(centroOri).desvincularMedico(medicoIni);
        CentroMedicoInterface(centroOri).subNumMedicos();
        CentroMedicoInterface(centroDest).asociarMedico(medicoIni);
        CentroMedicoInterface(centroDest).addNumMedicos();
    }
}


contract CentroMedicoInterface {
    function setValues(address _manager, address _walletCentro, string memory _nombre, address _sc, uint _secCentro) public;
    function getNombre() public view returns(string memory);
    function setNombre(string memory _nombre) public;
    function addNumMedicos() public;
    function subNumMedicos() public;
    function getNumMedicos() public view returns(uint _n);
    function asociarMedico(address _addrMedico) public;
    function desvincularMedico(address _addrMedico) public;
    function EliminaRegMedico(uint indice) public;
    function LocalizaRegMedico(address _addrMedico) public view returns(uint);
    function altatDiagnostico (address _walletMedico, address _walletPaciente, uint _fecha, string memory _diagnostico, string memory _tratamiento, uint _duracion) public;
}

contract CentroMedico {
    address private manager; 
    address private sistemaClinicoAddr;
    address private addrCentro;
    string private nombre;
    uint private secCentro;
    uint numMedicos=0;
    
    mapping(address => bool) private Medicos;
    address[] private addrMedicos;
    
    event eventodireccion(string cad ,address sender);
    constructor() public {
        numMedicos=0;
        //emit direccion(msg.sender);
    }
    function setValues(address _manager, address _walletCentro, string memory _nombre, address _sc, uint _secCentro) public {
        manager = _manager;
        addrCentro = _walletCentro;
        sistemaClinicoAddr = _sc;
        nombre = _nombre;
        secCentro = _secCentro;
    }    
    function getNombre() public view returns(string memory) {
        return(nombre);
    } 
    function setNombre(string memory _nombre) public {
        nombre = _nombre;
    } 
    function addNumMedicos() public {
        numMedicos++;
    }
    function subNumMedicos() public {
        numMedicos--;
    }
    function getNumMedicos() public view returns(uint _n) {
        return(numMedicos);
    }
    function asociarMedico(address _addrMedico) public { 
        Medicos[_addrMedico] = true;
        addrMedicos.push(_addrMedico);
    }
    
    function desvincularMedico(address _addrMedico) public {
        Medicos[_addrMedico] = false;
        EliminaRegMedico(LocalizaRegMedico(_addrMedico));
    }
    function EliminaRegMedico(uint indice) public {
        require(indice < addrMedicos.length, "indice supera el numero de medicos.");
        addrMedicos[indice] = addrMedicos[addrMedicos.length-1];
        delete addrMedicos[addrMedicos.length-1];
        addrMedicos.length--;
    }
    function LocalizaRegMedico(address _addrMedico) public view returns(uint) {
        for (uint i = 0; i < addrMedicos.length; i++){
            if (address(addrMedicos[i]) == address(_addrMedico)){
                return(i); 
            }
        }
    }
    function altatDiagnostico (address _walletMedico, address _walletPaciente, uint _fecha, string memory _diagnostico, string memory _tratamiento, uint _duracion) public {
        require(SistemaClinicoInterface(sistemaClinicoAddr).esMedico(_walletMedico), "Solo un médico puede introducir diagnósticos");
        require(_walletMedico != _walletPaciente, "Un medico no puede diagnosticarse a si mismo.");
/*        require(sistemaClinico.esPaciente(_walletPaciente), "La clave del wallet  no corresponde a ningun paciente");
        //Eventoestadoq(_walletMedico, address(_walletPaciente));
        require (uint(sistemaClinico.getEstadosKey("vivo")) == sistemaClinico.getWalletCttPaciente(_walletPaciente).getEstado(),"No se puede operar con historiales de personas muertas o desaparecidas."); 
*/        
        address paciente = SistemaClinicoInterface(sistemaClinicoAddr).getWalletCttPaciente(_walletPaciente);
        PacienteInterface(paciente).altatDiagnostico(_fecha, _diagnostico, _tratamiento, _duracion);
    }
}


contract MedicoInterface {
    function setValues(address _manager, address _addrMedico, string memory _nombre, address _sistemaClinico, address _centroMedico, uint _secMedico) public;
    function getNombre() public view returns (string memory);
    function setNombre(string memory _nombre) public;
    function getCentro() public view returns(address c);
    function getaddrPacientes(uint n) public  returns(address);
    function addNumPacientes() public;
    function subNumPacientes() public;
    function getNumPacientes() public view returns(uint _n);
    function asociarPaciente(address _addrPaciente) public;
    function desvincularPaciente(address _addrPaciente) public;
    function EliminaRegPaciente(uint indice) private;
    function LocalizaRegPaciente(address _addrPaciente) private view returns(uint);
    function altatDiagnostico (address _walletPaciente, uint _fecha, string memory _diagnostico, string memory _tratamiento, uint _duracion) public;
}

contract Medico {
    address private manager; 
    address private addrMedico;  
    address private sistemaClinicoAddr;
    address private centroMedicoAddr;
    string private nombre;
    uint private secMedico;
    uint numPacientes = 0;
    
    mapping(address => bool) private Pacientes;
    address[] private addrPacientes;
    
    event eventDir(string,address); 
    
    constructor() public {
        numPacientes = 0;
    }
    function setValues(address _manager, address _addrMedico, string memory _nombre, address _sistemaClinico, address _centroMedico, uint _secMedico) public {
        manager = _manager;
        addrMedico = _addrMedico;
        sistemaClinicoAddr = _sistemaClinico;
        centroMedicoAddr = _centroMedico;
        nombre = _nombre;
        secMedico = _secMedico;
        sistemaClinicoAddr = _sistemaClinico;
    }
    function getNombre() public view returns (string memory) {
        return(nombre);
    }
    function setNombre(string memory _nombre) public {
        nombre = _nombre;
    }
    function getCentro() public view returns(address c){    
        return(centroMedicoAddr);
    }
    function getaddrPacientes(uint n) public view returns(address){    
        return(addrPacientes[n]);
    }
    function addNumPacientes() public {
        numPacientes++;
    }
    function subNumPacientes() public {
        numPacientes--;
    }    
    function getNumPacientes() public view returns(uint _n) {
        return(numPacientes);
    }
    function asociarPaciente(address _addrPaciente) public {
        Pacientes[_addrPaciente] = true;
        addrPacientes.push(_addrPaciente);
    }

    function desvincularPaciente(address _addrPaciente) public {
        Pacientes[_addrPaciente] = false;
        EliminaRegPaciente(LocalizaRegPaciente(_addrPaciente));
    }
    function EliminaRegPaciente(uint indice) private {
        require(indice < addrPacientes.length, "indice supera el numero de pacientes.");
        addrPacientes[indice] = addrPacientes[addrPacientes.length-1];
        delete addrPacientes[addrPacientes.length-1];
        addrPacientes.length--;
    }
    function LocalizaRegPaciente(address _addrPaciente) private view returns(uint) {
        for (uint i = 0; i < addrPacientes.length; i++){
            if (address(addrPacientes[i]) == address(_addrPaciente)){
                return(i); 
            }
        }
    }

    function altatDiagnostico (address _walletPaciente, uint _fecha, string memory _diagnostico, string memory _tratamiento, uint _duracion) public {
        CentroMedicoInterface(centroMedicoAddr).altatDiagnostico(addrMedico, _walletPaciente, _fecha, _diagnostico, _tratamiento, _duracion);
    }
}
 
contract PacienteInterface{
    function setValues(address _manager, address _addrPaciente, string memory _nombre, address _sistemaClinico, address _centroMedico, address _medico, uint _secPaciente, uint _estado) public;
    function altatDiagnostico (uint _fecha, string memory _sintomas, string memory _tratamiento, uint _duracion) public;
    function getNombre() public view returns (string memory);
    function setNombre(string memory _nombre) public;
    function getEstado() view public returns(uint);
    function setEstado(uint _val) private;
    function getMedicoCabecera() public returns(address);
    function setMedicoCabecera(address _med) public;
    function getDiagnostico(uint numD) public view returns(uint, string memory, string memory, uint);
}

contract Paciente {
    address public manager; 
    address public addrPaciente;
    address public sistemaClinicoAddr;
    address public centroMedicoAddr;
    address public medicoAddr;
    string public nombre;
    uint public secPaciente;
    uint public estado;
    uint private numDiagnosticos = 0;
    
    struct Diagnostico {
        uint fecha;
        string sintomas;
        string tratamiento;
        uint duracion;
    }

    Diagnostico[] public Historial;
    
    event eventoDiagnostico(uint);
    constructor() public {
        numDiagnosticos = 0;
    }
    function setValues(address _manager, address _addrPaciente, string memory _nombre, address _sistemaClinico, address _centroMedico, address _medico, uint _secPaciente, uint _estado) public {
        manager = _manager;
        addrPaciente = _addrPaciente;
        medicoAddr = _medico;
        nombre = _nombre;
        sistemaClinicoAddr = _sistemaClinico;
        centroMedicoAddr = _centroMedico;
        secPaciente = _secPaciente;
        estado = _estado;
    }
    function altatDiagnostico (uint _fecha, string memory _sintomas, string memory _tratamiento, uint _duracion) public {
        Diagnostico memory diagnostico = Diagnostico ({ 
            fecha: _fecha,  
            sintomas: _sintomas,
            tratamiento: _tratamiento,
            duracion: _duracion
        });
        Historial.push(diagnostico);
        numDiagnosticos++;
    }
    function getNombre() public view returns (string memory) {
        return(nombre);
    }
    function setNombre(string memory _nombre) public {
        nombre = _nombre;
    }
    function getEstado() view public returns(uint){
        return(estado);
    }
    function setEstado(uint _val) private{
        estado = _val;
    }
    function getMedicoCabecera() public view returns(address){
        return(medicoAddr);
    }
    function setMedicoCabecera(address _med) public{
        medicoAddr = _med;
    }
    function getDiagnostico(uint numD) public view returns(uint, string memory, string memory, uint) {
        require(numD <= numDiagnosticos-1, "Diagnostico no existe.");
        return(Historial[numD].fecha, Historial[numD].sintomas, Historial[numD].tratamiento, Historial[numD].duracion);
    }
    function getNumDiagnosticos() public view returns(uint) {
        return(numDiagnosticos);
    }
}