"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FacebookPageOption {
  id: string;
  name: string;
  category?: string;
}

interface Props {
  businessId: string;
  fbConnected: boolean;
  fbError?: string;
  onNext: (pageName: string, pageId: string) => void;
  onSkip: () => void;
}

export default function Step2Facebook({ businessId, fbConnected, fbError, onNext, onSkip }: Props) {
  const [pages, setPages] = useState<FacebookPageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (fbConnected) fetchPages();
  }, [fbConnected]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facebook/pages");
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      toast.error("Could not load your Facebook pages");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    window.location.href = `/api/facebook/auth?businessId=${businessId}`;
  };

  const handleConnect = async (page: FacebookPageOption) => {
    setConnecting(page.id);
    try {
      const res = await fetch("/api/facebook/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: page.id, businessId, connectInstagram: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      toast.success(`Connected "${page.name}"`);
      onNext(page.name, page.id);
    } catch {
      toast.error("Connection error");
    } finally {
      setConnecting(null);
    }
  };

  const avatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-green-500",
      "bg-teal-500",
    ];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  if (!fbConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="mb-1 text-2xl font-black text-gray-900">Connect Facebook</h1>
          <p className="text-sm text-gray-500">
            Sign in with Facebook so we can discover your pages and unlock Messenger automation.
          </p>
        </div>

        {fbError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {fbError === "fb_denied"
              ? "The Facebook authorization was canceled. You can try again anytime."
              : "Facebook connection failed. Please try again."}
          </div>
        )}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          After Facebook connects, we&apos;ll show the pages you can use and let you pick one to activate.
        </div>

        <button
          onClick={handleConnectFacebook}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1565C0]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </button>

        <button onClick={onSkip} className="w-full py-2 text-sm text-gray-400 transition-colors hover:text-gray-600">
          Skip for now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-black text-gray-900">Connect Facebook</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading your pages...
        </div>
      ) : pages.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-1 font-semibold text-gray-700">No pages found</p>
          <p className="mb-5 text-sm text-gray-400">You need at least one Facebook business page connected to continue.</p>
          <button onClick={handleConnectFacebook} className="text-sm font-semibold text-slate-900 transition-colors hover:text-slate-700">
            Try again
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            We found <span className="font-semibold text-gray-700">{pages.length} Facebook page{pages.length === 1 ? "" : "s"}</span>.
          </p>

          <div className="overflow-hidden rounded-2xl border border-gray-200">
            {pages.map((page, i) => (
              <div
                key={page.id}
                className={`flex items-center gap-4 px-5 py-4 ${i !== pages.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${avatarColor(page.name)}`}>
                  <span className="text-sm font-bold text-white">{page.name[0]?.toUpperCase()}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{page.name}</p>
                  {page.category && <p className="text-xs text-gray-400">{page.category}</p>}
                </div>

                <button
                  onClick={() => handleConnect(page)}
                  disabled={connecting === page.id}
                  className="flex-shrink-0 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {connecting === page.id ? "Connecting..." : "Connect"}
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <button onClick={handleConnectFacebook} className="font-medium text-slate-900 transition-colors hover:text-slate-700">
              I don&apos;t see my page
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={fetchPages} className="font-medium text-slate-900 transition-colors hover:text-slate-700">
              Refresh pages
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={onSkip} className="text-gray-400 transition-colors hover:text-gray-600">
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
