import { sql } from "@/lib/db";
import { createHmac } from "crypto";

export type WebhookEvent =
  | "new_contact"
  | "message_received"
  | "payment_received"
  | "conversation_escalated"
  | "broadcast_sent";

export async function fireWebhooks(
  businessId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const endpoints = await sql`
      SELECT id, url, secret
      FROM webhook_endpoints
      WHERE business_id = ${businessId}
        AND enabled = true
        AND ${event} = ANY(events)
    `;

    if (endpoints.length === 0) return;

    const body = JSON.stringify({
      event,
      business_id: businessId,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    await Promise.allSettled(
      endpoints.map(async (ep) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Nexon-Event": event,
        };
        if (ep.secret) {
          const sig = createHmac("sha256", ep.secret as string).update(body).digest("hex");
          headers["X-Nexon-Signature"] = `sha256=${sig}`;
        }
        await fetch(ep.url as string, { method: "POST", headers, body });
      })
    );
  } catch {
    // Webhooks are non-critical — never block main flow
  }
}
