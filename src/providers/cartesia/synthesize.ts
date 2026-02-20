import type { CartesiaConfig, CartesiaSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { BASE_URL, API_VERSION } from "./types.js";

export async function synthesize(
    config: CartesiaConfig,
    text: string,
    voice: string,
    language: string | undefined,
    options: CartesiaSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const {
        modelId = "sonic-3",
        container = "wav",
        encoding = "pcm_s16le",
        sampleRate = 24000,
        speed,
        emotion,
    } = options;

    // Build output_format based on container type
    const outputFormat: Record<string, unknown> = { sample_rate: sampleRate };
    if (container === "wav") {
        outputFormat.container = "wav";
    } else if (container === "mp3") {
        outputFormat.container = "mp3";
        outputFormat.bit_rate = 128000;
    } else if (container === "raw") {
        outputFormat.container = "raw";
        outputFormat.encoding = encoding;
    }

    const body: Record<string, unknown> = {
        model_id: modelId,
        transcript: text,
        voice: { mode: "id", id: voice },
        output_format: outputFormat,
    };

    if (language) body.language = language;

    const generationConfig: Record<string, unknown> = {};
    if (speed !== undefined) generationConfig.speed = speed;
    if (emotion) generationConfig.emotion = emotion;
    if (Object.keys(generationConfig).length > 0) {
        body.generation_config = generationConfig;
    }

    const response = await fetch(`${BASE_URL}/tts/bytes`, {
        method: "POST",
        headers: {
            "X-API-Key": config.apiKey,
            "Cartesia-Version": API_VERSION,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Cartesia TTS failed: ${errorText}`,
            "API_ERROR",
            "cartesia",
            response.status,
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
        audio: Buffer.from(arrayBuffer),
        format: container === "raw" ? "wav" : container,
        voice,
    };
}
