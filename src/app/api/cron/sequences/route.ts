import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { logMessageDelivery, sendMetaMessage, upsertConversationThreadMessages } from "@/lib/meta";

type SequenceStepRow = {
  id: string;
  sequence_id: string;
  message: string;
  delay_days: number;
  delay_hours: number;
  step_order: number;
};

function addStepDelay(date: Date, step: SequenceStepRow) {
  const next = new Date(date);
  next.setHours(next.getHours() + Number(step.delay_hours || 0) + Number(step.delay_days || 0) * 24);
  return next;
}

async function handleCron(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && !isVercelCron) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const enrollments = await sql`
    SELECT
      se.id,
      se.business_id,
      se.sequence_id,
      se.sender_id,
      se.platform,
      se.enrolled_at,
      se.current_step,
      se.completed,
      pa.page_access_token
    FROM sequence_enrollments se
    JOIN sequences s ON s.id = se.sequence_id
    LEFT JOIN platform_accounts pa
      ON pa.business_id = se.business_id AND pa.platform = se.platform
    WHERE se.completed = false
      AND s.enabled = true
    ORDER BY se.enrolled_at ASC
  `;

  if (!enrollments.length) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  const sequenceIds = Array.from(new Set(enrollments.map((row) => row.sequence_id as string)));
  const stepRows = sequenceIds.length
    ? await sql`
        SELECT id, sequence_id, message, delay_days, delay_hours, step_order
        FROM sequence_steps
        WHERE sequence_id = ANY(${sequenceIds}::uuid[])
        ORDER BY sequence_id ASC, step_order ASC
      `
    : [];

  const stepsBySequence = new Map<string, SequenceStepRow[]>();
  for (const step of stepRows as SequenceStepRow[]) {
    const key = step.sequence_id as string;
    const list = stepsBySequence.get(key) || [];
    list.push(step);
    stepsBySequence.set(key, list);
  }

  let processed = 0;

  for (const enrollment of enrollments as Array<{
    id: string;
    business_id: string;
    sequence_id: string;
    sender_id: string;
    platform: string;
    enrolled_at: string;
    current_step: number;
    completed: boolean;
    page_access_token?: string | null;
  }>) {
    const steps = stepsBySequence.get(enrollment.sequence_id) || [];
    const pageAccessToken = enrollment.page_access_token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (steps.length === 0) {
      await sql`
        UPDATE sequence_enrollments
        SET completed = true
        WHERE id = ${enrollment.id}
      `;
      continue;
    }

    let nextStepNumber = Number(enrollment.current_step || 1);
    let hasChanged = false;
    const enrolledAt = new Date(enrollment.enrolled_at);

    while (true) {
      const nextStep = steps.find((step) => Number(step.step_order) === nextStepNumber);
      if (!nextStep) {
        await sql`
          UPDATE sequence_enrollments
          SET completed = true, current_step = ${nextStepNumber}
          WHERE id = ${enrollment.id}
        `;
        break;
      }

      const dueAt = steps
        .filter((step) => Number(step.step_order) <= nextStepNumber)
        .reduce((acc, step) => addStepDelay(acc, step), new Date(enrolledAt));

      if (dueAt > now) {
        if (hasChanged) {
          await sql`
            UPDATE sequence_enrollments
            SET current_step = ${nextStepNumber}
            WHERE id = ${enrollment.id}
          `;
        }
        break;
      }

      if (!pageAccessToken) {
        break;
      }

      try {
        await sendMetaMessage({
          recipientId: enrollment.sender_id,
          text: nextStep.message as string,
          pageAccessToken,
        });
        await logMessageDelivery({
          businessId: enrollment.business_id,
          platform: enrollment.platform,
        });
        await upsertConversationThreadMessages({
          businessId: enrollment.business_id,
          platform: enrollment.platform,
          senderId: enrollment.sender_id,
          messages: [{ role: "assistant", content: nextStep.message as string }],
        });
      } catch (err) {
        console.error("[cron/sequences] send failed:", err);
        break;
      }

      nextStepNumber += 1;
      hasChanged = true;
      processed += 1;

      if (nextStepNumber > steps.length) {
        await sql`
          UPDATE sequence_enrollments
          SET completed = true, current_step = ${nextStepNumber}
          WHERE id = ${enrollment.id}
        `;
        break;
      }
    }
  }

  return NextResponse.json({ success: true, processed });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
