"use client";

import { useEffect, useState } from "react";

interface Sequence {
  id: string;
  name: string;
  enabled: boolean;
  created_at: string;
  step_count?: number;
}

interface SequenceStep {
  id: string;
  message: string;
  delay_days: number;
  delay_hours: number;
  step_order: number;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [sequenceNameDraft, setSequenceNameDraft] = useState("");
  const [loadingSequences, setLoadingSequences] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [savingSequence, setSavingSequence] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [newSequence, setNewSequence] = useState({ name: "", enabled: true });
  const [stepForm, setStepForm] = useState({
    message: "",
    delayDays: 0,
    delayHours: 0,
    stepOrder: "",
  });

  const selectedSequence = sequences.find((sequence) => sequence.id === selectedSequenceId) ?? null;

  const loadSequences = async () => {
    setLoadingSequences(true);
    const res = await fetch("/api/sequences");
    const data = await res.json();
    const items = data.sequences || [];
    setSequences(items);
    if (!selectedSequenceId && items[0]?.id) {
      setSelectedSequenceId(items[0].id);
    }
    setLoadingSequences(false);
  };

  const loadSteps = async (sequenceId: string) => {
    setLoadingSteps(true);
    const res = await fetch(`/api/sequences/${sequenceId}/steps`);
    const data = await res.json();
    setSteps(data.steps || []);
    setLoadingSteps(false);
  };

  useEffect(() => {
    void loadSequences();
  }, []);

  useEffect(() => {
    if (!selectedSequenceId) {
      setSteps([]);
      setSequenceNameDraft("");
      return;
    }
    void loadSteps(selectedSequenceId);
  }, [selectedSequenceId]);

  useEffect(() => {
    setSequenceNameDraft(selectedSequence?.name || "");
  }, [selectedSequenceId, selectedSequence?.name]);

