import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brandIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone 홈 화면 아이콘 (PNG) */
export default function AppleIcon() {
  // eslint-disable-next-line @next/next/no-img-element
  return new ImageResponse(<img src={brandIconDataUri(0)} width={180} height={180} alt="" />, size);
}
