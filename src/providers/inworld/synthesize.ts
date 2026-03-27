import type { InworldConfig, InworldSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { InworldTTSResponse } from "./types.js";

export async function synthesize(
    config: InworldConfig,
    text: string,
    voice: string,
    language: string | undefined,
    options: InworldSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const {
        modelId = "inworld-tts-1.5-max",
        audioEncoding = "MP3",
        sampleRateHertz,
        bitRate,
        speakingRate,
        temperature,
    } = options;

    const audioConfig: Record<string, unknown> = { audioEncoding };
    if (sampleRateHertz !== undefined) audioConfig.sampleRateHertz = sampleRateHertz;
    if (bitRate !== undefined) audioConfig.bitRate = bitRate;
    if (speakingRate !== undefined) audioConfig.speakingRate = speakingRate;

    const body: Record<string, unknown> = {
        text,
        voiceId: voice,
        modelId,
        audioConfig,
    };

    if (temperature !== undefined) body.temperature = temperature;

    const response = await fetch(`${BASE_URL}/tts/v1/voice`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Inworld TTS failed: ${errorText}`,
            "API_ERROR",
            "inworld",
            response.status,
        );
    }

    const result = (await response.json()) as InworldTTSResponse;

    return {
        audio: Buffer.from(result.audioContent, "base64"),
        format: detectFormatFromString(audioEncoding),
        voice,
    };
}
