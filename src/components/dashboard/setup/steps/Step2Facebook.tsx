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

export default function Step2Facebook({
  businessId,
  fbConnected,
  fbError,
  onNext,
  onSkip,
}: Props) {
  const [pages, setPages] = useState<FacebookPageOption[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (fbConnected) {
      fetchPages();
    }
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

  const handleSubscribe = async () => {
    if (!selectedPageId) {
      toast.error("Facebook хуудас сонгоно уу");
      return;
    }

    const selectedPage = pages.find((p) => p.id === selectedPageId);
    setSubscribing(true);
    try {
      const res = await fetch("/api/facebook/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedPageId,
          businessId,
          connectInstagram: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Алдаа гарлаа");
        return;
      }

      toast.success(`"${selectedPage?.name}" хуудас холбогдлоо`);
      onNext(selectedPage?.name || "", selectedPageId);
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Facebook хуудас холбох</h2>
        <p className="text-text-secondary text-sm">
          Таны Facebook бизнес хуудастай холбосноор таны хэрэглэгчдэд автоматаар хариулна.
        </p>
      </div>

      {fbError && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl p-4 text-sm">
          {fbError === "fb_denied"
            ? "Facebook-ийн зөвшөөрлийг цуцалсан байна. Дахин оролдоно уу."
            : "Facebook холболтод алдаа гарлаа. Дахин оролдоно уу."}
        </div>
      )}

      {!fbConnected ? (
        <div className="space-y-4">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-text-secondary">
              Facebook-д нэвтрэн таны бизнес хуудасны мэдээлэлд хандах зөвшөөрөл авна.
              Бид зөвхөн мессеж хариулах зөвшөөрөл хүснэ.
            </p>
          </div>
          <button
            onClick={handleConnectFacebook}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#1565C0] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook-ээр нэвтрэх
          </button>
          <button
            onClick={onSkip}
            className="w-full text-sm text-muted hover:text-text-secondary py-2 transition-colors"
          >
            Одоохондоо алгасах →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-text-secondary text-sm gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Хуудсуудыг ачааллаж байна...
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary text-sm mb-4">
                Facebook хуудас олдсонгүй. Бизнес хуудас үүсгэсэн байх шаардлагатай.
              </p>
              <button
                onClick={handleConnectFacebook}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Дахин оролдох
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-secondary">Холбох хуудсаа сонгоно уу:</p>
              <div className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      selectedPageId === page.id
                        ? "bg-primary/10 border-primary/50"
                        : "bg-surface-2 border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{page.name}</p>
                      {page.category && (
                        <p className="text-xs text-muted">{page.category}</p>
                      )}
                    </div>
                    {selectedPageId === page.id && (
                      <svg className="w-5 h-5 text-primary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubscribe}
                disabled={!selectedPageId || subscribing}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {subscribing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Холбож байна...
                  </>
                ) : (
                  <>
                    Хуудас холбох
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
              <button
                onClick={onSkip}
                className="w-full text-sm text-muted hover:text-text-secondary py-2 transition-colors"
              >
                Одоохондоо алгасах →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
