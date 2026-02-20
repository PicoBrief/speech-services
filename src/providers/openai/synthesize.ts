import type { OpenAIConfig, OpenAISynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { BASE_URL } from "./types.js";

export async function synthesize(
    config: OpenAIConfig,
    text: string,
    voice: string,
    _language: string | undefined,
    options: OpenAISynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const {
        model = "tts-1",
        responseFormat = "mp3",
        speed,
        instructions,
    } = options;

    const body: Record<string, unknown> = {
        model,
        input: text,
        voice,
        response_format: responseFormat,
    };

    if (speed !== undefined) body.speed = speed;
    // instructions only works with gpt-4o-mini-tts
    if (instructions && model.includes("gpt-4o-mini-tts")) {
        body.instructions = instructions;
    }

    const response = await fetch(`${BASE_URL}/audio/speech`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `OpenAI TTS failed: ${errorText}`,
            "API_ERROR",
            "openai",
            response.status,
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
        audio: Buffer.from(arrayBuffer),
        format: detectFormatFromString(responseFormat),
        voice,
    };
}
