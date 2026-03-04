import type { VoiceInfo } from "./types.js";
import { SpeechServiceError } from "./errors.js";

export interface RecommendedVoice {
    name: string;
    gender: "male" | "female";
}

export function resolveVoice(
    voices: VoiceInfo[],
    params: { voice?: string; language?: string; gender?: "male" | "female" },
    recommendedVoices?: RecommendedVoice[],
): VoiceInfo {
    if (params.voice) {
        return resolveByVoice(voices, params.voice, params.gender);
    }
    return resolveByLanguage(voices, params.language, params.gender, recommendedVoices);
}

/** Validate that all recommended voices exist in the available voice list. Warns for any missing. */
export function validateRecommendedVoices(
    voices: VoiceInfo[],
    recommended: RecommendedVoice[],
): void {
    for (const rec of recommended) {
        const found = voices.some((v) => v.id.toLowerCase() === rec.name.toLowerCase());
        if (!found) {
            console.warn(`Recommended voice "${rec.name}" is not available in the voice list`);
        }
    }
}

function resolveByVoice(
    voices: VoiceInfo[],
    voice: string,
    gender: "male" | "female" | undefined,
): VoiceInfo {
    const voiceLower = voice.toLowerCase();

    // 1. Exact match by id
    const byId = voices.find((v) => v.id.toLowerCase() === voiceLower);
    if (byId) return byId;

    // 2. Exact match by name
    const byName = voices.find((v) => v.name.toLowerCase() === voiceLower);
    if (byName) return byName;

    // 3. Fuzzy fallback: try to extract locale from the voice string and match on that
    const locale = extractLocale(voice);
    if (locale) {
        const match = pickByLocale(voices, locale, gender);
        if (match) return match;
    }

    // 4. Broader fallback: try base language
    if (locale) {
        const baseLang = locale.split("-")[0].toLowerCase();
        const match = pickByBaseLanguage(voices, baseLang, gender);
        if (match) return match;
    }

    throw new SpeechServiceError(
        `Voice "${voice}" not found and no similar voice available`,
        "VOICE_NOT_FOUND",
    );
}

function resolveByLanguage(
    voices: VoiceInfo[],
    language: string | undefined,
    gender: "male" | "female" | undefined,
    recommendedVoices?: RecommendedVoice[],
): VoiceInfo {
    if (!language) {
        throw new SpeechServiceError(
            "Either voice or languages must be provided for speech synthesis",
            "INVALID_INPUT",
        );
    }

    // 0. Try recommended voices first
    if (recommendedVoices?.length) {
        const recommended = pickRecommended(voices, recommendedVoices, language, gender);
        if (recommended) return recommended;
    }

    // 1. Exact locale match
    const match = pickByLocale(voices, language, gender);
    if (match) return match;

    // 2. Base language match
    const baseLang = language.split("-")[0].toLowerCase();
    const baseMatch = pickByBaseLanguage(voices, baseLang, gender);
    if (baseMatch) return baseMatch;

    throw new SpeechServiceError(
        `No voice found for language "${language}"`,
        "VOICE_NOT_FOUND",
    );
}

/** Pick the best voice from the recommended list that matches locale/language and gender, and is available. */
function pickRecommended(
    voices: VoiceInfo[],
    recommended: RecommendedVoice[],
    language: string,
    gender: "male" | "female" | undefined,
): VoiceInfo | undefined {
    const langLower = language.toLowerCase();

    // 1. Filter by exact locale (e.g. "en-US")
    let candidates = recommended.filter((r) => {
        const locale = extractLocale(r.name);
        return locale?.toLowerCase() === langLower;
    });

    // 2. If no locale match, try base language (e.g. "en")
    if (candidates.length === 0) {
        const baseLang = language.split("-")[0].toLowerCase();
        candidates = recommended.filter((r) => {
            const locale = extractLocale(r.name);
            return locale?.split("-")[0].toLowerCase() === baseLang;
        });
    }

    if (candidates.length === 0) return undefined;

    // 3. Filter by gender if specified
    if (gender) {
        const genderFiltered = candidates.filter((r) => r.gender === gender);
        if (genderFiltered.length > 0) {
            candidates = genderFiltered;
        }
    }

    // 4. Return the first candidate that exists in the available voices
    for (const candidate of candidates) {
        const voice = voices.find((v) => v.id.toLowerCase() === candidate.name.toLowerCase());
        if (voice) return voice;
    }

    return undefined;
}

/** Try to extract a BCP-47 locale from a voice name (e.g. "en-US-JennyNeural" → "en-US") */
function extractLocale(voice: string): string | undefined {
    const match = voice.match(/^([a-z]{2,3}-[A-Z]{2})/i);
    if (match) {
        const parts = match[1].split("-");
        return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
    }
    return undefined;
}

/** Pick the best voice matching an exact locale. Prefer matching gender, but don't require it. */
function pickByLocale(
    voices: VoiceInfo[],
    locale: string,
    gender: "male" | "female" | undefined,
): VoiceInfo | undefined {
    const localeLower = locale.toLowerCase();
    const matches = voices.filter((v) => v.locale.toLowerCase() === localeLower);
    if (matches.length === 0) return undefined;
    return preferGender(matches, gender);
}

/** Pick the best voice matching a base language (e.g. "en"). Prefer matching gender. */
function pickByBaseLanguage(
    voices: VoiceInfo[],
    baseLang: string,
    gender: "male" | "female" | undefined,
): VoiceInfo | undefined {
    const matches = voices.filter(
        (v) => v.locale.split("-")[0].toLowerCase() === baseLang,
    );
    if (matches.length === 0) return undefined;
    return preferGender(matches, gender);
}

/** From a list of candidates, prefer one matching the requested gender. If none match, return the first. */
function preferGender(
    voices: VoiceInfo[],
    gender: "male" | "female" | undefined,
): VoiceInfo {
    if (gender) {
        const genderMatch = voices.find((v) => v.gender === gender);
        if (genderMatch) return genderMatch;
    }
    return voices[0];
}
