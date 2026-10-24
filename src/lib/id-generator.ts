import type { Firestore, Transaction } from "firebase-admin/firestore";

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 6;

/**
 * Generates a random 6-character alphanumeric string using crypto.getRandomValues.
 * Charset: 0-9, A-Z, a-z (62 chars). 62^6 = 56,800,235,584 possible unique IDs.
 */
export function generateRaw6CharId(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    id += CHARS[bytes[i] % CHARS.length];
  }
  return id;
}

/**
 * Transactionally generates and claims a guaranteed-unique 6-character ID in Firestore.
 * Ensures two concurrent creations can never clash.
 *
 * @param db - Firebase Admin Firestore instance
 * @param metadata - Optional metadata (such as topicId or topicName) stored with the reservation
 */
export async function generateUniqueSubtopicId(
  db: Firestore,
  metadata?: { name?: string; parentId?: string | null }
): Promise<string> {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateId = generateRaw6CharId();
    try {
      const isUnique = await db.runTransaction(async (transaction: Transaction) => {
        const idRef = db.collection("subtopic_ids").doc(candidateId);
        const doc = await transaction.get(idRef);
        if (doc.exists) {
          return false; // Collision detected, retry
        }
        transaction.set(idRef, {
          id: candidateId,
          reservedAt: new Date().toISOString(),
          ...metadata,
        });
        return true;
      });

      if (isUnique) {
        return candidateId;
      }
    } catch {
      // Transaction failed or collided, try again
      continue;
    }
  }

  throw new Error("Failed to generate a unique subtopic ID after multiple attempts.");
}
