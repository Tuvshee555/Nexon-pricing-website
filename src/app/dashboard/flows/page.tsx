"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  ReactFlow,
  Position,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeProps,
} from "@xyflow/react";

interface FlowRecord {
  id: string;
  name: string;
  enabled: boolean;
  created_at?: string;
  nodes: Node[];
  edges: Edge[];
}

interface SequenceOption {
  id: string;
  name: string;
}

type FlowNodeKind = "trigger" | "message" | "condition" | "action";

interface FlowNodeData {
  [key: string]: unknown;
  title: string;
  body: string;
  actionType?: "add_tag" | "enroll_sequence";
  actionValue?: string;
}

interface FlowTemplate {
  name: string;
  description: string;
  triggerBody: string;
  messageBody: string;
  actionBody: string;
  actionType: "add_tag" | "enroll_sequence";
  actionValue?: string;
}

const nodeBase = "rounded-2xl border shadow-sm bg-white min-w-[200px] max-w-[240px] px-4 py-3 text-left";

const starterTemplates: FlowTemplate[] = [
  {
    name: "Welcome flow",
    description: "Greets new leads and sets the tone.",
    triggerBody: "New subscriber or keyword starts the flow",
    messageBody: "Welcome message with next-step guidance",
    actionBody: "Add tag: new-lead",
    actionType: "add_tag",
    actionValue: "new-lead",
  },
  {
    name: "Pricing helper",
    description: "Answers common pricing questions quickly.",
    triggerBody: "Keyword: price, plan, cost",
    messageBody: "Share pricing summary and CTA",
    actionBody: "Enroll sequence: pricing-follow-up",
    actionType: "enroll_sequence",
  },
  {
    name: "Order support",
    description: "Collects details before human handoff.",
    triggerBody: "Keyword: order, delivery, status",
    messageBody: "Gather order context and reassure the user",
    actionBody: "Add tag: support-needed",
    actionType: "add_tag",
    actionValue: "support-needed",
  },
  {
    name: "Saved reply",
    description: "Turns frequent answers into a reusable flow.",
    triggerBody: "FAQ trigger or reply shortcut",
    messageBody: "Send the saved reply instantly",
    actionBody: "Add tag: self-serve",
    actionType: "add_tag",
    actionValue: "self-serve",
  },
];

function FlowNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  const title = data.title || "Node";
  const body = data.body || "";

  return (
    <div
      className={`${nodeBase} ${
        selected ? "border-slate-900 shadow-lg shadow-slate-200" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-900" />
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          {data.actionType ? (
            <span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              {data.actionType === "add_tag" ? "Add tag" : "Enroll sequence"}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap leading-relaxed">{body}</p>
        {data.actionValue ? <p className="text-xs text-slate-500">Value: {data.actionValue}</p> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-slate-900" />
    </div>
  );
}

const nodeTypes = {
  flowNode: FlowNode,
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildStarterFlow(name: string, template?: FlowTemplate): { nodes: Node[]; edges: Edge[] } {
  const triggerId = makeId("trigger");
  const messageId = makeId("message");
  const actionId = makeId("action");

  const triggerBody = template?.triggerBody || "Keyword or event starts the flow";
  const messageBody = template?.messageBody || `Welcome to ${name}`;
  const actionBody = template?.actionBody || "Choose the next action";

  return {
    nodes: [
      {
        id: triggerId,
        type: "flowNode",
        position: { x: 100, y: 120 },
        data: { title: "Trigger", body: triggerBody },
      },
      {
        id: messageId,
        type: "flowNode",
        position: { x: 390, y: 120 },
        data: { title: "Message", body: messageBody },
      },
      {
        id: actionId,
        type: "flowNode",
        position: { x: 680, y: 120 },
        data: {
          title: "Action",
          body: actionBody,
          actionType: template?.actionType || "add_tag",
          actionValue: template?.actionValue || "",
        },
      },
    ],
    edges: [
      {
        id: `${triggerId}-${messageId}`,
        source: triggerId,
        target: messageId,
        type: "smoothstep",
      },
      {
        id: `${messageId}-${actionId}`,
        source: messageId,
        target: actionId,
        type: "smoothstep",
      },
    ],
  };
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [sequences, setSequences] = useState<SequenceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState("");
  const [currentEnabled, setCurrentEnabled] = useState(true);
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newFlowName, setNewFlowName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty">("saved");
  const hydratingRef = useRef(false);

  const selectedFlow = flows.find((flow) => flow.id === selectedFlowId) ?? null;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const [flowsRes, sequencesRes] = await Promise.all([fetch("/api/flows"), fetch("/api/sequences")]);
    const flowsData = await flowsRes.json();
    const sequencesData = await sequencesRes.json();
    setFlows(flowsData.flows || []);
    setSequences((sequencesData.sequences || []).map((sequence: { id: string; name: string }) => ({
      id: sequence.id,
      name: sequence.name,
    })));
    setLoading(false);
    if (!selectedFlowId && flowsData.flows?.[0]?.id) {
      setSelectedFlowId(flowsData.flows[0].id);
    }
  }, [selectedFlowId]);

  const loadFlow = useCallback(async (flowId: string) => {
    hydratingRef.current = true;
    const res = await fetch(`/api/flows?id=${encodeURIComponent(flowId)}`);
    const data = await res.json();
    const flow = data.flow as FlowRecord | null;
    if (!flow) {
      hydratingRef.current = false;
      return;
    }
    setCurrentName(flow.name);
    setCurrentEnabled(flow.enabled);
    setNodes((flow.nodes as Node<FlowNodeData>[]) || []);
    setEdges((flow.edges as Edge[]) || []);
    setSelectedNodeId(null);
    requestAnimationFrame(() => {
      hydratingRef.current = false;
      setSaveStatus("saved");
    });
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!selectedFlowId) {
      setCurrentName("");
      setCurrentEnabled(true);
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      return;
    }
    void loadFlow(selectedFlowId);
  }, [selectedFlowId, loadFlow]);

  const saveFlow = useCallback(async () => {
    if (!selectedFlowId) return;
    setSaveStatus("saving");
    const res = await fetch("/api/flows", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedFlowId,
        name: currentName,
        nodes,
        edges,
        enabled: currentEnabled,
      }),
    });
    const data = await res.json();
    if (data.flow) {
      setFlows((prev) => prev.map((flow) => (flow.id === selectedFlowId ? data.flow : flow)));
      setSaveStatus("saved");
    }
  }, [currentEnabled, currentName, edges, nodes, selectedFlowId]);

  useEffect(() => {
    if (!selectedFlowId || hydratingRef.current) return;
    setSaveStatus("dirty");
    const timer = window.setTimeout(() => {
      void saveFlow();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [saveFlow, selectedFlowId]);

  const createFlow = async (template?: FlowTemplate, customName?: string) => {
    const flowName = (customName || newFlowName || template?.name || "").trim();
    if (!flowName) return;
    const starter = buildStarterFlow(flowName, template);
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: flowName,
        nodes: starter.nodes,
        edges: starter.edges,
        enabled: true,
      }),
    });
    const data = await res.json();
    if (data.flow) {
      setFlows((prev) => [data.flow, ...prev]);
      setSelectedFlowId(data.flow.id);
      setNewFlowName("");
    }
  };

  const updateNodeData = (patch: Partial<FlowNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNodeId) return node;
        return { ...node, data: { ...(node.data as FlowNodeData), ...patch } };
      })
    );
  };

  const addNode = (kind: FlowNodeKind) => {
    const id = makeId(kind);
    const index = nodes.length;
    const basePosition = { x: 100 + (index % 3) * 260, y: 100 + Math.floor(index / 3) * 180 };
    let data: FlowNodeData;

    switch (kind) {
      case "trigger":
        data = { title: "Trigger", body: "Keyword or event starts the flow" };
        break;
      case "message":
        data = { title: "Message", body: "Send a follow-up message" };
        break;
      case "condition":
        data = { title: "Condition", body: "Branch based on tag or reply" };
        break;
      case "action":
      default:
        data = { title: "Action", body: "Choose an action", actionType: "add_tag", actionValue: "" };
        break;
    }

    const nextNode: Node<FlowNodeData> = {
      id,
      type: "flowNode",
      position: basePosition,
      data,
    };

    setNodes((current) => [...current, nextNode]);
    setSelectedNodeId(id);
  };

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current as Node[]) as Node<FlowNodeData>[]);
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  };

  const onConnect = (connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          type: "smoothstep",
        },
        current
      )
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) =>
      current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
  };

  const saveLabel = saveStatus === "saving" ? "Saving..." : saveStatus === "dirty" ? "Unsaved changes" : "Auto-saved";

  const inspectorBody = (() => {
    if (!selectedNode) {
      return (
        <div className="text-sm text-slate-500">
          <p className="mb-2 font-semibold text-slate-900">No node selected</p>
          <p>Click a node to edit its title, content, and action details.</p>
        </div>
      );
    }

    const data = selectedNode.data as FlowNodeData;

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateNodeData({ title: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Body</label>
          <textarea
            rows={4}
            value={data.body}
            onChange={(e) => updateNodeData({ body: e.target.value })}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400"
          />
        </div>

        {data.actionType ? (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Action type</label>
              <select
                value={data.actionType || "add_tag"}
                onChange={(e) =>
                  updateNodeData({
                    actionType: e.target.value as "add_tag" | "enroll_sequence",
                    actionValue: "",
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400"
              >
                <option value="add_tag">Add tag</option>
                <option value="enroll_sequence">Enroll in sequence</option>
              </select>
            </div>

            {data.actionType === "enroll_sequence" ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Sequence</label>
                <select
                  value={data.actionValue || ""}
                  onChange={(e) => updateNodeData({ actionValue: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400"
                >
                  <option value="">Select sequence</option>
                  {sequences.map((sequence) => (
                    <option key={sequence.id} value={sequence.id}>
                      {sequence.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Tag name</label>
                <input
                  type="text"
                  value={data.actionValue || ""}
                  onChange={(e) => updateNodeData({ actionValue: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400"
                />
              </div>
            )}
          </>
        ) : null}

        <button
          onClick={deleteSelectedNode}
          className="w-full rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Delete node
        </button>
      </div>
    );
  })();

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Flows</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Build the conversation map behind every reply
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Start from a proven template, then shape the conversation with triggers, messages, conditions, and actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/automation" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Open automation
            </Link>
            <Link href="/dashboard/inbox" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Review inbox
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {starterTemplates.map((template, index) => (
            <button
              key={template.name}
              onClick={() => void createFlow(template)}
              className="rounded-[24px] border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                0{index + 1}
              </div>
              <h3 className="text-lg font-black text-slate-900">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="surface-panel rounded-[30px] p-5">
          <div className="space-y-3">
            <input
              type="text"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="New flow name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
            />
            <button
              onClick={() => void createFlow()}
              className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Create flow
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Your flows</p>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
              {loading ? (
                <div className="py-10 text-sm text-slate-400">Loading flows...</div>
              ) : flows.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                  No flows yet. Start with a template above or create one from scratch.
                </div>
              ) : (
                <div className="space-y-2">
                  {flows.map((flow) => (
                    <button
                      key={flow.id}
                      onClick={() => setSelectedFlowId(flow.id)}
                      className={`w-full rounded-[22px] border px-4 py-4 text-left transition-colors ${
                        selectedFlowId === flow.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{flow.name}</p>
                          <p className={`mt-1 text-xs ${selectedFlowId === flow.id ? "text-white/70" : "text-slate-400"}`}>
                            {flow.nodes.length} node{flow.nodes.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            flow.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {flow.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="surface-panel overflow-hidden rounded-[30px]">
          {!selectedFlow ? (
            <div className="flex min-h-[72vh] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10v4H7zM7 13h10v4H7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">Select a flow</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                Pick a template from the left or start a new flow. This is where the conversation logic becomes visible and editable.
              </p>
            </div>
          ) : (
            <div className="p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    className="w-full max-w-2xl bg-transparent text-3xl font-black tracking-[-0.04em] text-slate-950 outline-none placeholder:text-slate-300"
                  />
                  <p className="text-sm text-slate-500">Autosaves while you edit the canvas</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                    {saveLabel}
                  </span>
                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={currentEnabled}
                      onChange={(e) => setCurrentEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    Enabled
                  </label>
                </div>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nodes</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{nodes.length}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Connections</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{edges.length}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mode</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{currentEnabled ? "Live" : "Paused"}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sequence links</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{sequences.length}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => addNode("trigger")} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                  Add Trigger
                </button>
                <button onClick={() => addNode("message")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Add Message
                </button>
                <button onClick={() => addNode("condition")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Add Condition
                </button>
                <button onClick={() => addNode("action")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Add Action
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white" style={{ height: "68vh" }}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#111827", strokeWidth: 2 } }}
                    connectionLineStyle={{ stroke: "#111827", strokeWidth: 2 }}
                  >
                    <MiniMap nodeColor={() => "#111827"} maskColor="rgba(255,255,255,0.6)" pannable zoomable />
                    <Controls />
                    <Background gap={24} size={1.5} color="#e5e7eb" />
                  </ReactFlow>
                </div>

                <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 h-fit">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">
                    {selectedNode ? "Node inspector" : "Flow inspector"}
                  </h3>
                  {inspectorBody}
                </aside>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
