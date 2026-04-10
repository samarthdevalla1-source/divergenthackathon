import { createSpeechSynthesizer } from './speech-synthesizer.js';
import { createSpeechTranscriber } from './speech-transcriber.js';

const SAMPLE_TRANSCRIPT =
  'Patient states they have had shortness of breath, dizziness, and mild chest tightness since early this morning. Symptoms worsened while walking upstairs. They deny loss of consciousness. Current medications include albuterol and lisinopril. They report a history of asthma and would like their daughter updated after evaluation.';

const SAMPLE_SUMMARY =
  'Simplified summary: Patient reports shortness of breath, dizziness, and mild chest tightness starting this morning, worse with exertion. History includes asthma. Current medications include albuterol and lisinopril. Escalate for clinician review and keep family communication preferences in mind.';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function summarizeTranscript(transcript) {
  const cleanTranscript = String(transcript ?? '').trim();
  if (!cleanTranscript) {
    return '';
  }

  const sentences = cleanTranscript
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const headline = sentences[0] ?? cleanTranscript;
  const supporting = sentences.slice(1, 3).join(' ');

  return [
    `Simplified summary: ${headline}`,
    supporting ? `Key details: ${supporting}` : '',
    'Recommended next step: confirm symptoms, timing, medications, and any red-flag changes with a clinician.',
  ]
    .filter(Boolean)
    .join('\n');
}

export class MedicalSpeechDemo extends HTMLElement {
  constructor() {
    super();

    this.transcriber = null;
    this.synthesizer = null;
    this.summaryDirty = false;

    this.handleTranscript = this.handleTranscript.bind(this);
    this.handleTranscriberStatus = this.handleTranscriberStatus.bind(this);
    this.handleTranscriberError = this.handleTranscriberError.bind(this);
    this.handleSynthVoices = this.handleSynthVoices.bind(this);
    this.handleSynthState = this.handleSynthState.bind(this);
    this.handleSynthError = this.handleSynthError.bind(this);
  }

  connectedCallback() {
    if (this.dataset.ready === 'true') {
      return;
    }

    this.dataset.ready = 'true';
    this.render();
    this.setupServices();
    this.bindUi();
    this.syncAll();
  }

  disconnectedCallback() {
    this.destroy();
  }

