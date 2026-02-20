import type { PlayHTConfig, PlayHTSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { BASE_URL } from "./types.js";

export async function synthesize(
    config: PlayHTConfig,
    text: string,
    voice: string,
    language: string | undefined,
    options: PlayHTSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const {
        voiceEngine = "Play3.0-mini",
        outputFormat = "mp3",
        speed,
        sampleRate,
        quality,
    } = options;

    const body: Record<string, unknown> = {
        text,
        voice,
        voice_engine: voiceEngine,
        output_format: outputFormat,
    };

    if (speed !== undefined) body.speed = speed;
    if (sampleRate !== undefined) body.sample_rate = sampleRate;
    if (quality) body.quality = quality;
    if (language) body.language = language.toLowerCase();

    const response = await fetch(`${BASE_URL}/tts/stream`, {
        method: "POST",
        headers: {
            "X-USER-ID": config.userId,
            AUTHORIZATION: config.apiKey,
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `PlayHT TTS failed: ${errorText}`,
            "API_ERROR",
            "playht",
            response.status,
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
        audio: Buffer.from(arrayBuffer),
        format: detectFormatFromString(outputFormat),
        voice,
    };
}
