/**
 * 저장소. Firebase 환경 변수가 있으면 Firestore, 없으면 서버 메모리를 쓴다.
 * 서버(API 라우트)에서만 import 한다.
 *
 * FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (서비스 계정 키)
 */

export type Collection = "questions" | "reports" | "applications";

type Doc = Record<string, unknown>;

interface Store {
  list<T extends Doc>(col: Collection): Promise<T[]>;
  get<T extends Doc>(col: Collection, id: string): Promise<T | null>;
  put<T extends Doc>(col: Collection, id: string, doc: T): Promise<void>;
}

export function firebaseEnabled(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __giDb?: Record<string, Map<string, Doc>> };
  const data = (g.__giDb ??= {});
  const col = (c: Collection) => (data[c] ??= new Map());
  return {
    async list<T extends Doc>(c: Collection) {
      return [...col(c).values()] as T[];
    },
    async get<T extends Doc>(c: Collection, id: string) {
      return ((col(c).get(id) as T | undefined) ?? null) as T | null;
    },
    async put<T extends Doc>(c: Collection, id: string, doc: T) {
      col(c).set(id, doc);
    },
  };
}

async function firestoreStore(): Promise<Store> {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel 환경 변수에는 줄바꿈이 \n 문자열로 들어간다.
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
  const fs = getFirestore(app);
  return {
    async list<T extends Doc>(c: Collection) {
      const snap = await fs.collection(c).get();
      return snap.docs.map((d) => d.data() as T);
    },
    async get<T extends Doc>(c: Collection, id: string) {
      const d = await fs.collection(c).doc(id).get();
      return d.exists ? (d.data() as T) : null;
    },
    async put<T extends Doc>(c: Collection, id: string, doc: T) {
      // Firestore는 undefined 값을 받지 않으므로 JSON으로 한 번 정리한다.
      await fs.collection(c).doc(id).set(JSON.parse(JSON.stringify(doc)));
    },
  };
}

let storePromise: Promise<Store> | null = null;

export function db(): Promise<Store> {
  storePromise ??= firebaseEnabled()
    ? firestoreStore().catch((e) => {
        console.error("[db] Firestore init failed, using memory:", e instanceof Error ? e.message : e);
        return memoryStore();
      })
    : Promise.resolve(memoryStore());
  return storePromise;
}

export function storageMode(): "firestore" | "memory" {
  return firebaseEnabled() ? "firestore" : "memory";
}
