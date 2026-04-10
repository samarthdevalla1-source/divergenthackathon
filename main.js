const exampleNotes =
  "Patient diagnosed with mild hypertension. Prescribed lisinopril 10mg daily. Reduce sodium intake. Follow up in 2 weeks. Call the office if dizziness gets worse or if new chest pain happens.";

const notesField = document.getElementById("doctor-notes");
const simplifyButton = document.getElementById("simplify-button");
const exampleButton = document.getElementById("example-button");
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

async function handleSimplify() {
  clearError();

  const notes = notesField.value.trim();

  if (!notes) {
    showError("Please paste doctor notes or visit instructions first.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/simplify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ notes })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Something went wrong while simplifying the instructions.");
    }

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

exampleButton.addEventListener("click", () => {
  notesField.value = exampleNotes;
  clearError();
});

clearButton.addEventListener("click", () => {
  notesField.value = "";
  clearError();
  setHidden(resultsView, true);
  setHidden(loadingState, true);
  setHidden(idleState, false);
});

simplifyButton.addEventListener("click", handleSimplify);
copyButton.addEventListener("click", handleCopy);
