export interface GuidedBotSections {
  businessContext: string;
  offerings: string;
  faq: string;
  outOfScope: string;
  extraNotes: string;
}

export interface FAQPair {
  q: string;
  a: string;
}

export function parseFAQPairs(text: string): FAQPair[] | null {
  if (!text.trim()) return null;
  const pairs: FAQPair[] = [];
  const blocks = text.split(/\n\n+/);
  let matched = 0;
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const qLine = lines[0] ?? "";
    const aLine = lines.slice(1).join("\n");
    if (qLine.startsWith("Q:") && aLine.trimStart().startsWith("A:")) {
      pairs.push({
        q: qLine.replace(/^Q:\s*/, "").trim(),
        a: aLine.replace(/^A:\s*/, "").trim(),
      });
      matched++;
    }
  }
  const nonEmpty = blocks.filter((b) => b.trim()).length;
  if (matched > 0 && matched >= Math.ceil(nonEmpty * 0.5)) {
    return pairs;
  }
  return null;
}

export function compileFAQPairs(pairs: FAQPair[]): string {
  return pairs
    .filter((p) => p.q.trim() || p.a.trim())
    .map((p) => `Q: ${p.q.trim()}\nA: ${p.a.trim()}`)
    .join("\n\n");
}

export const BUSINESS_TYPE_TEMPLATES: Record<string, GuidedBotSections> = {
  restaurant: {
    businessContext:
      "[Business Name] is a restaurant located in [City]. We serve [cuisine type, e.g. Mongolian, Chinese, Western] food and are open for dine-in and takeout. We welcome families, groups, and anyone looking for a great meal.\n\nHours: [e.g. Mon–Fri 10am–9pm, Sat–Sun 11am–10pm]",
    offerings:
      "Our menu includes:\n- [Dish 1]: [Price]\n- [Dish 2]: [Price]\n- [Drink 1]: [Price]\n\nWe offer dine-in, takeout, and delivery. Minimum delivery order: [amount]. Delivery area: [area or km radius].",
    faq: "Q: What are your opening hours?\nA: We are open [Days] from [Start time] to [End time].\n\nQ: Do you take reservations?\nA: Yes, message us or call [phone] to book a table.\n\nQ: Do you offer delivery?\nA: Yes, we deliver to [area]. Delivery fee is [amount].\n\nQ: Do you have vegetarian options?\nA: Yes, we have [describe options].",
    outOfScope:
      "Do not provide specific ingredient or allergen information — direct customers to call us. Do not promise exact wait times or guarantee table availability.",
    extraNotes:
      "If a customer has a complaint, apologize sincerely and offer to connect them with a manager. Always be warm and welcoming.",
  },
  ecommerce: {
    businessContext:
      "[Business Name] is an online store selling [product types, e.g. clothing, electronics, accessories]. We serve customers [nationwide / in specific region] and ship orders within [X] business days.",
    offerings:
      "Our products include:\n- [Category 1, e.g. T-shirts]: from [price]\n- [Category 2, e.g. Hoodies]: from [price]\n- [Category 3, e.g. Accessories]: from [price]\n\nPayment: [e.g. card, bank transfer, QPay]. Free shipping on orders over [amount].",
    faq: "Q: How long does shipping take?\nA: Orders ship within [X] business days. Delivery typically takes [Y] days.\n\nQ: What is your return policy?\nA: We accept returns within [X] days of delivery for unused items.\n\nQ: How do I track my order?\nA: You'll receive a tracking link by email after your order ships.\n\nQ: Do you ship internationally?\nA: [Yes/No — add details].",
    outOfScope:
      "Do not confirm exact stock quantities or promise specific delivery dates. Do not process refunds through chat — direct customers to email [email] or call [phone].",
    extraNotes:
      "For order issues, ask for the order number first, then guide the customer to the appropriate support channel.",
  },
  service: {
    businessContext:
      "[Business Name] is a [type of service, e.g. plumbing, cleaning, IT support] company based in [City/Area]. We serve both residential and commercial clients and offer [key features, e.g. same-day service, free estimates].\n\nAvailability: [e.g. Mon–Sat 8am–6pm]",
    offerings:
      "Our services include:\n- [Service 1]: starting from [price]\n- [Service 2]: starting from [price]\n- [Service 3]: starting from [price]\n\nWe offer free estimates. Bookings can be made by phone or message.",
    faq: "Q: How do I book a service?\nA: Message us or call [phone] to schedule an appointment.\n\nQ: What areas do you cover?\nA: We serve [list of areas or radius].\n\nQ: Do you offer emergency services?\nA: Yes, contact us at [phone] for urgent requests.\n\nQ: How much does it cost?\nA: Prices start from [amount]. We offer free estimates for larger jobs.",
    outOfScope:
      "Do not provide price quotes for complex or custom jobs — direct customers to request an in-person estimate. Do not guarantee specific availability or appointment times without confirmation.",
    extraNotes:
      "Always confirm the customer's address and preferred time before scheduling. If a job seems complex, ask them to describe the issue and arrange a site visit.",
  },
  healthcare: {
    businessContext:
      "[Clinic/Business Name] is a healthcare provider offering [type of services, e.g. general practice, dental, physiotherapy] in [City/Area].\n\nWorking hours: [e.g. Mon–Fri 9am–6pm, Sat 9am–1pm]",
    offerings:
      "Our services include:\n- [Service 1, e.g. General consultation]: [price or insurance covered]\n- [Service 2, e.g. Dental cleaning]: [price]\n- [Service 3, e.g. Lab tests]: [price range]\n\nAppointments can be scheduled by phone or message.",
    faq: "Q: How do I book an appointment?\nA: Call [phone] or message us to schedule.\n\nQ: Do you accept insurance?\nA: Yes, we accept [insurance providers].\n\nQ: What should I bring to my first visit?\nA: Please bring your ID, insurance card, and any previous medical records.\n\nQ: How long are appointments?\nA: Standard consultations take about [X] minutes.",
    outOfScope:
      "Do not provide medical diagnoses, treatment recommendations, or emergency medical advice. For any emergency, direct the patient to call emergency services immediately. Do not comment on specific medications or dosages.",
    extraNotes:
      "If a patient describes a medical emergency, immediately direct them to call emergency services. Always be empathetic and calm.",
  },
  real_estate: {
    businessContext:
      "[Business Name] is a real estate agency in [City/Region]. We help clients buy, sell, and rent residential and commercial properties. Our licensed agents have [X] years of experience in the local market.",
    offerings:
      "Our services include:\n- Property buying assistance\n- Property selling & listing\n- Rental property management\n- Property valuation & consultation\n\nWe have [number] active listings in [areas]. Contact us to schedule a viewing.",
    faq: "Q: How do I schedule a property viewing?\nA: Message us with the property you're interested in and we'll arrange a visit.\n\nQ: What documents do I need to buy a property?\nA: You'll need [list: ID, income proof, etc.]. Our agents will guide you through the full process.\n\nQ: What are your commission rates?\nA: Our rates are competitive. Contact us for a free consultation and valuation.\n\nQ: How long does the buying process take?\nA: Typically [X] weeks from offer to completion.",
    outOfScope:
      "Do not provide specific legal or financial advice — refer clients to qualified attorneys or advisors. Do not promise property availability without confirmation. Prices and listings are subject to change.",
    extraNotes:
      "When a customer expresses interest in a property, always offer to connect them with one of our agents for a personal consultation.",
  },
  education: {
    businessContext:
      "[Business Name / Academy] offers [courses/programs, e.g. English language, coding, tutoring] for [target audience, e.g. adults, children, professionals] in [City/Area or Online].",
    offerings:
      "Our programs include:\n- [Course 1]: [duration, price, schedule]\n- [Course 2]: [duration, price, schedule]\n- [Course 3]: [duration, price, schedule]\n\nClasses are available [in-person / online / both]. Group and individual sessions available.",
    faq: "Q: How do I enroll?\nA: Message us or visit [location/website] to register. Next intake starts [date].\n\nQ: Do you offer certificates?\nA: Yes, graduates receive a certificate upon successful completion.\n\nQ: What is the class schedule?\nA: Classes run [days] from [time] to [time].\n\nQ: Are there trial classes?\nA: Yes, we offer a free trial class. Contact us to book.",
    outOfScope:
      "Do not make guarantees about exam results or job placement outcomes. Do not compare our programs to other institutions.",
    extraNotes:
      "If a student or parent has questions about which course is right for them, offer to connect them with an advisor for a free consultation.",
  },
  beauty: {
    businessContext:
      "[Business Name] is a beauty salon located in [City/Area]. We offer a full range of beauty and grooming services for all clients.\n\nHours: [e.g. Tue–Sun 10am–7pm, Monday closed]",
    offerings:
      "Our services include:\n- Haircut & styling: from [price]\n- Hair coloring & highlights: from [price]\n- Facial & skin treatments: from [price]\n- Nail services: from [price]\n- [Other service]: from [price]\n\nAll services are by appointment. Walk-ins welcome based on availability.",
    faq: "Q: How do I book an appointment?\nA: Message us or call [phone] to reserve your slot.\n\nQ: How long do appointments take?\nA: Haircuts take about [X] mins. Coloring takes [Y] hours depending on the service.\n\nQ: What is your cancellation policy?\nA: Please cancel at least [X hours] in advance.\n\nQ: Do you accept walk-ins?\nA: Yes, based on availability. Call ahead to check.",
    outOfScope:
      "Do not recommend treatments for medical skin conditions — direct clients to a dermatologist. Do not guarantee specific results from any treatment.",
    extraNotes:
      "For new clients, always ask about allergies or skin sensitivities before booking specialized treatments. Be warm and welcoming.",
  },
  other: {
    businessContext:
      "[Business Name] is a business located in [City/Area] offering [your main products or services]. We serve [describe your target customers, e.g. local residents, small businesses, families].",
    offerings:
      "Our main offerings include:\n- [Product/Service 1]: [Price]\n- [Product/Service 2]: [Price]\n- [Product/Service 3]: [Price]\n\nWe accept [payment methods]. Contact us for custom requests or bulk pricing.",
    faq: "Q: How do I contact you?\nA: Message us here or reach us at [phone/email].\n\nQ: What are your hours?\nA: We're open [days] from [time] to [time].\n\nQ: Do you offer refunds?\nA: [Describe your refund or return policy].\n\nQ: Where are you located?\nA: We're at [address].",
    outOfScope:
      "Do not make commitments about products, prices, or services not listed above. For complex inquiries, direct customers to speak with a team member.",
    extraNotes:
      "Always greet customers warmly and offer to connect them with a team member if you can't fully answer their question.",
  },
};

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

export function appendKnowledgeSection(prompt: string, knowledgeJson: unknown | null | undefined): string {
  const knowledgeSection = knowledgeJson
    ? "\n\nBusiness knowledge base (use this to answer questions):\n" + JSON.stringify(knowledgeJson, null, 0)
    : "";

  return `${prompt || ""}${knowledgeSection}`;
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
