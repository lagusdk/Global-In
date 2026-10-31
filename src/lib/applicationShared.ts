import type { Country } from "./types";

/** 서포터즈 신청서 타입·상수. 화면(클라이언트)과 서버가 함께 쓰므로 서버 전용 코드를 import 하지 않는다. */

export type ApplicantStatus = "undergrad" | "grad" | "graduate" | "worker" | "other";

export const APPLICANT_STATUS_LABEL: Record<ApplicantStatus, string> = {
  undergrad: "대학(원) 재학",
  grad: "대학원 재학",
  graduate: "졸업",
  worker: "직장인",
  other: "구직·기타",
};

export type ReviewState = "pending" | "approved" | "rejected";

export type Application = {
  id: string;
  token: string;
  name: string;
  nickname: string;
  birthYear: number;
  status: ApplicantStatus;
  field: string;
  languages: string;
  experience?: string;
  country: Country;
  certificate: { fileName: string; size: number; type: string };
  createdAt: string;
  review: { state: ReviewState; reason?: string; at?: string; by?: string };
  answered: number;
};

/** 공개해도 되는 범위 (신청자 본인·관리기관 화면) */
export type ApplicationView = Omit<Application, "token">;

export const YOUTH_AGE = { min: 19, max: 34 };
