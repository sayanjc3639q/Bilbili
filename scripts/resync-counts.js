const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(".env");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const eq = line.indexOf("=");
  if (eq > 0) {
    let k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    v = v.replace(/\\n/g, "\n");
    process.env[k] = v;
  }
});

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);

function buildTreeFromFlatList(topics) {
  const map = new Map();
  const roots = [];

  for (const t of topics) {
    map.set(t.id, { ...t, children: [] });
  }

  for (const t of topics) {
    const node = map.get(t.id);
    if (!t.parentId || !map.has(t.parentId)) {
      roots.push(node);
    } else {
      map.get(t.parentId).children.push(node);
    }
  }

  return roots;
}

async function resync() {
  console.log("Recalculating blog counts for all topics...");
  const topicsSnap = await db.collection("topics").get();
  const allTopics = [];

  for (const tDoc of topicsSnap.docs) {
    const tData = tDoc.data();
    const countSnap = await db
      .collection("blogs")
      .where("topicPath", "array-contains", tDoc.id)
      .where("status", "==", "published")
      .count()
      .get();

    const actualCount = countSnap.data().count;
    await tDoc.ref.update({
      blogCount: actualCount,
      updatedAt: new Date().toISOString(),
    });

    allTopics.push({
      ...tData,
      id: tDoc.id,
      blogCount: actualCount,
    });
    console.log(`Topic ${tData.name} (${tDoc.id}): ${actualCount} published blogs.`);
  }

  const tree = buildTreeFromFlatList(allTopics);
  await db.collection("meta").doc("topicTree").set({
    roots: tree,
    updatedAt: new Date().toISOString(),
  });

  console.log("meta/topicTree updated successfully with exact counts.");
}

resync().catch(console.error);
