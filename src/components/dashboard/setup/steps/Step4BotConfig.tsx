"use client";

import BotConfigForm from "@/components/dashboard/bot/BotConfigForm";

interface Props {
  businessId: string;
  initialPrompt?: string;
  initialBotName?: string;
  initialWelcome?: string;
  initialTone?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4BotConfig({
  businessId,
  initialPrompt,
  initialBotName,
  initialWelcome,
  initialTone,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Bot тохиргоо</h2>
        <p className="text-text-secondary text-sm">
          Guided маягаар bot-оо тохируулаад, хүсвэл Advanced горимоор raw system prompt-оо засаж болно.
        </p>
      </div>

      <BotConfigForm
        initialBotName={initialBotName || "Nexon Bot"}
        initialBotPrompt={initialPrompt || ""}
        initialWelcomeMessage={initialWelcome || ""}
        initialBotTone={initialTone || "friendly"}
        submitLabel="Хадгалах"
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
              return { ok: false, error: data.error || "Алдаа гарлаа" };
            }
            return { ok: true };
          } catch {
            return { ok: false, error: "Холболтын алдаа гарлаа" };
          }
        }}
      />
    </div>
  );
}
