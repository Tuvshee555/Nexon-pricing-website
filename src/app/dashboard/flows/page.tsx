"use client";

import { useEffect, useRef, useState } from "react";
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

const nodeBase = "rounded-2xl border shadow-sm bg-white min-w-[200px] max-w-[240px] px-4 py-3 text-left";

function FlowNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  const title = data.title || "Node";
  const body = data.body || "";

  return (
    <div
      className={`${nodeBase} ${
        selected ? "border-indigo-500 shadow-indigo-100" : "border-indigo-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-indigo-500" />
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">{title}</p>
          {data.actionType ? (
            <span className="text-[10px] rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
              {data.actionType === "add_tag" ? "Add tag" : "Enroll sequence"}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap leading-relaxed">{body}</p>
        {data.actionValue ? <p className="text-xs text-gray-500">Value: {data.actionValue}</p> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-indigo-500" />
    </div>
  );
}

const nodeTypes = {
  flowNode: FlowNode,
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildStarterFlow(name: string): { nodes: Node[]; edges: Edge[] } {
  const triggerId = makeId("trigger");
  const messageId = makeId("message");

  return {
    nodes: [
      {
        id: triggerId,
        type: "flowNode",
        position: { x: 100, y: 120 },
        data: { title: "Trigger", body: "Keyword or event starts the flow" },
      },
      {
        id: messageId,
        type: "flowNode",
        position: { x: 380, y: 120 },
        data: { title: "Message", body: `Welcome to ${name}` },
      },
    ],
    edges: [
      {
        id: `${triggerId}-${messageId}`,
        source: triggerId,
        target: messageId,
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

  const loadInitialData = async () => {
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
  };

  const loadFlow = async (flowId: string) => {
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
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

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
  }, [selectedFlowId]);

  useEffect(() => {
    if (!selectedFlowId || hydratingRef.current) return;
    setSaveStatus("dirty");
    const timer = window.setTimeout(() => {
      void saveFlow();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, currentName, currentEnabled, selectedFlowId]);

  const saveFlow = async () => {
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
  };

  const createFlow = async () => {
    if (!newFlowName.trim()) return;
    const starter = buildStarterFlow(newFlowName.trim());
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFlowName.trim(),
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
        <div className="text-sm text-gray-500">
          <p className="font-semibold text-gray-800 mb-2">No node selected</p>
          <p>Click a node to edit its title, content, and action details.</p>
        </div>
      );
    }

    const data = selectedNode.data as FlowNodeData;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateNodeData({ title: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body</label>
          <textarea
            rows={4}
            value={data.body}
            onChange={(e) => updateNodeData({ body: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
          />
        </div>

        {data.actionType ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Action type</label>
              <select
                value={data.actionType || "add_tag"}
                onChange={(e) =>
                  updateNodeData({
                    actionType: e.target.value as "add_tag" | "enroll_sequence",
                    actionValue: "",
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="add_tag">Add tag</option>
                <option value="enroll_sequence">Enroll in sequence</option>
              </select>
            </div>

            {data.actionType === "enroll_sequence" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sequence</label>
                <select
                  value={data.actionValue || ""}
                  onChange={(e) => updateNodeData({ actionValue: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tag name</label>
                <input
                  type="text"
                  value={data.actionValue || ""}
                  onChange={(e) => updateNodeData({ actionValue: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}
          </>
        ) : null}

        <button
          onClick={deleteSelectedNode}
          className="w-full border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          Delete node
        </button>
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h1 className="text-2xl font-black text-gray-900">Flows</h1>
            <p className="text-sm text-gray-500 mt-1">Visual canvas for designing ManyChat-style automation</p>
          </div>

          <div className="p-5 border-b border-gray-100 space-y-3">
            <input
              type="text"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="New flow name"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={createFlow}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Create flow
            </button>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-sm text-gray-400">Loading flows...</div>
            ) : flows.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">No flows yet.</div>
            ) : (
              flows.map((flow) => (
                <button
                  key={flow.id}
                  onClick={() => setSelectedFlowId(flow.id)}
                  className={`w-full text-left px-5 py-4 border-b border-gray-100 transition-colors ${
                    selectedFlowId === flow.id ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{flow.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {flow.nodes.length} node{flow.nodes.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        flow.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {flow.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          {!selectedFlow ? (
            <div className="h-full min-h-[72vh] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10v4H7zM7 13h10v4H7z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Select a flow</h2>
              <p className="text-sm text-gray-500 max-w-md">
                Create a flow on the left, then add trigger, message, condition, and action nodes on the canvas.
              </p>
            </div>
          ) : (
            <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => setCurrentName(e.target.value)}
                      className="text-2xl font-black text-gray-900 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                    />
                    <p className="text-sm text-gray-500">Autosaves as you edit the canvas</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
                      {saveLabel}
                    </span>
                    <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                      <input
                        type="checkbox"
                        checked={currentEnabled}
                        onChange={(e) => setCurrentEnabled(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Enabled
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addNode("trigger")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Add Trigger
                  </button>
                  <button
                    onClick={() => addNode("message")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Add Message
                  </button>
                  <button
                    onClick={() => addNode("condition")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Add Condition
                  </button>
                  <button
                    onClick={() => addNode("action")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Add Action
                  </button>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden" style={{ height: "68vh" }}>
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
                    defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#4f46e5", strokeWidth: 2 } }}
                    connectionLineStyle={{ stroke: "#4f46e5", strokeWidth: 2 }}
                  >
                    <MiniMap
                      nodeColor={() => "#4f46e5"}
                      maskColor="rgba(255,255,255,0.6)"
                      pannable
                      zoomable
                    />
                    <Controls />
                    <Background gap={24} size={1.5} color="#e5e7eb" />
                  </ReactFlow>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 h-fit">
                <h3 className="text-sm font-bold text-gray-800 mb-4">
                  {selectedNode ? "Node inspector" : "Flow inspector"}
                </h3>
                {inspectorBody}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
