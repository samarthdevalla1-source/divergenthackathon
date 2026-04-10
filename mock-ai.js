(function () {
  const warningKeywords = [
    "chest pain",
    "shortness of breath",
    "dizziness",
    "fainting",
    "fever",
    "bleeding",
    "swelling",
    "worsen"
  ];

  function splitSentences(text) {
    return text
      .split(/[\n.]+/)
      .map((part) => part.replace(/^\s*[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  function buildExplanation(sentences) {
    if (sentences.length === 0) {
      return "These notes were turned into a simpler summary to help the patient understand the visit and next steps.";
    }

    return `${sentences.slice(0, 2).join(". ")}.`;
  }

  function buildActions(sentences) {
    const actionHints = [
      "take",
      "start",
      "continue",
      "reduce",
      "avoid",
      "follow up",
      "schedule",
      "call",
      "monitor",
      "check",
      "use",
      "drink",
      "rest",
      "apply",
      "keep"
    ];

    const actions = sentences.filter((sentence) =>
      actionHints.some((hint) => sentence.toLowerCase().includes(hint))
    );

    return actions.length > 0
      ? actions.slice(0, 5)
      : ["Follow the instructions from your doctor and ask for clarification if anything is unclear."];
  }

  function buildWarnings(sentences) {
    const warnings = sentences.filter((sentence) =>
      warningKeywords.some((hint) => sentence.toLowerCase().includes(hint))
    );

    return warnings.length > 0
      ? warnings.slice(0, 4)
      : ["Ask your doctor what warning signs or symptoms should prompt a call or urgent care visit."];
  }

  function buildQuestions(sentences) {
    const hasMedication = sentences.some((sentence) =>
      /(mg|medication|prescribed|tablet|capsule|daily|inhaler|antibiotic)/i.test(sentence)
    );
    const hasFollowUp = sentences.some((sentence) => /follow up|week|weeks|month|months|return/i.test(sentence));

    return [
      "Can you explain the most important thing I should focus on first?",
      hasMedication
        ? "What side effects or medication problems should I watch for?"
        : "What symptoms should make me call the office?",
      hasFollowUp
        ? "What should I do if I am not feeling better before the follow-up visit?"
        : "When should I check in again if symptoms do not improve?"
    ];
  }

  function buildCopyText(result) {
    return [
      `Explanation: ${result.explanation}`,
      "",
      "Actions:",
      ...result.actions.map((item) => `- ${item}`),
      "",
      "Warnings:",
      ...result.warnings.map((item) => `- ${item}`),
      "",
      "Questions:",
      ...result.questions.map((item) => `- ${item}`)
    ].join("\n");
  }

  function mockSimplify(notes) {
    const sentences = splitSentences(notes);

    return {
      explanation: buildExplanation(sentences),
      actions: buildActions(sentences),
      warnings: buildWarnings(sentences),
      questions: buildQuestions(sentences)
    };
  }

  window.AfterVisitMockAI = {
    mockSimplify,
    buildCopyText
  };
})();
