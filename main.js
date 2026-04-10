const exampleNotes =
  "Patient diagnosed with mild hypertension. Prescribed lisinopril 10mg daily. Reduce sodium intake. Follow up in 2 weeks. Call the office if dizziness gets worse or if new chest pain happens.";

const notesField = document.getElementById("doctor-notes");
const simplifyButton = document.getElementById("simplify-button");
const clearButton = document.getElementById("clear-button");
const copyButton = document.getElementById("copy-button");
const errorMessage = document.getElementById("error-message");
const idleState = document.getElementById("idle-state");
const loadingState = document.getElementById("loading-state");
const resultsView = document.getElementById("results-view");
const explanationText = document.getElementById("explanation-text");
const actionsList = document.getElementById("actions-list");
const warningsList = document.getElementById("warnings-list");
const questionsList = document.getElementById("questions-list");

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

function setHidden(element, hidden) {
  element.classList.toggle("hidden", hidden);
}

function showError(message) {
  errorMessage.textContent = message;
  setHidden(errorMessage, false);
}

function clearError() {
  errorMessage.textContent = "";
  setHidden(errorMessage, true);
}

function renderList(element, items, emptyMessage) {
  element.innerHTML = "";

  const values = Array.isArray(items) && items.length > 0 ? items : [emptyMessage];

  values.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
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

function setLoading(loading) {
  simplifyButton.disabled = loading;
  simplifyButton.textContent = loading ? "Simplifying..." : "Simplify Instructions";
  setHidden(loadingState, !loading);
  if (loading) {
    setHidden(idleState, true);
    setHidden(resultsView, true);
  }
}

function renderResult(result) {
  explanationText.textContent = result.explanation;
  renderList(actionsList, result.actions, "No action steps were clearly provided in the notes.");
  renderList(warningsList, result.warnings, "No specific warning signs were provided in the notes.");
  renderList(questionsList, result.questions, "No follow-up questions were generated for this note.");
  copyButton.dataset.summary = buildCopyText(result);

  setHidden(idleState, true);
  setHidden(loadingState, true);
  setHidden(resultsView, false);
}

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

  return sentences.slice(0, 2).join(". ") + ".";
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
    "check"
  ];

  const actions = sentences.filter((sentence) =>
    actionHints.some((hint) => sentence.toLowerCase().includes(hint))
  );

  return actions.length > 0 ? actions.slice(0, 5) : ["Follow the instructions from your doctor and ask for clarification if anything is unclear."];
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
    /(mg|medication|prescribed|tablet|capsule|daily)/i.test(sentence)
  );
  const hasFollowUp = sentences.some((sentence) => /follow up|week|weeks|month|months/i.test(sentence));

  const questions = [
    "Can you explain the most important thing I should focus on first?",
    hasMedication
      ? "What side effects or medication problems should I watch for?"
      : "What symptoms should make me call the office?",
    hasFollowUp
      ? "What should I do if I am not feeling better before the follow-up visit?"
      : "When should I check in again if symptoms do not improve?"
  ];

  return questions;
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

async function handleSimplify() {
  clearError();

  const notes = notesField.value.trim();

  if (!notes) {
    showError("Please paste doctor notes or visit instructions first.");
    return;
  }

  setLoading(true);

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const payload = mockSimplify(notes);
    renderResult(payload);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to simplify instructions right now.");
    setHidden(idleState, false);
    setHidden(resultsView, true);
    setHidden(loadingState, true);
  } finally {
    setLoading(false);
  }
}

async function handleCopy() {
  const summary = copyButton.dataset.summary || "";

  if (!summary) {
    return;
  }

  try {
    await navigator.clipboard.writeText(summary);
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = "Copy Summary";
    }, 1600);
  } catch {
    copyButton.textContent = "Copy failed";
    window.setTimeout(() => {
      copyButton.textContent = "Copy Summary";
    }, 1600);
  }
}

clearButton.addEventListener("click", () => {
  notesField.value = "";
  clearError();
  setHidden(resultsView, true);
  setHidden(loadingState, true);
  setHidden(idleState, false);
});

simplifyButton.addEventListener("click", handleSimplify);
copyButton.addEventListener("click", handleCopy);
