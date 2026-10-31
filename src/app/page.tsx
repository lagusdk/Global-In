"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getProfile } from "@/lib/store";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getProfile() ? "/home" : "/onboarding");
  }, [router]);
  return <main className="phone" />;
}
