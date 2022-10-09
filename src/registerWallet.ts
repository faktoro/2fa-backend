import { Request, Response } from "@google-cloud/functions-framework";
import { postRequest } from "./cors";
import z from 'zod'
import { readFromFirebase, setInFirebase } from './firebase';
import { createWeb3 } from "./crypto";
// import { createWeb3, getAddressFromSignedMessage } from './crypto';
// import twoFactorAuthAbi from '../abis/TwoFactorAuthWallet.json'

const requestSchema = z.object({
    method: z.custom((arg) => arg === 'POST', 'only POST requests are allowed'),
    headers: z.object({
      'content-type': z.custom(
        (arg) => arg === 'application/json',
        'only application/json requests are allowed',
      ),
    }),
    body: z.object({
      address: z.string({ required_error: 'address is required' }),
      walletAddress: z.string({ required_error: 'walletAddress is required' }),
      chainId: z.string({ required_error: 'chainId is required' }),
    }),
  })

export const registerWallet = postRequest(async (req: Request, res: Response) => {

    const { address, walletAddress, chainId } = (await requestSchema.parseAsync(req)).body

    const web3 = createWeb3(chainId)
    // @ts-ignore
    const twoFactorAuthWalletContract = new web3.eth.Contract(twoFactorAuthAbi.abi, walletAddress)
    const owner = await twoFactorAuthWalletContract.methods.owner().call()

    if (address != owner) {
      res.status(400).send({errorMessage: 'Wallet owner is different than given address'})
      return
    }

    const wallets = await readFromFirebase(`/wallets/${address}`) ?? []
    if (wallets.find((wallet: any) => wallet.chainId === chainId && wallet.walletAddress === walletAddress)) {
      res.status(200).send({status: 'wallet_already_created'})
      return
    }

    await setInFirebase(`/wallets/${address}/${wallets.length}`, {chainId, walletAddress})
    res.status(200).send({status: 'wallet_created'})
})