import { Request, Response } from "@google-cloud/functions-framework";
import { postRequest } from "./cors";
import z from 'zod'
import { readFromFirebase } from './firebase';


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

export const checkRegistration = postRequest(async (req: Request, res: Response) => {
    const { address } = (await requestSchema.parseAsync(req)).body
    const currentSecret = await readFromFirebase(`/secrets/${address}`)

    const wallets = await readFromFirebase(`/wallets/${address}`) ?? []

    if (currentSecret) {
        res.status(200).send({registered: true, wallets})
        return
    } else {
        res.status(200).send({registered: false})
        return
    }
    
})
