import PublicService from '../core/PublicService';
import Web3Service from './Web3Service';
import contracts from '../../contracts/contracts';
import tokens from '../../contracts/tokens';
import networks from '../../contracts/networks';
import { Contract } from 'ethers';

export default class SmartContractService extends PublicService {

  static buildTestService(web3 = null) {
    const service = new SmartContractService();
    web3 = web3 || Web3Service.buildTestService('0x474beb999fed1b3af2ea048f963833c686a0fba05f5724cb6417cf3b8ee9697e');

    service.manager()
      .inject('log', web3.get('log'))
      .inject('web3', web3);

    //console.log('web3 is: ', web3);
    return service;
  }

  constructor(name = 'smartContract') {
    super(name, ['web3', 'log']);
  }

  getContractByAddressAndAbi(address, abi) {
    if (!address) {
      throw Error('Contract address is required');
    }

    let createdContract = new Contract(address, abi, this.get('web3').ethersSigner());
    return createdContract;

  }

  getContractByName(name, version = null) {
    if (Object.keys(contracts).indexOf(name) < 0 && Object.keys(tokens).indexOf(name) < 0) {
      throw new Error('Provided name "' + name + '" is not a contract');
    }

    const contractInfo = this._selectContractVersion(this._getCurrentNetworkMapping(name), version);

    if (contractInfo === null) {
      throw new Error('Cannot find version ' + version + ' of contract ' + name);
    }

    return this.getContractByAddressAndAbi(contractInfo.address, contractInfo.abi);
  }

  stringToBytes32(text) {
    const ethersUtils = this.get('web3').ethersUtils(); 
    var data = ethersUtils.toUtf8Bytes(text);
    console.log('utf8 ', data);
    if (data.length > 32) { throw new Error('too long'); }
    data = ethersUtils.padZeros(data, 32);
    console.log('padded32zeroes ', data);
    return ethersUtils.hexlify(data);
    console.log('hexlified ', data)
  }

  _selectContractVersion(mapping, version) {
    if (version === null) {
      version = Math.max(...mapping.map(info => info.version));
    }

    let result = null;
    mapping.forEach(info => {
      if (info.version === version) {
        result = info;
      }
    });

    return result;
  }

  _getCurrentNetworkMapping(contractName) {
    const networkId = this.get('web3').networkId(),
      mapping = networks.filter((m)=> m.networkId === networkId);

    if (mapping.length < 1) {
      /* istanbul ignore next */
      throw new Error('Network ID ' + networkId + ' not found in mapping.');
    }

    if (typeof mapping[0].addresses[contractName] === 'undefined') {
      /* istanbul ignore next */
      throw new Error('Contract ' + contractName + ' not found in mapping of network with ID ' + networkId);
    }

    return mapping[0].addresses[contractName];
  }

}
