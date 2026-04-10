const transcriptField = document.getElementById("transcript-text");
const transcriptError = document.getElementById("transcript-error");
const transcriptionStatus = document.getElementById("transcription-status");
const startRecordingButton = document.getElementById("start-recording");
const stopRecordingButton = document.getElementById("stop-recording");
const summarizeTranscriptButton = document.getElementById("summarize-transcript");
const clearTranscriptButton = document.getElementById("clear-transcript");
const transcriptIdleState = document.getElementById("transcript-idle-state");
const transcriptLoadingState = document.getElementById("transcript-loading-state");
const transcriptResultsView = document.getElementById("transcript-results-view");
const transcriptExplanationText = document.getElementById("transcript-explanation-text");
const transcriptActionsList = document.getElementById("transcript-actions-list");
const transcriptWarningsList = document.getElementById("transcript-warnings-list");
const transcriptQuestionsList = document.getElementById("transcript-questions-list");
const transcriptCopyButton = document.getElementById("transcript-copy-button");
const transcriptSpeakButton = document.getElementById("transcript-speak-button");
const transcriptStopSpeakButton = document.getElementById("transcript-stop-speak-button");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let latestTranscriptSummary = "";

function setHidden(element, hidden) {
  element.classList.toggle("hidden", hidden);
}

function showTranscriptError(message) {
  transcriptError.textContent = message;
  setHidden(transcriptError, false);
}

function clearTranscriptError() {
  transcriptError.textContent = "";
  setHidden(transcriptError, true);
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

function setTranscriptLoading(loading) {
  summarizeTranscriptButton.disabled = loading;
  summarizeTranscriptButton.textContent = loading ? "Summarizing..." : "Summarize Transcript";
  setHidden(transcriptLoadingState, !loading);

  if (loading) {
    setHidden(transcriptIdleState, true);
    setHidden(transcriptResultsView, true);
  }
}

function renderTranscriptResult(result) {
  transcriptExplanationText.textContent = result.explanation;
  renderList(transcriptActionsList, result.actions, "No action steps were clearly provided in the transcript.");
  renderList(transcriptWarningsList, result.warnings, "No specific warning signs were provided in the transcript.");
  renderList(transcriptQuestionsList, result.questions, "No follow-up questions were generated for this transcript.");
  latestTranscriptSummary = window.AfterVisitMockAI.buildCopyText(result);

  setHidden(transcriptIdleState, true);
  setHidden(transcriptLoadingState, true);
  setHidden(transcriptResultsView, false);
}

function setRecordingState(recording) {
  startRecordingButton.disabled = recording || !recognition;
  stopRecordingButton.disabled = !recording;
  transcriptionStatus.textContent = recording
    ? "Listening... speak your doctor notes now."
    : SpeechRecognition
      ? "Microphone ready. You can speak or load a test case."
      : "Speech recognition is not supported in this browser. Use the test cases below.";
}

function setupRecognition() {
  if (!SpeechRecognition) {
    setRecordingState(false);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let transcript = "";

    for (let index = 0; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript;
      if (!transcript.endsWith(" ")) {
        transcript += " ";
      }
    }

    transcriptField.value = transcript.trim();
  };

  recognition.onerror = (event) => {
    setRecordingState(false);
    showTranscriptError(`Speech recognition error: ${event.error}.`);
  };

  recognition.onend = () => {
    setRecordingState(false);
  };
}

async function handleTranscriptSimplify() {
  clearTranscriptError();
  const transcript = transcriptField.value.trim();

  if (!transcript) {
    showTranscriptError("Record or paste a transcript before summarizing.");
    return;
  }

  setTranscriptLoading(true);

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const payload = window.AfterVisitMockAI.mockSimplify(transcript);
    renderTranscriptResult(payload);
  } catch (error) {
    showTranscriptError(error instanceof Error ? error.message : "Unable to summarize the transcript right now.");
    setHidden(transcriptIdleState, false);
    setHidden(transcriptResultsView, true);
    setHidden(transcriptLoadingState, true);
  } finally {
    setTranscriptLoading(false);
  }
}

async function copyTranscriptSummary() {
  if (!latestTranscriptSummary) {
    showTranscriptError("Summarize the transcript first so there is something to copy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(latestTranscriptSummary);
    transcriptCopyButton.textContent = "Copied";
    window.setTimeout(() => {
      transcriptCopyButton.textContent = "Copy Summary";
    }, 1600);
  } catch {
    transcriptCopyButton.textContent = "Copy failed";
    window.setTimeout(() => {
      transcriptCopyButton.textContent = "Copy Summary";
    }, 1600);
  }
}

function speakTranscriptSummary() {
  if (!latestTranscriptSummary) {
    showTranscriptError("Summarize the transcript first so there is something to read aloud.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showTranscriptError("Text-to-speech is not available in this browser.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(latestTranscriptSummary);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function stopTranscriptSummary() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

startRecordingButton.addEventListener("click", () => {
  clearTranscriptError();

  if (!recognition) {
    showTranscriptError("Speech recognition is not supported in this browser.");
    return;
  }

  transcriptField.value = "";
  recognition.start();
  setRecordingState(true);
});

stopRecordingButton.addEventListener("click", () => {
  recognition?.stop();
  setRecordingState(false);
});

summarizeTranscriptButton.addEventListener("click", handleTranscriptSimplify);
clearTranscriptButton.addEventListener("click", () => {
  recognition?.stop();
  transcriptField.value = "";
  latestTranscriptSummary = "";
  clearTranscriptError();
  stopTranscriptSummary();
  setRecordingState(false);
  setHidden(transcriptResultsView, true);
  setHidden(transcriptLoadingState, true);
  setHidden(transcriptIdleState, false);
});

transcriptCopyButton.addEventListener("click", copyTranscriptSummary);
transcriptSpeakButton.addEventListener("click", speakTranscriptSummary);
transcriptStopSpeakButton.addEventListener("click", stopTranscriptSummary);

setupRecognition();
setRecordingState(false);
