export type SwitchSoundPack =
  "soft" | "mechanical" | "typewriter" | "arcade" | "minimal";
export interface KeyboardAudio {
  unlock(): Promise<void>;
  play(pack: SwitchSoundPack, volume: number): void;
  dispose(): void;
}

/** Procedural switch voices: no audio downloads and no context before a user gesture. */
export function createKeyboardAudio(): KeyboardAudio {
  let context: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let disposed = false;
  const voices = new Set<AudioScheduledSourceNode>();
  const unlock = async () => {
    if (disposed) return;
    context ??= new AudioContext();
    if (context.state === "suspended") await context.resume();
  };
  const play = (pack: SwitchSoundPack, volume: number) => {
    if (
      !context ||
      context.state !== "running" ||
      disposed ||
      !Number.isFinite(volume) ||
      volume <= 0
    )
      return;
    const audio = context;
    const now = audio.currentTime;
    const level = Math.min(1, volume);
    const config = {
      soft: {
        frequency: 430,
        end: 180,
        duration: 0.04,
        gain: 0.065,
        type: "sine" as OscillatorType,
      },
      mechanical: {
        frequency: 190,
        end: 78,
        duration: 0.075,
        gain: 0.19,
        type: "triangle" as OscillatorType,
      },
      typewriter: {
        frequency: 1250,
        end: 240,
        duration: 0.045,
        gain: 0.035,
        type: "square" as OscillatorType,
      },
      arcade: {
        frequency: 880,
        end: 440,
        duration: 0.06,
        gain: 0.025,
        type: "square" as OscillatorType,
      },
      minimal: {
        frequency: 1650,
        end: 1200,
        duration: 0.016,
        gain: 0.035,
        type: "sine" as OscillatorType,
      },
    }[pack] ?? {
      frequency: 430,
      end: 180,
      duration: 0.04,
      gain: 0.065,
      type: "sine" as OscillatorType,
    };
    const source = audio.createOscillator();
    const gain = audio.createGain();
    source.type = config.type;
    source.frequency.setValueAtTime(config.frequency, now);
    source.frequency.exponentialRampToValueAtTime(
      config.end,
      now + config.duration,
    );
    gain.gain.setValueAtTime(level * config.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
    source.connect(gain);
    gain.connect(audio.destination);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(now);
    source.stop(now + config.duration);
    if (pack === "mechanical" || pack === "typewriter") {
      if (!noise) {
        noise = audio.createBuffer(
          1,
          Math.ceil(audio.sampleRate * 0.08),
          audio.sampleRate,
        );
        const samples = noise.getChannelData(0);
        for (let index = 0; index < samples.length; index++)
          samples[index] =
            (Math.random() * 2 - 1) * (1 - index / samples.length);
      }
      const click = audio.createBufferSource(),
        filter = audio.createBiquadFilter(),
        clickGain = audio.createGain();
      click.buffer = noise;
      filter.type = "bandpass";
      filter.frequency.value = pack === "mechanical" ? 1400 : 3200;
      filter.Q.value = 0.8;
      clickGain.gain.setValueAtTime(
        level * (pack === "mechanical" ? 0.13 : 0.08),
        now,
      );
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      click.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(audio.destination);
      voices.add(click);
      click.onended = () => {
        voices.delete(click);
        click.disconnect();
        filter.disconnect();
        clickGain.disconnect();
      };
      click.start(now);
      click.stop(now + 0.045);
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {
        /* Already ended. */
      }
      voice.disconnect();
    }
    voices.clear();
    noise = null;
    if (context && context.state !== "closed")
      void context.close().catch(() => undefined);
    context = null;
  };
  return { unlock, play, dispose };
}
