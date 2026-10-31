import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Global-In — 해외 정착 내비게이션",
    short_name: "Global-In",
    description: "서명하기 전에, 한 번 찍어보세요. 해외로 나가는 청년을 위한 AI 정착 내비게이션.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ko",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
