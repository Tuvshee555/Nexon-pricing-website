"use client";

import BotConfigForm from "@/components/dashboard/bot/BotConfigForm";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  businessId: string;
  businessType?: string;
  initialPrompt?: string;
  initialBotName?: string;
  initialWelcome?: string;
  initialTone?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4BotConfig({
  businessId,
  businessType,
  initialPrompt,
  initialBotName,
  initialWelcome,
  initialTone,
  onNext,
  onBack,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-bold text-slate-950">{t("setup_bot_title")}</h2>
        <p className="text-sm text-slate-600">{t("setup_bot_subtitle")}</p>
      </div>

      <BotConfigForm
        initialBotName={initialBotName || "Nexon Bot"}
        initialBotPrompt={initialPrompt || ""}
        initialWelcomeMessage={initialWelcome || ""}
        initialBotTone={initialTone || "friendly"}
        businessType={businessType}
        submitLabel={t("setup_save_continue")}
        onBack={onBack}
        onSaved={onNext}
        onSave={async ({ botName, botPrompt, welcomeMessage, botTone }) => {
          try {
            const res = await fetch("/api/business/update-bot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessId,
                botPrompt,
                botName,
                welcomeMessage,
                botTone,
              }),
            });

            const data = await res.json();
            if (!res.ok) {
              return { ok: false, error: data.error || "Something went wrong" };
            }
            return { ok: true };
          } catch {
            return { ok: false, error: "Connection error" };
          }
        }}
      />
    </div>
  );
}
