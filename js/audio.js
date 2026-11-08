/**
 * Bộ tổng hợp âm thanh Game Show (Web Audio API - không phụ thuộc file MP3 ngoài)
 */
(function (global) {
  let ctx = null;
  let muted = localStorage.getItem("dm_sound_muted") === "1";

  function ensureContext() {
    if (muted) return null;
    const AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration, type = "sine", gainVal = 0.14, delay = 0, slideTo = null) {
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  global.SoundFX = {
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      localStorage.setItem("dm_sound_muted", muted ? "1" : "0");
      if (!muted) {
        this.click();
      }
      return muted;
    },
    unlock() {
      ensureContext();
    },
    click() {
      playTone(620, 0.06, "triangle", 0.08);
    },
    join() {
      playTone(523.25, 0.09, "triangle", 0.11, 0);
      playTone(659.25, 0.12, "triangle", 0.12, 0.07);
    },
    tick(urgent = false) {
      if (urgent) {
        playTone(880, 0.07, "square", 0.08, 0);
      } else {
        playTone(540, 0.045, "triangle", 0.055, 0);
      }
    },
    lock() {
      playTone(440, 0.12, "sawtooth", 0.1, 0);
      playTone(330, 0.25, "triangle", 0.14, 0.1);
    },
    eventStorm() {
      // Tiếng còi báo động biến cố kinh tế
      playTone(380, 0.22, "sawtooth", 0.11, 0, 580);
      playTone(580, 0.24, "sawtooth", 0.11, 0.22, 340);
      playTone(420, 0.28, "triangle", 0.13, 0.46, 660);
    },
    eventBoom() {
      // Tiếng kèn hội nhập / được mùa Khoán 10
      playTone(392.0, 0.12, "triangle", 0.13, 0);
      playTone(523.25, 0.12, "triangle", 0.13, 0.1);
      playTone(659.25, 0.14, "triangle", 0.14, 0.2);
      playTone(783.99, 0.32, "triangle", 0.16, 0.31);
    },
    correct() {
      playTone(523.25, 0.1, "triangle", 0.13, 0);
      playTone(659.25, 0.1, "triangle", 0.13, 0.08);
      playTone(783.99, 0.22, "triangle", 0.15, 0.16);
    },
    wrong() {
      playTone(280, 0.16, "sawtooth", 0.09, 0, 210);
      playTone(210, 0.26, "sawtooth", 0.1, 0.15, 145);
    },
    victory() {
      const notes = [
        [523.25, 0.13, 0],
        [523.25, 0.11, 0.14],
        [523.25, 0.11, 0.26],
        [659.25, 0.26, 0.38],
        [587.33, 0.18, 0.66],
        [659.25, 0.18, 0.86],
        [783.99, 0.5, 1.06]
      ];
      notes.forEach(([f, d, t]) => playTone(f, d, "triangle", 0.16, t));
    }
  };
})(window);
