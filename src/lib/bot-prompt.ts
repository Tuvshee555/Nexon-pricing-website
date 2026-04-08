export interface GuidedBotSections {
  businessContext: string;
  offerings: string;
  faq: string;
  outOfScope: string;
  extraNotes: string;
}

export interface PromptHealth {
  score: number;
  level: "poor" | "fair" | "good" | "excellent";
  warnings: string[];
}

const SECTION_HEADINGS: Array<keyof GuidedBotSections> = [
  "businessContext",
  "offerings",
  "faq",
  "outOfScope",
  "extraNotes",
];

const HEADING_LABEL: Record<keyof GuidedBotSections, string> = {
  businessContext: "BUSINESS_CONTEXT",
  offerings: "WHAT_WE_SELL",
  faq: "FAQ",
  outOfScope: "DO_NOT_ANSWER",
  extraNotes: "EXTRA_NOTES",
};

export const EMPTY_GUIDED_SECTIONS: GuidedBotSections = {
  businessContext: "",
  offerings: "",
  faq: "",
  outOfScope: "",
  extraNotes: "",
};

export function estimateTokensFromChars(text: string): number {
  return Math.ceil((text || "").length / 4);
}

export function composePromptFromSections(
  sections: GuidedBotSections,
  tone: string
): string {
  const safeTone = tone || "friendly";
  const normalized = {
    businessContext: sections.businessContext.trim(),
    offerings: sections.offerings.trim(),
    faq: sections.faq.trim(),
    outOfScope: sections.outOfScope.trim(),
    extraNotes: sections.extraNotes.trim(),
  };

  return [
    "You are a business support assistant for the company below.",
    `Response tone: ${safeTone}.`,
    "Reply clearly, accurately, and concisely.",
    "",
    `### ${HEADING_LABEL.businessContext}`,
    normalized.businessContext || "Not provided.",
    "",
    `### ${HEADING_LABEL.offerings}`,
    normalized.offerings || "Not provided.",
    "",
    `### ${HEADING_LABEL.faq}`,
    normalized.faq || "Not provided.",
    "",
    `### ${HEADING_LABEL.outOfScope}`,
    normalized.outOfScope || "No explicit restrictions provided.",
    "",
    `### ${HEADING_LABEL.extraNotes}`,
    normalized.extraNotes || "None.",
    "",
    "Hard rules:",
    "1. If the answer is not in the provided business context, say you are not sure and offer to connect to a human.",
    "2. Do not invent pricing, delivery, availability, or policy details.",
    "3. Keep answers aligned with the stated business scope and restrictions.",
  ].join("\n");
}

export function parsePromptToSections(
  prompt: string
): { sections: GuidedBotSections; isTemplatePrompt: boolean } {
  const text = (prompt || "").trim();
  if (!text) {
    return { sections: { ...EMPTY_GUIDED_SECTIONS }, isTemplatePrompt: false };
  }

  const sectionMap: GuidedBotSections = { ...EMPTY_GUIDED_SECTIONS };
  let parsedCount = 0;

  for (let i = 0; i < SECTION_HEADINGS.length; i += 1) {
    const key = SECTION_HEADINGS[i];
    const startTag = `### ${HEADING_LABEL[key]}`;
    const start = text.indexOf(startTag);
    if (start < 0) continue;

    let end = text.length;
    for (let j = i + 1; j < SECTION_HEADINGS.length; j += 1) {
      const nextTag = `### ${HEADING_LABEL[SECTION_HEADINGS[j]]}`;
      const nextIndex = text.indexOf(nextTag, start + startTag.length);
      if (nextIndex >= 0) {
        end = nextIndex;
        break;
      }
    }

    const raw = text.slice(start + startTag.length, end).trim();
    sectionMap[key] = raw;
    parsedCount += 1;
  }

  return {
    sections: sectionMap,
    isTemplatePrompt: parsedCount >= 4,
  };
}

export function evaluatePromptHealth(
  prompt: string,
  sections?: GuidedBotSections
): PromptHealth {
  const warnings: string[] = [];
  const length = (prompt || "").trim().length;
  let score = 100;

  if (length < 120) {
    warnings.push("Prompt too short. Add more business details.");
    score -= 35;
  }
  if (length > 2000) {
    warnings.push("Prompt exceeds 2000 character limit.");
    score -= 40;
  } else if (length > 1700) {
    warnings.push("Prompt is very long and may reduce quality.");
    score -= 10;
  }

  if (sections) {
    if (sections.businessContext.trim().length < 20) {
      warnings.push("Business context is missing or too brief.");
      score -= 15;
    }
    if (sections.offerings.trim().length < 20) {
      warnings.push("Add what you sell and key products/services.");
      score -= 15;
    }
    if (sections.faq.trim().length < 20) {
      warnings.push("Add FAQ examples for better answers.");
      score -= 10;
    }
    if (sections.outOfScope.trim().length < 10) {
      warnings.push("Define what the bot should NOT answer.");
      score -= 15;
    }
  } else {
    const normalized = prompt.toLowerCase();
    const hasBoundaryHint =
      normalized.includes("do not") ||
      normalized.includes("don't") ||
      normalized.includes("not answer") ||
      normalized.includes("болохгүй") ||
      normalized.includes("бүү");
    if (!hasBoundaryHint) {
      warnings.push("Add clear boundaries for off-limit questions.");
      score -= 15;
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const level: PromptHealth["level"] =
    finalScore >= 85
      ? "excellent"
      : finalScore >= 65
      ? "good"
      : finalScore >= 45
      ? "fair"
      : "poor";

  return { score: finalScore, level, warnings };
}
