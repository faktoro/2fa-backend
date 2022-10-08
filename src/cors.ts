import * as functions from "firebase-functions";

export function postRequest(
  functionRunner: (
    req: functions.Request,
    resp: functions.Response
  ) => void | Promise<void>
) {
  return functions.https.onRequest(async (req, res) => {

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT");
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With,observe"
    );

    if (req.method == "OPTIONS") {
      functions.logger.info("Handling Method OPTIONS");
      res.status(200).end();
      return;
    }

    if (req.method !== "POST") {
      // Return a "method not allowed" error
      res.status(405).send("Only POST method is allowed");
      return;
    }

    try {
      await functionRunner(req, res);
    } catch (error: any) {
      console.error(error)
      res.status(400).send(error.message)
    }
  });
}
