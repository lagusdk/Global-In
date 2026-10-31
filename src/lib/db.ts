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

/** 환경 변수에 따옴표가 같이 들어간 경우를 정리한다. */
function unquote(v: string): string {
  const t = v.trim();
  return (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")) ? t.slice(1, -1) : t;
}

/**
 * 서비스 계정 비공개 키를 PEM 형식으로 되돌린다.
 * 복사 과정에서 \n 이 문자열로 남거나, 줄바꿈이 사라져 한 줄(또는 공백)로 붙어도 읽을 수 있게 한다.
 */
export function normalizePrivateKey(raw: string): string {
  const key = unquote(raw).replace(/\\n/g, "\n");
  const m = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/.exec(key);
  if (!m) return key;
  const body = m[2].replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${m[1]}-----\n${lines.join("\n")}\n-----END ${m[1]}-----\n`;
}

async function firestoreStore(): Promise<Store> {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: unquote(process.env.FIREBASE_PROJECT_ID!),
        clientEmail: unquote(process.env.FIREBASE_CLIENT_EMAIL!),
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY!),
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
let firestoreFailed: string | null = null;
let failedAt = 0;
const RETRY_MS = 5 * 60_000;

/**
 * Firestore 호출이 실패하면(데이터베이스 미생성·권한·네트워크) 그 뒤로는 메모리로 넘어간다.
 * 심사 중에 Firebase 문제로 화면이 500 오류를 내지 않게 하려는 것.
 */
function withFallback(primary: Store): Store {
  const memory = memoryStore();
  const run = async <R>(op: (s: Store) => Promise<R>): Promise<R> => {
    // 실패한 뒤 5분이 지나면 Firestore를 다시 시도한다 (데이터베이스를 방금 만든 경우 등).
    if (firestoreFailed && Date.now() - failedAt < RETRY_MS) return op(memory);
    try {
      const result = await op(primary);
      firestoreFailed = null;
      return result;
    } catch (e) {
      firestoreFailed = e instanceof Error ? e.message.slice(0, 160) : String(e);
      failedAt = Date.now();
      console.error("[db] Firestore failed, falling back to memory:", firestoreFailed);
      return op(memory);
    }
  };
  return {
    list: (c) => run((s) => s.list(c)),
    get: (c, id) => run((s) => s.get(c, id)),
    put: (c, id, doc) => run((s) => s.put(c, id, doc)),
  };
}

export function db(): Promise<Store> {
  storePromise ??= firebaseEnabled()
    ? firestoreStore()
        .then(withFallback)
        .catch((e) => {
          firestoreFailed = e instanceof Error ? e.message.slice(0, 160) : String(e);
          console.error("[db] Firestore init failed, using memory:", firestoreFailed);
          return memoryStore();
        })
    : Promise.resolve(memoryStore());
  return storePromise;
}

/** 실제로 쓰는 저장소. Firestore가 실패해 메모리로 넘어갔으면 그 이유도 함께 보여 준다. */
export function storageMode(): "firestore" | "memory" | "memory (firestore 오류)" {
  if (!firebaseEnabled()) return "memory";
  return firestoreFailed ? "memory (firestore 오류)" : "firestore";
}

export function storageError(): string | null {
  return firestoreFailed;
}