  render() {
    this.innerHTML = `
      <section class="speech-demo-shell" aria-label="Speech demo">
        <div class="speech-demo-card">
          <div class="speech-demo-header">
            <div>
              <p class="speech-demo-kicker">Hackathon MVP</p>
              <h1>Medical Communication Speech Demo</h1>
              <p class="speech-demo-copy">
                Browser-native speech-to-text and text-to-speech for intake notes, quick summaries, and spoken playback.
              </p>
            </div>
            <div class="speech-status-cluster" aria-live="polite">
              <div class="status-chip" data-role="recognition-status">Recognition: idle</div>
              <div class="status-chip" data-role="speech-status">Speech: idle</div>
            </div>
          </div>

          <div class="support-notice" data-role="support-notice"></div>

          <div class="speech-actions-row">
            <button type="button" data-action="start-listening">Start Listening</button>
            <button type="button" data-action="stop-listening" class="ghost">Stop Listening</button>
            <button type="button" data-action="reset-transcript" class="ghost">Reset Transcript</button>
            <button type="button" data-action="sample-transcript" class="secondary">Load Sample Transcript</button>
            <button type="button" data-action="sample-summary" class="secondary">Load Sample Summary</button>
          </div>

          <div class="speech-grid">
            <div class="panel">
              <div class="panel-header">
                <h2>Live Transcript</h2>
                <span class="panel-hint">Microphone input or pasted text</span>
              </div>
              <label class="field-label" for="transcript-output">Transcript</label>
              <textarea id="transcript-output" data-role="transcript-output" placeholder="Transcript appears here while the speaker talks. You can also paste text here for demos."></textarea>
              <div class="field-meta" data-role="interim-output">Interim transcript will appear here while recognition is still listening.</div>
            </div>

            <div class="panel">
              <div class="panel-header">
                <h2>Simplified Summary</h2>
                <span class="panel-hint">Editable before reading aloud</span>
              </div>
              <label class="field-label" for="summary-output">Summary</label>
              <textarea id="summary-output" data-role="summary-output" placeholder="A simplified summary will be generated here."></textarea>
              <div class="speech-actions-row compact">
                <button type="button" data-action="read-summary">Read Summary Aloud</button>
                <button type="button" data-action="pause-speech" class="ghost">Pause</button>
                <button type="button" data-action="resume-speech" class="ghost">Resume</button>
                <button type="button" data-action="stop-speech" class="ghost">Stop</button>
              </div>
            </div>
          </div>

          <div class="controls-grid">
            <div class="panel compact-panel">
              <div class="panel-header">
                <h2>Recognition Settings</h2>
              </div>
              <label class="checkbox-row">
                <input type="checkbox" data-role="auto-restart-toggle" checked />
                <span>Auto-restart if listening ends unexpectedly</span>
              </label>
            </div>

            <div class="panel compact-panel">
              <div class="panel-header">
                <h2>Speech Playback</h2>
              </div>
              <label class="field-label" for="voice-select">Voice</label>
              <select id="voice-select" data-role="voice-select"></select>
              <div class="range-row">
                <label class="field-label" for="rate-range">Rate <span data-role="rate-value">1.0</span></label>
                <input id="rate-range" data-role="rate-range" type="range" min="0.7" max="1.3" step="0.1" value="1" />
              </div>
              <div class="range-row">
                <label class="field-label" for="pitch-range">Pitch <span data-role="pitch-value">1.0</span></label>
                <input id="pitch-range" data-role="pitch-range" type="range" min="0.8" max="1.3" step="0.1" value="1" />
              </div>
            </div>
          </div>

          <div class="status-stream" data-role="message-stream" aria-live="polite"></div>
        </div>
      </section>
    `;
  }

  setupServices() {
    this.transcriber = createSpeechTranscriber({
      autoRestart: true,
      continuous: true,
      interimResults: true,
      lang: 'en-US',
    });

    this.synthesizer = createSpeechSynthesizer({
      lang: 'en-US',
      rate: 1,
      pitch: 1,
      volume: 1,
    });

    this.transcriber.addEventListener('transcript', this.handleTranscript);
    this.transcriber.addEventListener('statuschange', this.handleTranscriberStatus);
    this.transcriber.addEventListener('error', this.handleTranscriberError);
    this.transcriber.addEventListener('start', this.handleTranscriberStatus);
    this.transcriber.addEventListener('end', this.handleTranscriberStatus);
    this.transcriber.addEventListener('reset', this.handleTranscript);

    this.synthesizer.addEventListener('voiceschanged', this.handleSynthVoices);
    this.synthesizer.addEventListener('start', this.handleSynthState);
    this.synthesizer.addEventListener('end', this.handleSynthState);
    this.synthesizer.addEventListener('pause', this.handleSynthState);
    this.synthesizer.addEventListener('resume', this.handleSynthState);
    this.synthesizer.addEventListener('error', this.handleSynthError);
  }

