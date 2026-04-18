import { sql } from "@/lib/db";
import { sendMetaMessage } from "@/lib/meta";
import { createInvoice } from "@/lib/qpay";

interface FlowNode {
  id: string;
  type: string;
  data: {
    title: string;
    body: string;
    actionType?: "add_tag" | "enroll_sequence";
    actionValue?: string;
    paymentAmount?: number;
    paymentDescription?: string;
  };
}

interface FlowEdge {
  source: string;
  target: string;
}

/**
 * Run a flow for a given contact. Starts from the first node after any Trigger node,
 * or from a specific startNodeId.
 * Returns the node ID where execution paused (if any).
 */
export async function runFlow({
  businessId,
  flowId,
  senderId,
  platform,
  pageAccessToken,
  startNodeId,
}: {
  businessId: string;
  flowId: string;
  senderId: string;
  platform: string;
  pageAccessToken?: string;
  startNodeId?: string;
}): Promise<{ paused: boolean; pausedAt?: string; reason?: string }> {
  const flowRows = await sql`SELECT nodes, edges FROM flows WHERE id = ${flowId} AND business_id = ${businessId} LIMIT 1`;
  if (!flowRows[0]) return { paused: false };

  const nodes = flowRows[0].nodes as FlowNode[];
  const edges = flowRows[0].edges as FlowEdge[];

  // Build adjacency: node id → next node id
  const nextMap: Record<string, string> = {};
  for (const edge of edges) nextMap[edge.source] = edge.target;

  // Find starting node
  let currentId = startNodeId;
  if (!currentId) {
    const triggerNode = nodes.find((n) => n.data.title.toLowerCase() === "trigger");
    currentId = triggerNode ? (nextMap[triggerNode.id] ?? nodes[0]?.id) : nodes[0]?.id;
  }

  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const node = nodes.find((n) => n.id === currentId);
    if (!node) break;

    const titleLower = node.data.title.toLowerCase();

    if (titleLower === "message" && pageAccessToken) {
      await sendMetaMessage({ recipientId: senderId, text: node.data.body, pageAccessToken });
    }

    if (titleLower === "action" || titleLower === "qpay payment") {
      if (titleLower === "qpay payment") {
        // Create QPay invoice and pause flow
        const amount = node.data.paymentAmount ?? 0;
        if (amount > 0) {
          try {
            const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            const invoice = await createInvoice({
              amount,
              description: node.data.paymentDescription || "Payment",
              callbackUrl: `${appUrl}/api/qpay/callback`,
              senderInvoiceNo: `FLOW-${Date.now()}`,
            });
            const invoiceId = (invoice as { invoice_id?: string }).invoice_id ?? "";

            // Store execution state
            await sql`
              INSERT INTO flow_executions (business_id, flow_id, sender_id, platform, current_node_id, status, qpay_invoice_id, state)
              VALUES (${businessId}, ${flowId}, ${senderId}, ${platform}, ${currentId}, 'waiting_payment', ${invoiceId}, ${JSON.stringify({ resumeNodeId: nextMap[currentId] ?? null })})
              ON CONFLICT DO NOTHING
            `;

            // Send invoice link to user
            const qpayLink = (invoice as { urls?: Array<{ name: string; description: string; logo: string; link: string }> }).urls?.[0]?.link ?? "";
            if (pageAccessToken && qpayLink) {
              await sendMetaMessage({
                recipientId: senderId,
                text: `${node.data.paymentDescription || "Payment required"}: ${qpayLink}`,
                pageAccessToken,
              });
            }

            return { paused: true, pausedAt: currentId, reason: "waiting_payment" };
          } catch (err) {
            console.error("[flow-runner] QPay node error:", err);
          }
        }
      } else if (node.data.actionType === "add_tag" && node.data.actionValue) {
        await sql`
          UPDATE conversation_threads
          SET messages = messages || ${JSON.stringify([{ role: "system", content: `tag:${node.data.actionValue}` }])}
          WHERE business_id = ${businessId} AND sender_id = ${senderId} AND platform = ${platform}
        `.catch(() => null);
      } else if (node.data.actionType === "enroll_sequence" && node.data.actionValue) {
        await sql`
          INSERT INTO sequence_enrollments (business_id, sequence_id, sender_id, platform, enrolled_at, current_step, completed)
          VALUES (${businessId}, ${node.data.actionValue}, ${senderId}, ${platform}, NOW(), 1, false)
          ON CONFLICT (business_id, sequence_id, sender_id, platform)
          DO UPDATE SET enrolled_at = NOW(), current_step = 1, completed = false
        `.catch(() => null);
      }
    }

    currentId = nextMap[currentId];
  }

  return { paused: false };
}

/**
 * Resume a flow execution after payment is confirmed.
 */
export async function resumeFlowAfterPayment(qpayInvoiceId: string): Promise<void> {
  const execs = await sql`
    SELECT id, business_id, flow_id, sender_id, platform, state
    FROM flow_executions
    WHERE qpay_invoice_id = ${qpayInvoiceId} AND status = 'waiting_payment'
    LIMIT 1
  `;
  if (!execs[0]) return;

  const exec = execs[0];
  const state = exec.state as { resumeNodeId?: string };

  if (state.resumeNodeId) {
    const accounts = await sql`
      SELECT page_access_token FROM platform_accounts
      WHERE business_id = ${exec.business_id as string}
      LIMIT 1
    `;
    const pageAccessToken = accounts[0]?.page_access_token as string | undefined;

    await runFlow({
      businessId: exec.business_id as string,
      flowId: exec.flow_id as string,
      senderId: exec.sender_id as string,
      platform: exec.platform as string,
      pageAccessToken,
      startNodeId: state.resumeNodeId,
    });
  }

  await sql`UPDATE flow_executions SET status = 'completed', updated_at = NOW() WHERE id = ${exec.id as string}`;
}
