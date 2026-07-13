// חד-פעמי: מסנתז 4 רצועות מוזיקת רקע אינסטרומנטליות בקוד טהור (ללא AI
// בתשלום — additive synthesis + envelopes ידניים), ומעלה אותן ל-Cloudinary
// תחת ה-public_id הקבוע שהקוד (lib/studio-transform.ts, lib/studio-audio-cloudinary.ts)
// כבר מצפה לו. דורש ffmpeg מותקן (להמרת WAV -> MP3).
import dotenv from "dotenv";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

dotenv.config({ path: ".env.local" });

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 20;
const N = SAMPLE_RATE * DURATION_SECONDS;

function midiToFreq(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

/** אוסילטור עם הרמוניות (טימבר חם, פסנתר/מיתרים) */
function harmonicWave(freq, t, harmonics) {
  let v = 0;
  for (const [mult, amp] of harmonics) {
    v += amp * Math.sin(2 * Math.PI * freq * mult * t);
  }
  return v;
}

/** מעטפת ADSR פשוטה, 0..1 */
function envelope(tRel, dur, attack, release) {
  if (tRel < 0 || tRel > dur) return 0;
  if (tRel < attack) return tRel / attack;
  if (tRel > dur - release) return Math.max(0, (dur - tRel) / release);
  return 1;
}

/** מוסיף תו בודד (עם דיטיון קל לערוץ שמאל/ימין לתחושת רוחב) לבאפר סטריאו */
function addNote(bufL, bufR, freq, startSec, dur, amp, harmonics, attack, release, pan = 0) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const durSamples = Math.floor(dur * SAMPLE_RATE);
  const detune = 0.997;
  for (let i = 0; i < durSamples; i++) {
    const idx = startSample + i;
    if (idx < 0 || idx >= N) continue;
    const tRel = i / SAMPLE_RATE;
    const env = envelope(tRel, dur, attack, release);
    if (env <= 0) continue;
    const t = idx / SAMPLE_RATE;
    const vL = harmonicWave(freq, t, harmonics) * env * amp;
    const vR = harmonicWave(freq * detune, t, harmonics) * env * amp;
    bufL[idx] += vL * (1 - Math.max(0, pan));
    bufR[idx] += vR * (1 - Math.max(0, -pan));
  }
}

function pcmToWavBuffer(bufL, bufR) {
  const numSamples = bufL.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 2;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(2, 22); // channels
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const l = Math.max(-1, Math.min(1, bufL[i]));
    const r = Math.max(-1, Math.min(1, bufR[i]));
    buffer.writeInt16LE(Math.round(l * 32767), offset);
    buffer.writeInt16LE(Math.round(r * 32767), offset + 2);
    offset += 4;
  }
  return buffer;
}

// טימברים
const PIANO_HARMONICS = [
  [1, 1], [2, 0.35], [3, 0.15], [4, 0.08],
];
const PAD_HARMONICS = [
  [1, 1], [2, 0.15], [3, 0.05],
];
const STRINGS_HARMONICS = [
  [1, 1], [2, 0.25], [3, 0.12], [4, 0.06], [5, 0.03],
];
const PLUCK_HARMONICS = [
  [1, 1], [2, 0.5], [3, 0.25], [4, 0.1],
];

function makeTrack(build) {
  const bufL = new Float64Array(N);
  const bufR = new Float64Array(N);
  build(bufL, bufR);
  // נורמליזציה עדינה כדי למנוע קליפינג בלי לדחוס יתר על המידה
  let peak = 0;
  for (let i = 0; i < N; i++) {
    peak = Math.max(peak, Math.abs(bufL[i]), Math.abs(bufR[i]));
  }
  const gain = peak > 0 ? 0.85 / peak : 1;
  for (let i = 0; i < N; i++) {
    bufL[i] *= gain;
    bufR[i] *= gain;
  }
  return { bufL, bufR };
}

// אקורדים כמערכי תווי MIDI (רביעיות/תשיעיות עדינות, לא טריאדות פשוטות)
const CHORDS = {
  cMaj9: [60, 64, 67, 71, 74], // C E G B D
  aMin9: [57, 60, 64, 67, 71], // A C E G B
  fMaj9: [53, 57, 60, 64, 67], // F A C E G
  g6: [55, 59, 62, 64, 67], // G B D E G
  dMin: [50, 53, 57, 62],
  bbMaj: [58, 62, 65, 70],
  fMaj: [53, 57, 60, 65],
  cMaj: [48, 52, 55, 60],
  cMaj7: [48, 55, 59, 64],
  gMaj: [43, 50, 55, 59],
  aMin: [45, 52, 57, 60],
  fMaj7: [41, 48, 53, 57],
};

