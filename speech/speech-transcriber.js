// Browser-only wrapper around the Web Speech API.
// This must run on the client because SpeechRecognition is a window API.

const RESTARTABLE_STATUS = new Set(['idle', 'processing']);
const NON_RESTARTABLE_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'language-not-supported',
]);

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function normalizeRecognitionError(error) {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. Please allow microphone access and try again.';
    case 'audio-capture':
      return 'No microphone was found. Check your audio input device and browser permissions.';
    case 'network':
      return 'Speech recognition hit a network or speech service problem.';
    case 'aborted':
      return 'Speech recognition was aborted before transcription finished.';
    case 'language-not-supported':
      return 'The selected speech recognition language is not supported in this browser.';
    default:
      return 'Speech recognition failed. Please try again.';
  }
}

export class SpeechTranscriber extends EventTarget {
  constructor(options = {}) {
    super();

    this.options = {
      lang: options.lang ?? 'en-US',
      continuous: options.continuous ?? true,
      interimResults: options.interimResults ?? true,
      maxAlternatives: options.maxAlternatives ?? 1,
      autoRestart: options.autoRestart ?? false,
      restartDelayMs: options.restartDelayMs ?? 700,
      maxAutoRestarts: options.maxAutoRestarts ?? 4,
    };

    this.SpeechRecognitionCtor = getSpeechRecognitionCtor();
    this.isSupported = Boolean(this.SpeechRecognitionCtor);

    this.recognition = null;
    this.status = 'idle';
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.segments = [];
    this.lastError = null;

    this.isListening = false;
    this.destroyed = false;
    this.userWantsToListen = false;
    this.stopRequested = false;
    this.abortRequested = false;
    this.startInFlight = false;
    this.restartAttempts = 0;
    this.restartTimer = null;

    if (this.isSupported) {
      this.recognition = this.createRecognition();
    } else {
      this.lastError = this.createErrorDetail('unsupported-browser');
    }
  }

  createRecognition() {
    const recognition = new this.SpeechRecognitionCtor();

    recognition.lang = this.options.lang;
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;
    recognition.maxAlternatives = this.options.maxAlternatives;

    recognition.onstart = () => {
      this.startInFlight = false;
      this.isListening = true;
      this.stopRequested = false;
      this.abortRequested = false;
      this.restartAttempts = 0;
      this.setStatus('listening');
      this.dispatch('start', this.getSnapshot());
    };

    recognition.onresult = (event) => {
      this.handleResult(event);
    };

    recognition.onerror = (event) => {
      this.handleErrorEvent(event);
    };

    recognition.onspeechend = () => {
      if (this.userWantsToListen && this.options.autoRestart) {
        this.setStatus('processing');
      }
    };

    recognition.onend = () => {
      this.handleEnd();
    };

    return recognition;
  }

  createErrorDetail(code, fallbackMessage) {
    return {
      code,
      message: fallbackMessage ?? normalizeRecognitionError(code),
      timestamp: Date.now(),
    };
  }

  setStatus(nextStatus) {
    if (this.status === nextStatus) {
      return;
    }

    const previousStatus = this.status;
    this.status = nextStatus;
    this.dispatch('statuschange', {
      status: nextStatus,
      previousStatus,
      snapshot: this.getSnapshot(),
    });
  }

  handleResult(event) {
    let interimTranscript = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcriptPart = result[0]?.transcript?.trim() ?? '';

      if (!transcriptPart) {
        continue;
      }

      if (result.isFinal) {
        this.segments.push(transcriptPart);
      } else {
        interimTranscript += `${transcriptPart} `;
      }
    }

    this.interimTranscript = interimTranscript.trim();
    this.finalTranscript = this.segments.join(' ').trim();
    this.lastError = null;

    if (this.userWantsToListen) {
      this.setStatus('listening');
    }

