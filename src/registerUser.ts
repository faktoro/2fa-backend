import { authenticator } from 'otplib';
import { Request, Response } from "@google-cloud/functions-framework";
import { postRequest } from "./cors";
import qrcode from 'qrcode';
import z from 'zod'
import { readFromFirebase, setInFirebase } from './firebase';
import { getAddressFromSignedMessage } from './crypto';

const service = 'Anzen';

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
      signature: z.string({ required_error: 'signature is required' }),
    }),
  })

export const registerUser = postRequest(async (req: Request, res: Response) => {

    const { address, signature } = (await requestSchema.parseAsync(req)).body

    const currentSecret = await readFromFirebase(`/secrets/${address}`)

    const signedMessage = `I want to set up a 2FA-secured wallet on my address ${address}`

    const signerAddress = getAddressFromSignedMessage(signedMessage, signature);

    if (signerAddress !== address) {
      res.status(400).send({errorMessage: 'Invalid signature'})
      return
    }

    if (currentSecret) {
      res.status(400).send({errorMessage: '2fa already created for this address'})
      return
    }

    const secret = authenticator.generateSecret()

    await setInFirebase(`/pendingSecrets/${address}`, secret)

    const qrUri = authenticator.keyuri(address, service, secret);

    const qrImage = await getQRCode(qrUri)

    res.status(200).send({ qrUri, qrImage })
})

async function getQRCode(otpauth: string) {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(otpauth, (err, imageUrl) => {
            if (err) {
                reject('Error with QR')
            }
            resolve(imageUrl);
        });
    });
}