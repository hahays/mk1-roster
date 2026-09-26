// Plays the provided MK3 recording in full.
export function createVersusAudio() {
  const context = new AudioContext();
  const master = context.createGain();
  master.connect(context.destination);
  const voices = new Set<AudioBufferSourceNode>();
  const decoded = new WeakMap<ArrayBuffer, Promise<AudioBuffer>>();
  let disposed = false;
  let sequence = 0;

  function stop() {
    sequence++;
    voices.forEach((source) => { try { source.stop(); } catch { /* Already stopped. */ } });
    voices.clear();
  }

  return {
    async play(volume: number, audioData: ArrayBuffer) {
      stop();
      const current = sequence;
      await context.resume();
      if (disposed || current !== sequence) return;
      master.gain.setValueAtTime(volume, context.currentTime);
      let decoding = decoded.get(audioData);
      if (!decoding) {
        decoding = context.decodeAudioData(audioData.slice(0));
        decoded.set(audioData, decoding);
      }
      const buffer = await decoding;
      if (disposed || current !== sequence) return;
      const time = context.currentTime;
      const duration = buffer.duration;
      const fade = Math.min(0.008, duration / 4);
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(1, time + fade);
      envelope.gain.setValueAtTime(1, time + duration - fade);
      envelope.gain.linearRampToValueAtTime(0, time + duration);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(envelope).connect(master);
      voices.add(source);
      source.onended = () => { source.disconnect(); envelope.disconnect(); voices.delete(source); };
      source.start(time);
    },
    setVolume(value: number) { master.gain.setTargetAtTime(value, context.currentTime, 0.025); },
    stop,
    dispose() {
      disposed = true;
      stop();
      master.disconnect();
      void context.close();
    },
  };
}
