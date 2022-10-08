import { authenticator } from 'otplib';
import { Request, Response } from "@google-cloud/functions-framework";
import { postRequest } from "./cors";
import qrcode from 'qrcode';
import z from 'zod'
import { readFromFirebase, setInFirebase } from './firebase';

const service = 'Faktoro';

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
    }),
  })

export const registerUser = postRequest(async (req: Request, res: Response) => {

    const { address } = (await requestSchema.parseAsync(req)).body

    const currentSecret = await readFromFirebase(`/secrets/${address}`)

    if (currentSecret) {
        res.status(400).send({errorMessage: '2fa already created for this address'})
        return
    }

    const secret = authenticator.generateSecret()

    await setInFirebase(`/secrets/${address}`, secret)

    const otpauth = authenticator.keyuri(address, service, secret);

    const qrCode = await getQRCode(otpauth)

    res.status(200).send({ qrCode })
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