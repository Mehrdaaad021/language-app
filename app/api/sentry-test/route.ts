import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Sentry production test — این خطا عمدی است!");
}