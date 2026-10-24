// Seed script to initialize educational topics, subtopics, meta/topicTree, and sample blogs
// Usage: node scripts/seed-data.js

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

// Load .env
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

const db = getFirestore(app);

const topicsData = [
  {
    id: "electrical-engineering",
    name: "Electrical Engineering",
    slug: "electrical-engineering",
    parentId: null,
    level: 0,
    ancestors: [],
    blogCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "eeFT01",
    name: "Electric Field Theory",
    slug: "electric-field-theory",
    parentId: "electrical-engineering",
    level: 1,
    ancestors: ["electrical-engineering"],
    blogCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "eeCE02",
    name: "Current Electricity",
    slug: "current-electricity",
    parentId: "eeFT01",
    level: 2,
    ancestors: ["electrical-engineering", "eeFT01"],
    blogCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "computer-science",
    name: "Computer Science",
    slug: "computer-science",
    parentId: null,
    level: 0,
    ancestors: [],
    blogCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "csAL02",
    name: "Algorithms and Complexity",
    slug: "algorithms-and-complexity",
    parentId: "computer-science",
    level: 1,
    ancestors: ["computer-science"],
    blogCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const blogsData = [
  {
    id: "electric-current-and-drift-velocity",
    title: "Electric Current and Drift Velocity",
    slug: "electric-current-and-drift-velocity",
    subtopicId: "eeCE02",
    topicPath: ["electrical-engineering", "eeFT01", "eeCE02"],
    status: "published",
    keywords: ["current", "drift velocity", "electrons", "charge", "conductivity"],
    excerpt:
      "A comprehensive physical and mathematical derivation of charge carrier transport, current density, and microscopical Ohm's law in metallic conductors.",
    readingTime: 4,
    tags: ["physics", "electronics", "circuit-theory"],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    acknowledgement:
      "Grateful to the MIT Department of Electrical Engineering lecture notes and open-access materials.",
    references: [
      {
        label: "Introduction to Electrodynamics (David J. Griffiths)",
        url: "https://en.wikipedia.org/wiki/Introduction_to_Electrodynamics",
      },
      {
        label: "The Feynman Lectures on Physics, Vol. II",
        url: "https://www.feynmanlectures.caltech.edu/II_toc.html",
      },
    ],
    blocks: [
      {
        id: "sec_intro",
        type: "subtitle",
        text: "Fundamental Definition of Electric Current",
      },
      {
        id: "p_1",
        type: "paragraph",
        text: "Electric current is fundamentally defined as the net transfer of electrical charge across any cross-sectional boundary of a conducting medium per unit time. When an electric field is applied across a conductor, free electrons undergo collective directional motion superimposed on their random thermal motion.",
      },
      {
        id: "eq_1",
        type: "equation",
        formula: "I = \\frac{dQ}{dt} = n \\cdot q \\cdot A \\cdot v_d",
        isBlock: true,
      },
      {
        id: "callout_1",
        type: "callout",
        kind: "note",
        title: "Microscopic Velocity vs. Signal Velocity",
        text: "The drift velocity of free electrons in a typical copper conductor carries a magnitude on the order of 0.1 mm/s. In contrast, the electromagnetic wave conveying energy through the circuit propagates at a significant fraction of light speed.",
      },
      {
        id: "sec_density",
        type: "subtitle",
        text: "Current Density and Microscopical Ohm's Law",
      },
      {
        id: "p_2",
        type: "paragraph",
        text: "Current density J is a vector field describing both the concentration and orientation of charge flow. Dividing total current by cross-sectional area yields:",
      },
      {
        id: "eq_2",
        type: "equation",
        formula: "\\mathbf{J} = n q \\mathbf{v}_d = \\sigma \\mathbf{E} = \\frac{\\mathbf{E}}{\\rho}",
        isBlock: true,
      },
      {
        id: "table_1",
        type: "table",
        hasHeader: true,
        rows: [
          ["Material", "Conductivity (S/m)", "Resistivity (Ohm-meter)"],
          ["Silver (Ag)", "6.30 x 10^7", "1.59 x 10^-8"],
          ["Copper (Cu)", "5.96 x 10^7", "1.68 x 10^-8"],
          ["Gold (Au)", "4.10 x 10^7", "2.44 x 10^-8"],
          ["Silicon (Intrinsic)", "4.35 x 10^-4", "2.30 x 10^3"],
        ],
      },
      {
        id: "sec_code",
        type: "subtitle",
        text: "Numerical Computation in Python",
      },
      {
        id: "code_1",
        type: "code",
        language: "python",
        filename: "drift_velocity.py",
        code: "def compute_drift_velocity(current: float, area: float, density: float = 8.5e28, charge: float = 1.6e-19) -> float:\n    \"\"\"Calculates electron drift velocity in meters per second.\"\"\"\n    return current / (density * charge * area)\n\n# Example: 2.0 Amperes through 1.5 mm^2 cross-section copper wire\narea_m2 = 1.5e-6\nv_drift = compute_drift_velocity(2.0, area_m2)\nprint(f'Drift Velocity: {v_drift * 1000:.4f} mm/s')\n",
      },
      {
        id: "sec_summary",
        type: "subtitle",
        text: "Key Engineering Principles",
      },
      {
        id: "list_1",
        type: "bullet_list",
        items: [
          "Current is invariant along a series branch satisfying Kirchhoff's Current Law (conservation of charge).",
          "Conductivity sigma depends on temperature according to Matthiessen's rule.",
          "High frequency alternating currents exhibit skin effect, restricting flow to the conductor outer periphery.",
        ],
      },
    ],
  },
  {
    id: "asymptotic-analysis-and-big-o",
    title: "Asymptotic Analysis and Big-O Complexity",
    slug: "asymptotic-analysis-and-big-o",
    subtopicId: "csAL02",
    topicPath: ["computer-science", "csAL02"],
    status: "published",
    keywords: ["big-o", "complexity", "algorithms", "runtime", "asymptotic"],
    excerpt:
      "A rigorous formalization of algorithm growth rates, bounding functions with Big-O, Big-Omega, and Big-Theta notation.",
    readingTime: 5,
    tags: ["computer-science", "algorithms", "discrete-math"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    acknowledgement: "Referenced from Introduction to Algorithms (CLRS) 4th Edition.",
    references: [
      {
        label: "Introduction to Algorithms, 4th Edition (Cormen et al.)",
        url: "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/",
      },
    ],
    blocks: [
      {
        id: "sec_def",
        type: "subtitle",
        text: "Formal Definition of Asymptotic Upper Bound",
      },
      {
        id: "p_cs1",
        type: "paragraph",
        text: "In algorithmic complexity analysis, asymptotic notation characterizes the behavior of an algorithm execution time or memory utilization as the input size n grows arbitrarily large toward infinity.",
      },
      {
        id: "eq_cs1",
        type: "equation",
        formula: "O(g(n)) = \\{ f(n) : \\exists c > 0, n_0 > 0 \\text{ s.t. } 0 \\le f(n) \\le c \\cdot g(n) \\; \\forall n \\ge n_0 \\}",
        isBlock: true,
      },
      {
        id: "callout_cs1",
        type: "callout",
        kind: "warning",
        title: "Upper Bound vs. Tight Bound",
        text: "Big-O represents an asymptotic upper bound, not necessarily a tight bound. An algorithm that runs in O(n) is mathematically also in O(n^2), although Big-Theta provides the strict tight bound.",
      },
      {
        id: "table_cs1",
        type: "table",
        hasHeader: true,
        rows: [
          ["Notation", "Definition", "Intuitive Analogy"],
          ["O(g(n))", "Upper bound (less than or equal)", "<="],
          ["Omega(g(n))", "Lower bound (greater than or equal)", ">="],
          ["Theta(g(n))", "Tight bound (sandwiched asymptotically)", "=="],
          ["o(g(n))", "Strict upper bound", "<"],
        ],
      },
      {
        id: "code_cs1",
        type: "code",
        language: "typescript",
        filename: "binarySearch.ts",
        code: "export function binarySearch(arr: number[], target: number): number {\n  let left = 0;\n  let right = arr.length - 1;\n\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\n// Time Complexity: O(log n)\n// Space Complexity: O(1)\n",
      },
    ],
  },
];

async function seed() {
  console.log("Seeding Bilbili Firestore collections...");

  // 1. Seed Topics and Subtopic IDs
  for (const topic of topicsData) {
    await db.collection("topics").doc(topic.id).set(topic);
    if (topic.level > 0) {
      await db.collection("subtopic_ids").doc(topic.id).set({
        id: topic.id,
        name: topic.name,
        parentId: topic.parentId,
        reservedAt: topic.createdAt,
      });
    }
    console.log(`Topic written: ${topic.name} (${topic.id})`);
  }

  // 2. Build and seed meta/topicTree
  const map = new Map();
  const roots = [];
  topicsData.forEach((t) => map.set(t.id, { ...t, children: [] }));
  topicsData.forEach((t) => {
    const node = map.get(t.id);
    if (!t.parentId || !map.has(t.parentId)) {
      roots.push(node);
    } else {
      map.get(t.parentId).children.push(node);
    }
  });

  await db.collection("meta").doc("topicTree").set({
    roots,
    updatedAt: new Date().toISOString(),
  });
  console.log("meta/topicTree denormalized document generated successfully.");

  // 3. Seed Blogs
  for (const blog of blogsData) {
    await db.collection("blogs").doc(blog.id).set(blog);
    console.log(`Blog written: ${blog.title} (${blog.id})`);
  }

  console.log("Seeding completed successfully.");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
