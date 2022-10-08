import Web3 from 'web3'

export async function createNewAccount() {
    const RPC_URL = 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'

    var web3Provider = new Web3.providers.HttpProvider(RPC_URL)
    const web3 = new Web3(web3Provider)

    const account = web3.eth.accounts.create();
    console.log(JSON.stringify(account))
}

createNewAccount().finally()