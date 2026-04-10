// Browser-only wrapper around speechSynthesis.
// Voice availability differs by browser and voices may load asynchronously.

function getSpeechSynthesisApi() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.speechSynthesis || null;
}

function getUtteranceCtor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechSynthesisUtterance || null;
}

export class SpeechSynthesizer extends EventTarget {
  constructor(options = {}) {
    super();

    this.options = {
      voice: options.voice ?? '',
      lang: options.lang ?? 'en-US',
      rate: options.rate ?? 1,
      pitch: options.pitch ?? 1,
      volume: options.volume ?? 1,
    };

    this.speechSynthesis = getSpeechSynthesisApi();
    this.UtteranceCtor = getUtteranceCtor();
    this.isSupported = Boolean(this.speechSynthesis && this.UtteranceCtor);

    this.status = 'idle';
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentText = '';
    this.currentUtterance = null;
    this.lastError = null;
    this.destroyed = false;
    this.voices = [];

    this.handleVoicesChanged = this.handleVoicesChanged.bind(this);

    if (this.isSupported) {
      this.refreshVoices();
      this.speechSynthesis.addEventListener('voiceschanged', this.handleVoicesChanged);
    }
  }

  setStatus(nextStatus) {
    this.status = nextStatus;
  }

  handleVoicesChanged() {
    this.refreshVoices();
    this.dispatch('voiceschanged', this.getSnapshot());
  }

  refreshVoices() {
    if (!this.speechSynthesis) {
      this.voices = [];
      return this.voices;
    }

    this.voices = this.speechSynthesis.getVoices();
    return this.voices;
  }

  getVoices() {
    return [...this.refreshVoices()];
  }

  resolveVoice(preferredVoice) {
    const voiceName = typeof preferredVoice === 'string' ? preferredVoice : preferredVoice?.name;
    if (!voiceName) {
      return null;
    }

    return this.voices.find((voice) => voice.name === voiceName) ?? null;
  }

  speak(text, overrides = {}) {
    if (this.destroyed) {
      throw new Error('SpeechSynthesizer was destroyed and cannot be reused.');
    }

    if (!this.isSupported) {
      const detail = {
        code: 'unsupported-browser',
        message: 'This browser does not support speech synthesis.',
        snapshot: this.getSnapshot(),
      };
      this.lastError = detail;
      this.setStatus('error');
      this.dispatch('error', detail);
      return this.getSnapshot();
    }

    const nextText = String(text ?? '').trim();
    if (!nextText) {
      return this.getSnapshot();
    }

    this.stop();
    this.refreshVoices();

    const nextOptions = {
      ...this.options,
      ...overrides,
    };

    const utterance = new this.UtteranceCtor(nextText);
    const selectedVoice = this.resolveVoice(nextOptions.voice);

    utterance.lang = nextOptions.lang;
    utterance.rate = nextOptions.rate;
    utterance.pitch = nextOptions.pitch;
    utterance.volume = nextOptions.volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || utterance.lang;
    }

    utterance.onstart = () => {
      this.currentText = nextText;
      this.isSpeaking = true;
      this.isPaused = false;
      this.lastError = null;
      this.setStatus('speaking');
      this.dispatch('start', this.getSnapshot());
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = '';
      this.currentUtterance = null;
      this.setStatus('idle');
      this.dispatch('end', this.getSnapshot());
    };

    utterance.onpause = () => {
      this.isPaused = true;
      this.setStatus('paused');
      this.dispatch('pause', this.getSnapshot());
    };

    utterance.onresume = () => {
      this.isPaused = false;
      this.setStatus('speaking');
      this.dispatch('resume', this.getSnapshot());
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = '';
      this.currentUtterance = null;
      this.lastError = {
        code: event.error ?? 'synthesis-error',
        message: event.error || 'Speech synthesis failed.',
      };
      this.setStatus('error');
      this.dispatch('error', {
        ...this.lastError,
        snapshot: this.getSnapshot(),
      });
    };

    this.currentUtterance = utterance;
    this.options = nextOptions;
    this.speechSynthesis.speak(utterance);
    return this.getSnapshot();
  }

  pause() {
    if (!this.speechSynthesis || !this.isSpeaking || this.isPaused) {
      return this.getSnapshot();
    }

    this.speechSynthesis.pause();
    return this.getSnapshot();
  }

  resume() {
    if (!this.speechSynthesis || !this.isPaused) {
      return this.getSnapshot();
    }

    this.speechSynthesis.resume();
    return this.getSnapshot();
  }

  stop() {
    if (!this.speechSynthesis) {
      return this.getSnapshot();
    }

    this.speechSynthesis.cancel();
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentText = '';
    this.setStatus('idle');
    return this.getSnapshot();
  }

  cancel() {
    return this.stop();
  }

  updateOptions(nextOptions = {}) {
    this.options = {
      ...this.options,
      ...nextOptions,
    };

    return this.getSnapshot();
  }

  getSnapshot() {
    return {
      isSupported: this.isSupported,
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      status: this.status,
      currentText: this.currentText,
      lastError: this.lastError,
      options: { ...this.options },
      voices: this.voices.map((voice) => ({
        default: voice.default,
        lang: voice.lang,
        localService: voice.localService,
        name: voice.name,
      })),
    };
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.stop();

    if (this.speechSynthesis) {
      this.speechSynthesis.removeEventListener('voiceschanged', this.handleVoicesChanged);
    }

    this.currentUtterance = null;
    this.voices = [];
  }

  dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export function createSpeechSynthesizer(options) {
  return new SpeechSynthesizer(options);
}
