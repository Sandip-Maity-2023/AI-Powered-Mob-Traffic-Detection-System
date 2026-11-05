// Web Audio API emergency siren and alarm buzzer synthesizer

class AlarmSoundEngine {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isSounding = false;
  private intervalId: any = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playAlarmSiren(volume: number = 0.3) {
    if (this.isSounding) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      this.isSounding = true;
      const ctx = this.audioCtx;

      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      this.gainNode.connect(ctx.destination);

      this.osc1 = ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(800, ctx.currentTime);
      this.osc1.connect(this.gainNode);
      this.osc1.start();

      let toggle = false;
      this.intervalId = setInterval(() => {
        if (!this.isSounding || !this.osc1 || !this.audioCtx) return;
        const targetFreq = toggle ? 960 : 640;
        this.osc1.frequency.exponentialRampToValueAtTime(targetFreq, this.audioCtx.currentTime + 0.25);
        toggle = !toggle;
      }, 350);
    } catch (e) {
      console.warn('Audio siren could not be initialized:', e);
    }
  }

  public stopAlarmSiren() {
    this.isSounding = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    } catch (e) {
      // Ignore audio stop cleanup errors
    }
  }

  public playNotificationBeep() {
    try {
      this.initContext();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio autoplay restriction fallback
    }
  }

  public getIsSounding(): boolean {
    return this.isSounding;
  }
}

export const alarmEngine = new AlarmSoundEngine();

