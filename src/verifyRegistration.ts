import { authenticator } from 'otplib';
import { Request, Response } from "@google-cloud/functions-framework";
import { postRequest } from "./cors";
import z from 'zod'
import { readFromFirebase, setInFirebase } from './firebase';

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
      twoFactorCode: z.string({ required_error: 'twoFactorCode is required' }),
    }),
  })

export const verifyRegistration = postRequest(async (req: Request, res: Response) => {

  const parsedRequest = await requestSchema.parseAsync(req)

    const { twoFactorCode, address } = parsedRequest.body

    const currentSecret = await readFromFirebase(`/secrets/${address}`)

    if (currentSecret) {
      res.status(400).send({errorMessage: '2fa already created for this address'})
      return
    }

    const currentPendingSecret = await readFromFirebase(`/pendingSecrets/${address}`)    

    if (!currentPendingSecret) {
      res.status(400).send({errorMessage: 'Call /registerUser to start the 2fa registration'})
      return
    }

    const verify = authenticator.verify({ token: twoFactorCode, secret: currentPendingSecret })
    if (!verify) {
      res.status(403).send({errorMessage: 'Invalid 2fa code'})
      return
    }

    await setInFirebase(`/secrets/${address}`, currentPendingSecret)

    res.status(200).send({status: 'registration_completed'})
})
