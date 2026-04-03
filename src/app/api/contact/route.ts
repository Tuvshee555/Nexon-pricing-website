import { NextResponse } from "next/server";
import type { ContactApiResponse } from "@/lib/contact";
import { sanitizeContactPayload, validateContactPayload } from "@/lib/contact";
import { notifyContactForm } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const sanitized = sanitizeContactPayload({
      name: typeof body.name === "string" ? body.name : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      email: typeof body.email === "string" ? body.email : "",
      message: typeof body.message === "string" ? body.message : "",
      website: typeof body.website === "string" ? body.website : "",
    });

    if (sanitized.website) {
      return NextResponse.json<ContactApiResponse>({ success: true });
    }

    const validation = validateContactPayload(sanitized);
    if (validation.firstErrorCode) {
      return NextResponse.json<ContactApiResponse>(
        { success: false, errorCode: validation.firstErrorCode },
        { status: 400 }
      );
    }

    await notifyContactForm(
      sanitized.name,
      sanitized.phone || "—",
      sanitized.email,
      sanitized.message
    );

    return NextResponse.json<ContactApiResponse>({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json<ContactApiResponse>(
      { success: false, errorCode: "SEND_FAILED" },
      { status: 500 }
    );
  }
}
