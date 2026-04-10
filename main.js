const notesField = document.getElementById("doctor-notes");
const simplifyButton = document.getElementById("simplify-button");
const clearButton = document.getElementById("clear-button");
const copyButton = document.getElementById("copy-button");
const speakButton = document.getElementById("speak-button");
const stopSpeakButton = document.getElementById("stop-speak-button");
const errorMessage = document.getElementById("error-message");
const idleState = document.getElementById("idle-state");
const loadingState = document.getElementById("loading-state");
const resultsView = document.getElementById("results-view");
const explanationText = document.getElementById("explanation-text");
const actionsList = document.getElementById("actions-list");
const warningsList = document.getElementById("warnings-list");
const questionsList = document.getElementById("questions-list");

let latestSummary = "";

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
  latestSummary = window.AfterVisitMockAI.buildCopyText(result);
  copyButton.dataset.summary = latestSummary;

  setHidden(idleState, true);
  setHidden(loadingState, true);
  setHidden(resultsView, false);
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
    const payload = window.AfterVisitMockAI.mockSimplify(notes);
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

function handleSpeak() {
  if (!latestSummary) {
    showError("Simplify the notes first so there is a summary to read aloud.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showError("Text-to-speech is not available in this browser.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(latestSummary);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function handleStopSpeak() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

clearButton.addEventListener("click", () => {
  notesField.value = "";
  latestSummary = "";
  clearError();
  handleStopSpeak();
  setHidden(resultsView, true);
  setHidden(loadingState, true);
  setHidden(idleState, false);
});

simplifyButton.addEventListener("click", handleSimplify);
copyButton.addEventListener("click", handleCopy);
speakButton.addEventListener("click", handleSpeak);
stopSpeakButton.addEventListener("click", handleStopSpeak);
