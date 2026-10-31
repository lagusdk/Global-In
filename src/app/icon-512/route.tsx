import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brandIcon";

/** 웹 앱 매니페스트용 512px PNG 아이콘 (Android 홈 화면 · 설치 화면) */
export function GET() {
  // eslint-disable-next-line @next/next/no-img-element
  // 기기가 모서리를 직접 깎으므로 사각 배경으로 꽉 채운다.
  return new ImageResponse(<img src={brandIconDataUri(0)} width={512} height={512} alt="" />, { width: 512, height: 512 });
}
