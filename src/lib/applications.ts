import { randomUUID } from "node:crypto";
import { db } from "./db";

/**
 * 멘토 서포터즈 신청·승인.
 * 만 19~34세 청년이면 누구나 신청할 수 있고(대학생에 한정하지 않음), 관리기관이 증빙을 검토해 승인해야 답변할 수 있다.
 * 데모에서는 증명서 파일 자체를 저장하지 않고 파일 이름·크기만 기록한다 (인증 없는 데모에서 실제 증명서가 노출되지 않도록).
 */

import { YOUTH_AGE, type Application, type ApplicationView } from "./applicationShared";

export { APPLICANT_STATUS_LABEL, YOUTH_AGE } from "./applicationShared";
export type { ApplicantStatus, Application, ApplicationView, ReviewState } from "./applicationShared";

export function ageOf(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

const view = ({ token: _t, ...rest }: Application): ApplicationView => rest;

async function store() {
  const s = await db();
  const g = globalThis as unknown as { __giAppSeeded?: boolean };
  if (!g.__giAppSeeded) {
    const existing = await s.list<Application>("applications");
    if (!existing.length) {
      const seedApp: Application = {
        id: "seed-app-1",
        token: randomUUID(),
        name: "이서연",
        nickname: "멘토 서연",
        birthYear: 2001,
        status: "undergrad",
        field: "일본어·일본학",
        languages: "JLPT N1",
        experience: "오사카 교환학생 1년",
        country: "JP",
        certificate: { fileName: "재학증명서.pdf", size: 182_000, type: "application/pdf" },
        createdAt: new Date(Date.now() - 6 * 3_600_000).toISOString(),
        review: { state: "pending" },
        answered: 0,
      };
      await s.put("applications", seedApp.id, seedApp);
    }
    g.__giAppSeeded = true;
  }
  return s;
}

export type ApplyInput = Omit<Application, "id" | "token" | "createdAt" | "review" | "answered">;

export function validateApplication(input: ApplyInput): string | null {
  if (!input.name.trim() || !input.nickname.trim()) return "이름과 활동명을 적어 주세요.";
  const age = ageOf(input.birthYear);
  if (!Number.isInteger(input.birthYear) || age < YOUTH_AGE.min || age > YOUTH_AGE.max) return `만 ${YOUTH_AGE.min}~${YOUTH_AGE.max}세 청년만 신청할 수 있어요.`;
  if (!input.field.trim()) return "전공이나 관련 분야를 적어 주세요.";
  if (!input.certificate?.fileName) return "재학·졸업증명서 등 증빙 파일을 첨부해 주세요.";
  if (input.certificate.size > 5_000_000) return "증빙 파일은 5MB 이하로 올려 주세요.";
  return null;
}

export async function apply(input: ApplyInput): Promise<Application> {
  const s = await store();
  const app: Application = { ...input, id: randomUUID().slice(0, 8), token: randomUUID(), createdAt: new Date().toISOString(), review: { state: "pending" }, answered: 0 };
  await s.put("applications", app.id, app);
  return app;
}

/** 신청자 본인 확인 (id + token) */
export async function getOwn(id: string, token: string): Promise<ApplicationView | null> {
  const s = await store();
  const app = await s.get<Application>("applications", id);
  return app && app.token === token ? view(app) : null;
}

/** 답변 권한: 승인된 신청자만 */
export async function approvedMentor(id: string, token: string): Promise<Application | null> {
  const s = await store();
  const app = await s.get<Application>("applications", id);
  return app && app.token === token && app.review.state === "approved" ? app : null;
}

export async function countAnswer(app: Application) {
  const s = await store();
  await s.put("applications", app.id, { ...app, answered: app.answered + 1 });
}

export async function listApplications(): Promise<ApplicationView[]> {
  const s = await store();
  return (await s.list<Application>("applications")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(view);
}

export async function decide(id: string, state: "approved" | "rejected", by: string, reason?: string): Promise<ApplicationView | null> {
  const s = await store();
  const app = await s.get<Application>("applications", id);
  if (!app) return null;
  app.review = { state, reason: state === "rejected" ? reason || "증빙을 다시 확인해 주세요." : undefined, at: new Date().toISOString(), by };
  await s.put("applications", app.id, app);
  return view(app);
}