  const createSequence = async () => {
    if (!newSequence.name.trim()) return;
    setSavingSequence(true);
    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSequence),
    });
    const data = await res.json();
    if (data.sequence) {
      setSequences((prev) => [data.sequence, ...prev]);
      setSelectedSequenceId(data.sequence.id);
      setNewSequence({ name: "", enabled: true });
    }
    setSavingSequence(false);
  };

  const updateSequence = async (sequence: Sequence, enabled: boolean) => {
    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sequence.id,
        name: sequence.name,
        enabled,
      }),
    });
    const data = await res.json();
    if (data.sequence) {
      setSequences((prev) => prev.map((item) => (item.id === sequence.id ? { ...item, enabled } : item)));
    }
  };

  const renameSequence = async (sequence: Sequence, name: string) => {
    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sequence.id,
        name,
        enabled: sequence.enabled,
      }),
    });
    const data = await res.json();
    if (data.sequence) {
      setSequences((prev) => prev.map((item) => (item.id === sequence.id ? { ...item, name } : item)));
    }
  };

  const deleteSequence = async (sequenceId: string) => {
    await fetch("/api/sequences", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sequenceId }),
    });
    setSequences((prev) => prev.filter((sequence) => sequence.id !== sequenceId));
    if (selectedSequenceId === sequenceId) {
      setSelectedSequenceId(null);
      setSteps([]);
    }
  };

  const addStep = async () => {
    if (!selectedSequenceId || !stepForm.message.trim()) return;
    setSavingStep(true);
    const res = await fetch(`/api/sequences/${selectedSequenceId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: stepForm.message,
        delayDays: Number(stepForm.delayDays || 0),
        delayHours: Number(stepForm.delayHours || 0),
        stepOrder: stepForm.stepOrder ? Number(stepForm.stepOrder) : undefined,
      }),
    });
    const data = await res.json();
    if (data.step) {
      setSteps((prev) => [...prev, data.step].sort((a, b) => a.step_order - b.step_order));
      setSequences((prev) =>
        prev.map((sequence) =>
          sequence.id === selectedSequenceId
            ? { ...sequence, step_count: (sequence.step_count || 0) + 1 }
            : sequence
        )
      );
      setStepForm({ message: "", delayDays: 0, delayHours: 0, stepOrder: "" });
    }
    setSavingStep(false);
  };

  const deleteStep = async (stepId: string) => {
    if (!selectedSequenceId) return;
    await fetch(`/api/sequences/${selectedSequenceId}/steps`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId }),
    });
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
    setSequences((prev) =>
      prev.map((sequence) =>
        sequence.id === selectedSequenceId
          ? { ...sequence, step_count: Math.max((sequence.step_count || 1) - 1, 0) }
          : sequence
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h1 className="text-2xl font-black text-gray-900">Sequences</h1>
            <p className="text-sm text-gray-500 mt-1">Build timed drip campaigns for Instagram and Messenger</p>
          </div>

          <div className="p-5 border-b border-gray-100 space-y-3">
            <input
              type="text"
              placeholder="New sequence name"
              value={newSequence.name}
              onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={newSequence.enabled}
                onChange={(e) => setNewSequence({ ...newSequence, enabled: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enabled
            </label>
            <button
              onClick={createSequence}
              disabled={savingSequence}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {savingSequence ? "Creating..." : "Create sequence"}
            </button>
          </div>

          <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
            {loadingSequences ? (
              <div className="p-6 text-sm text-gray-400">Loading sequences...</div>
            ) : sequences.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">No sequences yet.</div>
            ) : (
              sequences.map((sequence) => (
                <button
                  key={sequence.id}
                  onClick={() => setSelectedSequenceId(sequence.id)}
                  className={`w-full text-left px-5 py-4 border-b border-gray-100 transition-colors ${
                    selectedSequenceId === sequence.id ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{sequence.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {sequence.step_count || 0} step{(sequence.step_count || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        sequence.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {sequence.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          {!selectedSequence ? (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10M7 12h10M7 17h6" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Select a sequence</h2>
              <p className="text-sm text-gray-500 max-w-md">
                Create a sequence on the left, then add message steps with delays to build your drip campaign.
              </p>
            </div>
          ) : (
            <div className="p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div>
                  <input
                    type="text"
                    value={sequenceNameDraft}
                    onChange={(e) => {
                      setSequenceNameDraft(e.target.value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== selectedSequence.name) {
                        void renameSequence(selectedSequence, e.target.value.trim());
                      }
                    }}
                    className="text-2xl font-black text-gray-900 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(selectedSequence.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                    <input
                      type="checkbox"
                      checked={selectedSequence.enabled}
                      onChange={(e) => void updateSequence(selectedSequence, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Enabled
                  </label>
                  <button
                    onClick={() => void deleteSequence(selectedSequence.id)}
                    className="text-sm font-semibold text-gray-400 hover:text-red-500 px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Add step</h3>
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={stepForm.message}
                      onChange={(e) => setStepForm({ ...stepForm, message: e.target.value })}
                      placeholder="Write the step message..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Delay days</label>
                        <input
                          type="number"
                          min={0}
                          value={stepForm.delayDays}
                          onChange={(e) => setStepForm({ ...stepForm, delayDays: Number(e.target.value) })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Delay hours</label>
                        <input
                          type="number"
                          min={0}
                          value={stepForm.delayHours}
                          onChange={(e) => setStepForm({ ...stepForm, delayHours: Number(e.target.value) })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Step order</label>
                      <input
                        type="number"
                        min={1}
                        value={stepForm.stepOrder}
                        onChange={(e) => setStepForm({ ...stepForm, stepOrder: e.target.value })}
                        placeholder="Auto"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <button
                      onClick={addStep}
                      disabled={savingStep}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      {savingStep ? "Saving..." : "Add step"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-800">Sequence steps</h3>
                    <span className="text-xs text-gray-400">{loadingSteps ? "Loading..." : `${steps.length} total`}</span>
                  </div>

                  {loadingSteps ? (
                    <div className="text-sm text-gray-400">Loading steps...</div>
                  ) : steps.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
                      No steps yet. Add the first drip message on the left.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {steps
                        .slice()
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step) => (
                          <div key={step.id} className="border border-gray-200 rounded-2xl p-4 bg-white">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                                    Step {step.step_order}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    +{step.delay_days}d {step.delay_hours}h
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{step.message}</p>
                              </div>
                              <button
                                onClick={() => void deleteStep(step.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
