import { NextResponse } from "next/server";
import { notifyNewUser } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (email) await notifyNewUser(email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