    this.dispatch('transcript', this.getSnapshot());
  }

  handleErrorEvent(event) {
    const errorCode = event?.error ?? 'unknown';
    this.startInFlight = false;

    this.lastError = this.createErrorDetail(
      errorCode,
      event?.message ?? normalizeRecognitionError(errorCode)
    );

    if (errorCode === 'aborted' && this.abortRequested) {
      this.userWantsToListen = false;
      this.setStatus('idle');
    } else {
      this.setStatus('error');
    }

    if (NON_RESTARTABLE_ERRORS.has(errorCode)) {
      this.userWantsToListen = false;
    }

    const detail = {
      ...this.lastError,
      snapshot: this.getSnapshot(),
    };

    this.dispatch('error', detail);
  }

  handleEnd() {
    const shouldAutoRestart =
      this.options.autoRestart &&
      this.userWantsToListen &&
      !this.stopRequested &&
      !this.abortRequested &&
      !this.destroyed &&
      !this.lastError;

    this.isListening = false;
    this.startInFlight = false;
    this.dispatch('end', this.getSnapshot());

    if (shouldAutoRestart) {
      this.scheduleRestart();
      return;
    }

    if (RESTARTABLE_STATUS.has(this.status) || this.status === 'listening') {
      this.setStatus('idle');
    }

    if (!this.stopRequested && !this.abortRequested) {
      this.userWantsToListen = false;
    }

    this.stopRequested = false;
    this.abortRequested = false;
  }

  scheduleRestart() {
    if (this.restartAttempts >= this.options.maxAutoRestarts) {
      this.lastError = this.createErrorDetail(
        'restart-limit',
        'Speech recognition stopped repeatedly and auto-restart was paused.'
      );
      this.userWantsToListen = false;
      this.setStatus('error');
      this.dispatch('error', {
        ...this.lastError,
        snapshot: this.getSnapshot(),
      });
      return;
    }

    clearTimeout(this.restartTimer);
    this.restartAttempts += 1;
    this.setStatus('processing');

    this.restartTimer = window.setTimeout(() => {
      this.restartTimer = null;

      if (!this.userWantsToListen || this.destroyed) {
        this.setStatus('idle');
        return;
      }

      this.lastError = null;
      this.start();
    }, this.options.restartDelayMs);
  }

  start() {
    if (this.destroyed) {
      throw new Error('SpeechTranscriber was destroyed and cannot be reused.');
    }

    if (!this.recognition) {
      const detail = this.createErrorDetail(
        'unsupported-browser',
        'This browser does not support the Web Speech API for speech recognition.'
      );
      this.lastError = detail;
      this.setStatus('error');
      this.dispatch('error', {
        ...detail,
        snapshot: this.getSnapshot(),
      });
      return this.getSnapshot();
    }

    if (this.isListening || this.startInFlight) {
      return this.getSnapshot();
    }

    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    this.userWantsToListen = true;
    this.stopRequested = false;
    this.abortRequested = false;
    this.lastError = null;
    this.startInFlight = true;
    this.setStatus('processing');

    try {
      this.recognition.start();
    } catch (error) {
      this.startInFlight = false;

      // Browsers can throw InvalidStateError if start is called too quickly.
      if (error?.name === 'InvalidStateError') {
        this.setStatus(this.isListening ? 'listening' : 'idle');
        return this.getSnapshot();
      }

      const detail = this.createErrorDetail(
        error?.name ?? 'start-failed',
        error?.message ?? 'Speech recognition could not start.'
      );
      this.lastError = detail;
      this.userWantsToListen = false;
      this.setStatus('error');
      this.dispatch('error', {
        ...detail,
        snapshot: this.getSnapshot(),
      });
    }

    return this.getSnapshot();
  }

  stop() {
    if (!this.recognition || this.destroyed) {
      return this.getSnapshot();
    }

    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    this.userWantsToListen = false;
    this.stopRequested = true;
    this.abortRequested = false;

    if (this.isListening || this.startInFlight) {
      this.setStatus('processing');

      try {
        this.recognition.stop();
      } catch (_error) {
        this.setStatus('idle');
      }
    } else if (this.status !== 'error') {
      this.setStatus('idle');
    }

    return this.getSnapshot();
  }

  abort() {
    if (!this.recognition || this.destroyed) {
      return this.getSnapshot();
    }

    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    this.userWantsToListen = false;
    this.stopRequested = false;
    this.abortRequested = true;

    try {
      this.recognition.abort();
    } catch (_error) {
      this.abortRequested = false;
      this.setStatus('idle');
    }

    return this.getSnapshot();
  }

  reset() {
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.segments = [];
    this.lastError = null;

    if (!this.isListening && !this.startInFlight) {
      this.setStatus('idle');
    }

    const snapshot = this.getSnapshot();
    this.dispatch('reset', snapshot);
    this.dispatch('transcript', snapshot);
    return snapshot;
  }

  updateOptions(nextOptions = {}) {
    this.options = {
      ...this.options,
      ...nextOptions,
    };

    if (this.recognition) {
      this.recognition.lang = this.options.lang;
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = this.options.interimResults;
      this.recognition.maxAlternatives = this.options.maxAlternatives;
    }

    return this.getSnapshot();
  }

  getFullTranscript() {
    return [this.finalTranscript, this.interimTranscript].filter(Boolean).join(' ').trim();
  }

  getSnapshot() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      status: this.status,
      finalTranscript: this.finalTranscript,
      interimTranscript: this.interimTranscript,
      fullTranscript: this.getFullTranscript(),
      segments: [...this.segments],
      lastError: this.lastError,
      options: { ...this.options },
      userWantsToListen: this.userWantsToListen,
    };
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    clearTimeout(this.restartTimer);
    this.restartTimer = null;

    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onspeechend = null;
      this.recognition.onend = null;

      try {
        this.recognition.abort();
      } catch (_error) {
        // Abort can throw if the recognizer is already idle.
      }
    }

    this.recognition = null;
    this.userWantsToListen = false;
    this.isListening = false;
    this.startInFlight = false;
    this.stopRequested = false;
    this.abortRequested = false;
    this.setStatus('idle');
  }

  dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export function createSpeechTranscriber(options) {
  return new SpeechTranscriber(options);
}