const STYLES = [
  {
    id: "luxury",
    label: "יוקרה עדינה — פסנתר ומיתרים",
    build: () =>
      makeTrack((bufL, bufR) => {
        const progression = [CHORDS.cMaj9, CHORDS.aMin9, CHORDS.fMaj9, CHORDS.g6];
        const chordDur = 5;
        progression.forEach((chord, ci) => {
          const start = ci * chordDur;
          // פד מיתרים רך מתחת
          chord.forEach((note, ni) => {
            addNote(
              bufL, bufR, midiToFreq(note - 12), start, chordDur + 0.5,
              0.045, PAD_HARMONICS, 1.2, 1.8, (ni - chord.length / 2) * 0.15
            );
          });
          // ארפג'יו פסנתר עדין מעל
          const arpNotes = [...chord, chord[0] + 12];
          arpNotes.forEach((note, ni) => {
            addNote(
              bufL, bufR, midiToFreq(note), start + ni * 0.55, 1.1,
              0.05, PIANO_HARMONICS, 0.02, 0.9, (ni % 2 === 0 ? 1 : -1) * 0.3
            );
          });
        });
      }),
  },
  {
    id: "cinematic",
    label: "קולנועי — תזמורת עדינה",
    build: () =>
      makeTrack((bufL, bufR) => {
        const progression = [CHORDS.dMin, CHORDS.bbMaj, CHORDS.fMaj, CHORDS.cMaj];
        const chordDur = 5;
        progression.forEach((chord, ci) => {
          const start = ci * chordDur;
          chord.forEach((note, ni) => {
            addNote(
              bufL, bufR, midiToFreq(note - 12), start, chordDur + 1,
              0.06, STRINGS_HARMONICS, 2.2, 2.2, (ni - chord.length / 2) * 0.2
            );
          });
          // תמיכה עדינה אוקטבה מעל, נכנסת קצת מאוחר יותר לתחושת "התעצמות"
          chord.forEach((note, ni) => {
            addNote(
              bufL, bufR, midiToFreq(note), start + 0.8, chordDur - 0.6,
              0.035, STRINGS_HARMONICS, 1.8, 1.5, (ni - chord.length / 2) * -0.15
            );
          });
        });
      }),
  },
  {
    id: "soft",
    label: "רך ואווירתי — אמביינט",
    build: () =>
      makeTrack((bufL, bufR) => {
        const progression = [CHORDS.fMaj7, CHORDS.aMin9 ?? CHORDS.aMin9, CHORDS.cMaj7, CHORDS.gMaj];
        const chordDur = 10;
        progression.slice(0, 2).forEach((chord, ci) => {
          const start = ci * chordDur;
          chord.forEach((note, ni) => {
            addNote(
              bufL, bufR, midiToFreq(note - 12), start, chordDur + 1.5,
              0.045, PAD_HARMONICS, 3.5, 4, (ni - chord.length / 2) * 0.25
            );
          });
        });
      }),
  },
  {
    id: "upbeat",
    label: "מודרני וקליל — פריטה עדינה",
    build: () =>
      makeTrack((bufL, bufR) => {
        const progression = [CHORDS.cMaj, CHORDS.gMaj, CHORDS.aMin, CHORDS.fMaj];
        const chordDur = 5;
        const beat = 0.375; // ~160 BPM feel אבל עדין, לא תופים
        progression.forEach((chord, ci) => {
          const start = ci * chordDur;
          // פד רקע קליל
          chord.forEach((note, ni) => {
            addNote(
              bufL, bufR, midiToFreq(note - 12), start, chordDur + 0.3,
              0.03, PAD_HARMONICS, 0.6, 1, (ni - chord.length / 2) * 0.15
            );
          });
          // פריטה מקצבית עדינה (staccato) על תווי האקורד
          const beatsPerChord = Math.floor(chordDur / beat);
          for (let b = 0; b < beatsPerChord; b++) {
            const note = chord[b % chord.length] + (b % 4 === 0 ? 12 : 0);
            addNote(
              bufL, bufR, midiToFreq(note), start + b * beat, beat * 0.9,
              0.055, PLUCK_HARMONICS, 0.005, beat * 0.7, (b % 2 === 0 ? 1 : -1) * 0.35
            );
          }
        });
      }),
  },
];

async function main() {
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary env vars missing");
  }

  for (const style of STYLES) {
    console.log(`\n=== ${style.id} (${style.label}) ===`);
    console.log("מסנתז...");
    const { bufL, bufR } = style.build();
    const wavBuffer = pcmToWavBuffer(bufL, bufR);

    const wavPath = join(tmpdir(), `studio-music-${style.id}.wav`);
    const mp3Path = join(tmpdir(), `studio-music-${style.id}.mp3`);
    writeFileSync(wavPath, wavBuffer);

    console.log("ממיר ל-MP3...");
    execFileSync("ffmpeg", [
      "-y", "-i", wavPath,
      "-codec:a", "libmp3lame", "-b:a", "192k",
      mp3Path,
    ], { stdio: "pipe" });

    const mp3Buffer = new Uint8Array(await import("node:fs").then((fs) => fs.readFileSync(mp3Path)));

    const publicId = `yerushalmi-studio/music/${style.id}`;
    const form = new FormData();
    form.append("file", new Blob([mp3Buffer], { type: "audio/mpeg" }), `${style.id}.mp3`);
    form.append("upload_preset", uploadPreset);
    form.append("public_id", publicId);
    form.append("resource_type", "video");

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      { method: "POST", body: form }
    );
    const json = await uploadResponse.json();

    if (!uploadResponse.ok || !json.public_id) {
      throw new Error(
        `Cloudinary upload failed for ${style.id}: ${JSON.stringify(json)}`
      );
    }

    console.log("הועלה ל-Cloudinary:", json.public_id, json.secure_url);

    unlinkSync(wavPath);
    unlinkSync(mp3Path);
  }

  console.log("\nהושלם. כל 4 הרצועות נוצרו והועלו.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
