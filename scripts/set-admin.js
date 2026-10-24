// Script to set admin custom claims on a Firebase user account
// Usage: node scripts/set-admin.js <email_or_uid>

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");
const fs = require("fs");

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\n/g, "\n");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in environment variables.");
  console.error("Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.");
  process.exit(1);
}

let app;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

async function setAdminClaim() {
  const target = process.argv[2];
  if (!target) {
    console.error("Please provide a user email or UID.");
    console.error("Usage: node scripts/set-admin.js <user-email-or-uid>");
    process.exit(1);
  }

  try {
    let userRecord;
    if (target.includes("@")) {
      userRecord = await auth.getUserByEmail(target);
    } else {
      userRecord = await auth.getUser(target);
    }

    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Successfully granted admin privileges to user: ${userRecord.email || userRecord.uid}`);
    console.log(`User ID: ${userRecord.uid}`);
    console.log("Custom claims updated: { admin: true }");
    console.log("Note: If the user is currently logged in, they must sign out and sign in again to refresh their token claims.");
  } catch (error) {
    console.error("Error setting admin claim:", error.message);
    process.exit(1);
  }
}

setAdminClaim();
