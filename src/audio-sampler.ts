import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { getAudioDuration } from "@pico-brief/audio-duration";
import { SpeechServiceError } from "./errors.js";

const execFileAsync = promisify(execFile);

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Extracts short audio clips from different positions in the audio,
 * runs language detection on each clip, and aggregates the results.
 *
 * Requires ffmpeg for clip extraction. Audio duration is determined
 * via @pico-brief/audio-duration (no ffprobe needed).
 */
export async function sampleAndDetect(
    audio: Buffer | string,
    ffmpegPath: string,
    detectFn: (clip: Buffer) => Promise<Map<string, number>>,
): Promise<Map<string, number>> {
    const tempFiles: string[] = [];

    try {
        // Prepare input path (save Buffer to temp file if needed)
        let inputPath: string;
        if (Buffer.isBuffer(audio)) {
            inputPath = tempPath("input");
            writeFileSync(inputPath, audio);
            tempFiles.push(inputPath);
        } else {
            inputPath = audio;
        }

        // Get duration via @pico-brief/audio-duration
        const audioBytes = Buffer.isBuffer(audio)
            ? audio
            : readFileSync(inputPath);
        const ab = audioBytes.buffer.slice(audioBytes.byteOffset, audioBytes.byteOffset + audioBytes.byteLength) as ArrayBuffer;
        const duration = getAudioDuration(ab);
        if (duration <= 0) {
            throw new SpeechServiceError("Failed to determine audio duration", "INVALID_INPUT");
        }

        // Derive extension from input path for clip extraction (-c copy needs matching container)
        const inputExt = inputPath.split(".").pop() ?? "wav";

        // Build sampling ranges
        const ranges = buildSamplingRanges(duration);

        // Extract each clip and run detection
        const results: Map<string, number>[] = [];

        for (const range of ranges) {
            const clipPath = tempPath(`clip.${inputExt}`);
            tempFiles.push(clipPath);

            try {
                await extractClip(ffmpegPath, inputPath, range.start, range.end, clipPath);
                const clipBuffer = readFileSync(clipPath);
                const clipResult = await detectFn(clipBuffer);
                results.push(clipResult);
            } catch {
                // Skip clips that fail to extract or detect
            }
        }

        // Aggregate counts across all clips
        const counts = new Map<string, number>();
        for (const result of results) {
            for (const [lang, count] of result) {
                counts.set(lang, (counts.get(lang) ?? 0) + count);
            }
        }

        if (counts.size === 0) {
            throw new SpeechServiceError(
                "Language detection failed: no audio clips could be analyzed",
                "TRANSCRIPTION_FAILED",
            );
        }

        return counts;
    } finally {
        for (const file of tempFiles) {
            try { unlinkSync(file); } catch { /* ignore cleanup errors */ }
        }
    }
}

// ─── Internals ──────────────────────────────────────────────────────────────

async function extractClip(
    ffmpegPath: string,
    inputPath: string,
    start: number,
    end: number,
    outputPath: string,
): Promise<void> {
    await execFileAsync(ffmpegPath, [
        "-y",
        "-ss", formatTimestamp(start),
        "-to", formatTimestamp(end),
        "-i", inputPath,
        "-c", "copy",
        outputPath,
    ]);
}

/**
 * Determines how many samples to take based on audio duration,
 * and where to position them.
 *
 * Each sample is ~10 seconds long. For audio >3 minutes, the first and last
 * 10 seconds are also included.
 */
function buildSamplingRanges(duration: number): { start: number; end: number }[] {
    const durationMinutes = duration / 60;

    let numSamples = 1;
    if (durationMinutes > 180) {
        numSamples = Math.min(Math.round(Math.sqrt(duration / 300)), 12);
    } else if (durationMinutes > 60) {
        numSamples = 4;
    } else if (durationMinutes > 20) {
        numSamples = 3;
    } else if (durationMinutes > 5) {
        numSamples = 2;
    }

    const spacing = duration / (numSamples + 1);
    const locations = Array.from({ length: numSamples }, (_, i) => (i + 1) * spacing);
    // Add ±5s jitter so we don't always hit the same spots
    const jittered = locations.map((loc) => loc + Math.random() * 10 - 5);

    const ranges = jittered.map((loc) => ({
        start: Math.max(0, loc - 5),
        end: Math.min(loc + 5, duration),
    }));

    // For audio >3 minutes, also sample the first and last 10 seconds
    if (durationMinutes > 3) {
        ranges.push({ start: 0, end: Math.min(10, duration) });
        ranges.push({ start: Math.max(0, duration - 10), end: duration });
    }

    return ranges;
}

function formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

function tempPath(suffix: string): string {
    return join(tmpdir(), `speech-detect-${randomUUID()}.${suffix}`);
}
