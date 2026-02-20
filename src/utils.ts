import { SpeechServiceError } from "./errors.js";

// ─── Polling ────────────────────────────────────────────────────────────────

export async function poll<T>(
    fn: () => Promise<T>,
    isDone: (result: T) => boolean,
    interval: number,
    timeout: number,
    provider: string,
): Promise<T> {
    const start = Date.now();
    while (true) {
        const result = await fn();
        if (isDone(result)) return result;
        if (Date.now() - start > timeout) {
            throw new SpeechServiceError(
                `Transcription timed out after ${timeout}ms`,
                "TIMEOUT",
                provider,
            );
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
}

// ─── Language Code Normalization ────────────────────────────────────────────

const ISO_639_3_TO_1: Record<string, string> = {
    eng: "en", spa: "es", fra: "fr", deu: "de", ita: "it",
    por: "pt", nld: "nl", rus: "ru", zho: "zh", jpn: "ja",
    kor: "ko", ara: "ar", hin: "hi", tur: "tr", pol: "pl",
    swe: "sv", nor: "no", dan: "da", fin: "fi", ces: "cs",
    ron: "ro", hun: "hu", ell: "el", heb: "he", tha: "th",
    vie: "vi", ind: "id", msa: "ms", ukr: "uk", cat: "ca",
    hrv: "hr", bul: "bg", slk: "sk", slv: "sl", lit: "lt",
    lav: "lv", est: "et", fil: "fil", tam: "ta", tel: "te",
    ben: "bn", urd: "ur", fas: "fa", afr: "af", swa: "sw",
    cmn: "zh", yue: "yue",
};

/**
 * Normalizes a language code to BCP-47 format.
 *
 * Handles:
 * - AssemblyAI format: "en_us" → "en-US"
 * - ElevenLabs ISO 639-3: "eng" → "en"
 * - Already BCP-47: "en-US" → "en-US" (passthrough)
 * - Lowercase BCP-47: "en-us" → "en-US"
 */
export function normalizeLanguageCode(code: string): string {
    if (!code) return code;

    // ISO 639-3 (3-letter code with no region)
    const lower = code.toLowerCase();
    if (lower.length === 3 && ISO_639_3_TO_1[lower]) {
        return ISO_639_3_TO_1[lower];
    }

    // AssemblyAI underscore format: "en_us" → "en-US"
    if (code.includes("_")) {
        const parts = code.split("_");
        if (parts.length === 2) {
            return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
        }
        return code;
    }

    // BCP-47 with region: "en-us" → "en-US"
    if (code.includes("-")) {
        const parts = code.split("-");
        if (parts.length === 2 && parts[1].length === 2) {
            return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
        }
        return code;
    }

    // Just a 2-letter code like "en", return as-is
    return code.toLowerCase();
}

/**
 * Extracts the base language from a BCP-47 code (e.g., "en-US" → "en").
 */
export function getBaseLanguage(code: string): string {
    if (!code) return code;
    return code.split("-")[0].split("_")[0].toLowerCase();
}

// ─── Audio Input Helpers ────────────────────────────────────────────────────

export function isUrl(input: string): boolean {
    return input.startsWith("http://") || input.startsWith("https://") || input.startsWith("gs://");
}

export async function downloadAudio(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new SpeechServiceError(
            `Failed to download audio from ${url}: ${response.status} ${response.statusText}`,
            "DOWNLOAD_FAILED",
        );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// ─── Output Format Detection ────────────────────────────────────────────────

export function detectFormatFromString(format: string): string {
    const lower = format.toLowerCase();
    if (lower.includes("mp3") || lower.includes("mpeg")) return "mp3";
    if (lower.includes("wav") || lower.includes("pcm") || lower.includes("riff") || lower.includes("linear16")) return "wav";
    if (lower.includes("ogg") || lower.includes("opus")) return "ogg";
    if (lower.includes("webm")) return "webm";
    if (lower.includes("flac")) return "flac";
    if (lower.includes("alaw") || lower.includes("mulaw") || lower.includes("ulaw")) return "wav";
    return "mp3";
}
