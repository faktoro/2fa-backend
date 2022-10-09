import Web3 from 'web3'
import { PRIVATE_KEY } from './consts'
import { ethers } from 'ethers'
import { chainIdToRpc } from './rpcInfo'

export function createWeb3(chainId?: string) {
    // @ts-ignore
    const rpcUrl = chainIdToRpc[chainId] ?? ''
    const web3Provider = new Web3.providers.HttpProvider(rpcUrl)
    return new Web3(web3Provider)
}

export function hashAndSignWithPrivateKey(message: string) {
    const web3 = createWeb3()
    const hashedMessage = ethers.utils.keccak256(message);
    return web3.eth.accounts.sign(hashedMessage, PRIVATE_KEY)
}

export function getAddressFromSignedMessage(message: string, signature: string) {
    const web3 = createWeb3()
    return web3.eth.accounts.recover(message, signature)
}