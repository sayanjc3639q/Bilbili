import { adminAuth } from "./admin";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "bilbili_session";
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60; // 5 days

export interface SessionVerificationResult {
  isValid: boolean;
  uid?: string;
  email?: string;
  isAdmin: boolean;
  error?: string;
}

/**
 * Creates an httpOnly Firebase Admin session cookie from an ID token.
 * Validates that the user has the custom claim `admin === true`.
 */
export async function createAdminSessionCookie(idToken: string): Promise<string> {
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  
  if (decodedToken.admin !== true) {
    throw new Error("Access denied: You do not have administrator privileges.");
  }

  const expiresIn = SESSION_MAX_AGE_SECONDS * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  return sessionCookie;
}

/**
 * Verifies the httpOnly session cookie and confirms the admin claim.
 */
export async function verifyAdminSession(
  sessionCookie?: string
): Promise<SessionVerificationResult> {
  if (!sessionCookie) {
    return { isValid: false, isAdmin: false, error: "No session cookie found" };
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedClaims.admin === true) {
      return {
        isValid: true,
        isAdmin: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      };
    }
    return {
      isValid: false,
      isAdmin: false,
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      error: "User lacks admin claim",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify session cookie";
    return { isValid: false, isAdmin: false, error: message };
  }
}
