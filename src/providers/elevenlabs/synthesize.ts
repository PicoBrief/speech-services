import type { ElevenLabsConfig, ElevenLabsSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { BASE_URL } from "./types.js";

export async function synthesize(
    config: ElevenLabsConfig,
    text: string,
    voice: string,
    language: string | undefined,
    options: ElevenLabsSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const {
        modelId = "eleven_multilingual_v2",
        outputFormat = "mp3_44100_128",
        stability = 0.5,
        similarityBoost = 0.75,
        style = 0,
        speed,
    } = options;

    const body: Record<string, unknown> = {
        text,
        model_id: modelId,
        voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: true,
        },
    };

    if (speed !== undefined) {
        (body.voice_settings as Record<string, unknown>).speed = speed;
    }

    // language_code only supported on turbo/flash models
    if (language && (modelId.includes("turbo") || modelId.includes("flash"))) {
        body.language_code = language;
    }

    const url = `${BASE_URL}/v1/text-to-speech/${voice}?output_format=${outputFormat}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "xi-api-key": config.apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `ElevenLabs TTS failed: ${errorText}`,
            "API_ERROR",
            "elevenlabs",
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
