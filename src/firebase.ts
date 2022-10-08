import { applicationDefault, cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

const FIREBASE_DB = 'https://faktoro-7469a-default-rtdb.firebaseio.com/'
const FIREBASE_PROJECT_ID = 'faktoro-7469a'

initializeApp({
  credential: getFirebaseAdminCreds(),
  databaseURL: FIREBASE_DB,
  projectId: FIREBASE_PROJECT_ID,
})

export function getFirebaseAdminCreds() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`Using local credentials`)
      const serviceAccount = require('../config/serviceAccountKey.json')
      return cert(serviceAccount)
    } catch (error) {
      console.error(
        'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error,
      )
    }
  } else {
    try {
      return applicationDefault()
    } catch (error) {
      console.error('Error: Could not retrieve default app creds', error)
    }
  }
}

const database = getDatabase()

export function getFirebaseDatabase() {
  return database
}

export async function readFromFirebase(path: string): Promise<any> {
  return new Promise((resolve, reject) =>
    database
      .ref(path)
      .once('value', (snapshot) => resolve(snapshot.val()), reject),
  )
}

export async function appendToListInFirebase(
  listPath: string,
  value: any,
): Promise<any> {
  return database.ref(listPath).push(value)
}

export async function updateInFirebase(path: string, value: any): Promise<any> {
  return database.ref(path).update(value)
}

export async function setInFirebase(path: string, value: any): Promise<any> {
  return database.ref(path).set(value)
}

export async function validateIdToken(idToken: string) {
  try {
    const auth = getAuth()
    const claims = await auth.verifyIdToken(idToken)
    // Explicit boolean check just in case, since the claim can technically be anything,
    // not just boolean values.
    return claims.productAdmin === true
  } catch (error) {
    console.error(`Error verifying id token ${idToken}`, error)
    return false
  }
}
