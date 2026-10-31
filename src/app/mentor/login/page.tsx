"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 예전 주소 호환: 서포터즈 신청 화면으로 보낸다. */
export default function MentorLoginRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/mentor/apply"), [router]);
  return <main className="phone" />;
}