  bindUi() {
    this.$supportNotice = this.querySelector('[data-role="support-notice"]');
    this.$recognitionStatus = this.querySelector('[data-role="recognition-status"]');
    this.$speechStatus = this.querySelector('[data-role="speech-status"]');
    this.$transcriptOutput = this.querySelector('[data-role="transcript-output"]');
    this.$interimOutput = this.querySelector('[data-role="interim-output"]');
    this.$summaryOutput = this.querySelector('[data-role="summary-output"]');
    this.$messageStream = this.querySelector('[data-role="message-stream"]');
    this.$voiceSelect = this.querySelector('[data-role="voice-select"]');
    this.$autoRestartToggle = this.querySelector('[data-role="auto-restart-toggle"]');
    this.$rateRange = this.querySelector('[data-role="rate-range"]');
    this.$pitchRange = this.querySelector('[data-role="pitch-range"]');
    this.$rateValue = this.querySelector('[data-role="rate-value"]');
    this.$pitchValue = this.querySelector('[data-role="pitch-value"]');

    this.querySelector('[data-action="start-listening"]').addEventListener('click', () => {
      this.transcriber.start();
    });

    this.querySelector('[data-action="stop-listening"]').addEventListener('click', () => {
      this.transcriber.stop();
    });

    this.querySelector('[data-action="reset-transcript"]').addEventListener('click', () => {
      this.summaryDirty = false;
      this.transcriber.reset();
      this.$transcriptOutput.value = '';
      this.$summaryOutput.value = '';
      this.renderMessage('Transcript cleared.');
    });

    this.querySelector('[data-action="sample-transcript"]').addEventListener('click', () => {
      this.$transcriptOutput.value = SAMPLE_TRANSCRIPT;
      this.summaryDirty = false;
      this.updateSummaryFromTranscript();
      this.renderMessage('Sample transcript loaded for demos.');
    });

    this.querySelector('[data-action="sample-summary"]').addEventListener('click', () => {
      this.summaryDirty = true;
      this.$summaryOutput.value = SAMPLE_SUMMARY;
      this.renderMessage('Sample summary loaded for playback demos.');
    });

    this.querySelector('[data-action="read-summary"]').addEventListener('click', () => {
      const voiceName = this.$voiceSelect.value;
      this.synthesizer.speak(this.$summaryOutput.value, {
        voice: voiceName,
        pitch: Number(this.$pitchRange.value),
        rate: Number(this.$rateRange.value),
      });
    });

    this.querySelector('[data-action="pause-speech"]').addEventListener('click', () => {
      this.synthesizer.pause();
    });

    this.querySelector('[data-action="resume-speech"]').addEventListener('click', () => {
      this.synthesizer.resume();
    });

    this.querySelector('[data-action="stop-speech"]').addEventListener('click', () => {
      this.synthesizer.stop();
    });

    this.$transcriptOutput.addEventListener('input', () => {
      this.summaryDirty = false;
      this.updateSummaryFromTranscript();
    });

    this.$summaryOutput.addEventListener('input', () => {
      this.summaryDirty = true;
    });

    this.$autoRestartToggle.addEventListener('change', () => {
      this.transcriber.updateOptions({
        autoRestart: this.$autoRestartToggle.checked,
      });
      this.renderMessage(
        this.$autoRestartToggle.checked
          ? 'Auto-restart is enabled.'
          : 'Auto-restart is disabled.'
      );
    });

    this.$voiceSelect.addEventListener('change', () => {
      this.synthesizer.updateOptions({
        voice: this.$voiceSelect.value,
      });
    });

    this.$rateRange.addEventListener('input', () => {
      this.$rateValue.textContent = Number(this.$rateRange.value).toFixed(1);
      this.synthesizer.updateOptions({
        rate: Number(this.$rateRange.value),
      });
    });

    this.$pitchRange.addEventListener('input', () => {
      this.$pitchValue.textContent = Number(this.$pitchRange.value).toFixed(1);
      this.synthesizer.updateOptions({
        pitch: Number(this.$pitchRange.value),
      });
    });
  }

  syncAll() {
    this.renderSupportNotice();
    this.updateTranscriptView(this.transcriber.getSnapshot());
    this.updateRecognitionStatus(this.transcriber.getSnapshot());
    this.populateVoiceOptions();
    this.updateSpeechStatus(this.synthesizer.getSnapshot());
  }

  updateTranscriptView(snapshot) {
    const fullTranscript = snapshot.fullTranscript;
    if (fullTranscript && this.$transcriptOutput.value !== fullTranscript) {
      this.$transcriptOutput.value = fullTranscript;
    }

    this.$interimOutput.textContent = snapshot.interimTranscript
      ? `Interim: ${snapshot.interimTranscript}`
      : 'Interim transcript will appear here while recognition is still listening.';

    if (!this.summaryDirty) {
      this.updateSummaryFromTranscript();
    }
  }

  updateSummaryFromTranscript() {
    const summary = summarizeTranscript(this.$transcriptOutput.value);
    this.$summaryOutput.value = summary;
  }

