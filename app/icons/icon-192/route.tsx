import { ImageResponse } from "next/og";
import { PwaIconArt } from "@/lib/pwa-icon-art";

export const runtime = "edge";

const SIZE = 192;

export async function GET() {
  return new ImageResponse(<PwaIconArt size={SIZE} />, {
    width: SIZE,
    height: SIZE,
  });
}
