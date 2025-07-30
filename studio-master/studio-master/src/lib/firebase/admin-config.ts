
import * as admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

let app: admin.app.App | null = null;

export async function initAdminApp(): Promise<admin.app.App> {
  if (app) {
    return app;
  }

  const serviceAccountKeyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (process.env.FUNCTIONS_EMULATOR === 'true' || !serviceAccountKeyString) {
    console.log("Initializing Admin SDK for local emulator or without service key.");
    app = admin.apps.length > 0 ? admin.apps[0]! : admin.initializeApp();
    return app;
  }

  const tempFilePath = path.join(os.tmpdir(), 'service-account.json');

  try {
    // The private key from an environment variable often has its newlines escaped.
    // We need to replace `\\n` with `\n` for the crypto library to parse it correctly.
    const serviceAccountJson = JSON.parse(serviceAccountKeyString);
    if (serviceAccountJson.private_key) {
        serviceAccountJson.private_key = serviceAccountJson.private_key.replace(/\\n/g, '\n');
    }
    
    await fs.writeFile(tempFilePath, JSON.stringify(serviceAccountJson));
    
    app = admin.initializeApp({
      credential: admin.credential.cert(tempFilePath),
    });

    return app;

  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK from temporary file.', error);
    throw new Error('Could not initialize Firebase Admin SDK.');
  } finally {
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn(`Failed to clean up temporary service account file: ${tempFilePath}`, cleanupError);
    }
  }
}
