import type { DeepgramConfig, DeepgramSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { BASE_URL } from "./types.js";

export async function synthesize(
    config: DeepgramConfig,
    text: string,
    voice: string,
    _language: string | undefined,
    options: DeepgramSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const { encoding = "mp3", container, sampleRate } = options;

    const params = new URLSearchParams({ model: voice, encoding });
    if (container) params.set("container", container);
    if (sampleRate) params.set("sample_rate", String(sampleRate));

    const url = `${BASE_URL}/v1/speak?${params}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Token ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Deepgram TTS failed: ${errorText}`,
            "API_ERROR",
            "deepgram",
            response.status,
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
        audio: Buffer.from(arrayBuffer),
        format: detectFormatFromString(encoding),
        voice,
    };
}
