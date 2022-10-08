import { Request, Response } from "@google-cloud/functions-framework";
import { postRequest } from "./cors";
import z from 'zod'
import { readFromFirebase } from "./firebase";
import { authenticator } from 'otplib';
import { hashAndSignWithPrivateKey } from "./crypto";

const requestSchema = z.object({
    method: z.custom((arg) => arg === 'POST', 'only POST requests are allowed'),
    headers: z.object({
      'content-type': z.custom(
        (arg) => arg === 'application/json',
        'only application/json requests are allowed',
      ),
    }),
    body: z.object({
      transaction: z.string({ required_error: 'transaction is required' }),
      twoFactorCode: z.string({ required_error: 'twoFactorCode is required' }),
      address: z.string({ required_error: 'address is required' }),
    }),
  })

export const signTransaction = postRequest(async (req: Request, res: Response) => {

    const parsedRequest = await requestSchema.parseAsync(req)

    const { transaction, twoFactorCode, address } = parsedRequest.body

    const currentSecret = await readFromFirebase(`/secrets/${address}`)

    if (!currentSecret) {
      res.status(400).send({errorMessage: 'No 2fa found for this address'})
      return
    }

    const verify = authenticator.verify({ token: twoFactorCode, secret: currentSecret })
    if (!verify) {
      res.status(403).send({errorMessage: 'Invalid 2fa code'})
      return
    }

    const signature = hashAndSignWithPrivateKey(transaction)

    res.status(200).send({signature})
})