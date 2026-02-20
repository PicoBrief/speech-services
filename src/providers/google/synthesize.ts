import type { GoogleConfig, GoogleSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { TTS_BASE_URL } from "./types.js";

export async function synthesize(
    config: GoogleConfig,
    text: string,
    voice: string,
    language: string | undefined,
    options: GoogleSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const { audioEncoding = "MP3", speakingRate, pitch } = options;

    // Infer language from voice name if not provided (e.g., "en-US-Neural2-A" → "en-US")
    const lang = language ?? voice.split("-").slice(0, 2).join("-");

    const audioConfig: Record<string, unknown> = { audioEncoding };
    if (speakingRate !== undefined) audioConfig.speakingRate = speakingRate;
    if (pitch !== undefined) audioConfig.pitch = pitch;

    const body = {
        input: { text },
        voice: { languageCode: lang, name: voice },
        audioConfig,
    };

    const response = await fetch(`${TTS_BASE_URL}/text:synthesize?key=${config.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Google TTS failed: ${errorText}`,
            "API_ERROR",
            "google",
            response.status,
        );
    }

    const result = (await response.json()) as { audioContent: string };
    const audioBuffer = Buffer.from(result.audioContent, "base64");

    return {
        audio: audioBuffer,
        format: detectFormatFromString(audioEncoding),
        voice,
    };
}
