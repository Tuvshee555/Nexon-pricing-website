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
      toast.error("Facebook хуудсуудыг авч чадсангүй");
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
      if (!res.ok) { toast.error(data.error || "Алдаа гарлаа"); return; }
      toast.success(`"${page.name}" холбогдлоо`);
      onNext(page.name, page.id);
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setConnecting(null);
    }
  };

  // Avatar initials color based on first char
  const avatarColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500",
      "bg-red-500", "bg-orange-500", "bg-green-500", "bg-teal-500",
    ];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  if (!fbConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Facebook хуудас холбох</h1>
          <p className="text-gray-500 text-sm">
            Facebook-д нэвтэрч, бизнес хуудсаа сонгосноор Messenger автоматаар ажиллана.
          </p>
        </div>

        {fbError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
            {fbError === "fb_denied"
              ? "Facebook-ийн зөвшөөрлийг цуцалсан байна. Дахин оролдоно уу."
              : "Facebook холболтод алдаа гарлаа. Дахин оролдоно уу."}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          Facebook нэвтрэлтийн дараа таны бүх бизнес хуудсуудыг харуулна. Та аль нэгийг нь сонгон холбоно.
        </div>

        <button
          onClick={handleConnectFacebook}
          className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#1565C0] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-sm text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook-ээр нэвтрэх
        </button>

        <button onClick={onSkip} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
          Одоохондоо алгасах →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Facebook хуудас холбох</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400 text-sm">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Хуудсуудыг ачааллаж байна...
        </div>
      ) : pages.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold mb-1">Хуудас олдсонгүй</p>
          <p className="text-gray-400 text-sm mb-5">Facebook бизнес хуудас үүсгэсэн байх шаардлагатай.</p>
          <button
            onClick={handleConnectFacebook}
            className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
          >
            Дахин оролдох
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Таны удирдаж буй <span className="font-semibold text-gray-700">{pages.length} Facebook хуудас</span> олдлоо.
          </p>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            {pages.map((page, i) => (
              <div
                key={page.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i !== pages.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${avatarColor(page.name)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-sm">{page.name[0]?.toUpperCase()}</span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{page.name}</p>
                  {page.category && <p className="text-xs text-gray-400">{page.category}</p>}
                </div>

                {/* Connect button */}
                <button
                  onClick={() => handleConnect(page)}
                  disabled={connecting === page.id}
                  className="flex-shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  {connecting === page.id ? "Холбож байна..." : "Холбох"}
                </button>
              </div>
            ))}
          </div>

          {/* Helper links like ManyChat */}
          <div className="flex flex-wrap gap-4 text-sm">
            <button
              onClick={handleConnectFacebook}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Хуудсаа харахгүй байна
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={fetchPages}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Жагсаалт шинэчлэх
            </button>
            <span className="text-gray-300">·</span>
            <button onClick={onSkip} className="text-gray-400 hover:text-gray-600 transition-colors">
              Алгасах
            </button>
          </div>
        </>
      )}
    </div>
  );
}