  updateRecognitionStatus(snapshot) {
    this.$recognitionStatus.textContent = `Recognition: ${snapshot.status}`;

    if (snapshot.lastError?.message) {
      this.renderMessage(snapshot.lastError.message, 'error');
    }
  }

  updateSpeechStatus(snapshot) {
    this.$speechStatus.textContent = `Speech: ${snapshot.status}`;
  }

  populateVoiceOptions() {
    const voices = this.synthesizer.getVoices();
    const currentValue = this.$voiceSelect.value || this.synthesizer.getSnapshot().options.voice;

    const optionsHtml = [
      '<option value="">Browser default voice</option>',
      ...voices.map(
        (voice) =>
          `<option value="${escapeHtml(voice.name)}">${escapeHtml(voice.name)} (${escapeHtml(voice.lang)})</option>`
      ),
    ].join('');

    this.$voiceSelect.innerHTML = optionsHtml;
    this.$voiceSelect.value = voices.some((voice) => voice.name === currentValue) ? currentValue : '';

    if (!voices.length) {
      this.renderMessage(
        'No speech synthesis voices are loaded yet. Some browsers populate voices a moment after page load.'
      );
    }
  }

  renderSupportNotice() {
    if (this.transcriber.isSupported) {
      this.$supportNotice.innerHTML = `
        <strong>Speech recognition supported.</strong>
        Chrome and Edge tend to provide the most reliable Web Speech API demo experience.
      `;
      this.$supportNotice.className = 'support-notice ok';
      return;
    }

    this.$supportNotice.innerHTML = `
      <strong>Speech recognition is not supported in this browser.</strong>
      You can still paste sample transcript text and demo summary playback if speech synthesis is available.
    `;
    this.$supportNotice.className = 'support-notice warn';
  }

  renderMessage(message, tone = 'info') {
    if (!message) {
      return;
    }

    this.$messageStream.innerHTML = `<div class="message ${tone}">${escapeHtml(message)}</div>`;
  }

  handleTranscript(event) {
    this.updateTranscriptView(event.detail);
    this.updateRecognitionStatus(event.detail);
  }

  handleTranscriberStatus(event) {
    const snapshot = event.detail.snapshot ?? event.detail;
    this.updateRecognitionStatus(snapshot);
  }

  handleTranscriberError(event) {
    this.updateRecognitionStatus(event.detail.snapshot ?? this.transcriber.getSnapshot());
  }

  handleSynthVoices() {
    this.populateVoiceOptions();
  }

  handleSynthState(event) {
    this.updateSpeechStatus(event.detail);
  }

  handleSynthError(event) {
    this.updateSpeechStatus(event.detail.snapshot ?? this.synthesizer.getSnapshot());
    this.renderMessage(event.detail.message, 'error');
  }

  destroy() {
    if (this.dataset.ready !== 'true') {
      return;
    }

    this.transcriber?.removeEventListener('transcript', this.handleTranscript);
    this.transcriber?.removeEventListener('statuschange', this.handleTranscriberStatus);
    this.transcriber?.removeEventListener('error', this.handleTranscriberError);
    this.transcriber?.removeEventListener('start', this.handleTranscriberStatus);
    this.transcriber?.removeEventListener('end', this.handleTranscriberStatus);
    this.transcriber?.removeEventListener('reset', this.handleTranscript);

    this.synthesizer?.removeEventListener('voiceschanged', this.handleSynthVoices);
    this.synthesizer?.removeEventListener('start', this.handleSynthState);
    this.synthesizer?.removeEventListener('end', this.handleSynthState);
    this.synthesizer?.removeEventListener('pause', this.handleSynthState);
    this.synthesizer?.removeEventListener('resume', this.handleSynthState);
    this.synthesizer?.removeEventListener('error', this.handleSynthError);

    this.transcriber?.destroy();
    this.synthesizer?.destroy();

    this.transcriber = null;
    this.synthesizer = null;
    this.dataset.ready = 'false';
  }
}

if (!customElements.get('medical-speech-demo')) {
  customElements.define('medical-speech-demo', MedicalSpeechDemo);
}
