import Web3 from 'web3'
import { PRIVATE_KEY } from './consts'
import { ethers } from 'ethers'

const RPC_URL = 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'

let _web3: Web3

export function getWeb3() {
    if (!_web3) {
        _web3 = createWeb3()
    }
    return _web3
}

function createWeb3() {
    const web3Provider = new Web3.providers.HttpProvider(RPC_URL)
    return new Web3(web3Provider)
}

export function hashAndSignWithPrivateKey(message: string) {
    const web3 = getWeb3()
    const hashedMessage = ethers.utils.keccak256(message);
    return web3.eth.accounts.sign(hashedMessage, PRIVATE_KEY)
}