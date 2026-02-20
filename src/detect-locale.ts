import type { ClientConfig, DetectLocalesParams, DetectLocalesProvider } from "./types.js";
import { SpeechServiceError } from "./errors.js";
import { getBaseLanguage } from "./utils.js";
import { sampleAndDetect } from "./audio-sampler.js";
import * as assemblyai from "./providers/assemblyai/index.js";
import * as azure from "./providers/azure/index.js";
import * as deepgram from "./providers/deepgram/index.js";
import * as elevenlabs from "./providers/elevenlabs/index.js";
import * as openai from "./providers/openai/index.js";
import * as speechmatics from "./providers/speechmatics/index.js";

export async function detectLocales(config: ClientConfig, params: DetectLocalesParams): Promise<Map<string, number>> {
    const detectFn = (audio: Buffer | string) =>
        detectSingleAudio(config, params.provider, audio);

    if (params.ffmpegPath) {
        return sampleAndDetect(params.audio, params.ffmpegPath, (clip) => detectFn(clip));
    }

    // No ffmpeg — truncate Buffer to save cost, or pass URL as-is
    let audio: Buffer | string = params.audio;
    if (Buffer.isBuffer(audio)) {
        const maxBytes = params.maxBytes ?? 500_000;
        if (audio.length > maxBytes) {
            audio = audio.subarray(0, maxBytes);
        }
    }

    return detectFn(audio);
}

async function detectSingleAudio(
    config: ClientConfig,
    provider: DetectLocalesProvider,
    audio: Buffer | string,
): Promise<Map<string, number>> {
    switch (provider) {
        case "azure": {
            const cfg = requireConfig(config, "azure", "Azure");
            return azure.detectLanguages(cfg, audio);
        }
        case "speechmatics": {
            const cfg = requireConfig(config, "speechmatics", "Speechmatics");
            return speechmatics.detectLanguages(cfg, audio);
        }
        case "assemblyai": {
            const cfg = requireConfig(config, "assemblyai", "AssemblyAI");
            const result = await assemblyai.transcribe(cfg, audio, undefined);
            return singleLanguageResult(result.language);
        }
        case "deepgram": {
            const cfg = requireConfig(config, "deepgram", "Deepgram");
            const result = await deepgram.transcribe(cfg, audio, undefined);
            return singleLanguageResult(result.language);
        }
        case "elevenlabs": {
            const cfg = requireConfig(config, "elevenlabs", "ElevenLabs");
            const result = await elevenlabs.transcribe(cfg, audio, undefined);
            return singleLanguageResult(result.language);
        }
        case "openai": {
            const cfg = requireConfig(config, "openai", "OpenAI");
            const result = await openai.transcribe(cfg, audio, undefined);
            return singleLanguageResult(result.language);
        }
        default:
            throw new SpeechServiceError(
                `Unknown detectLocales provider: ${provider as string}`,
                "UNKNOWN_PROVIDER",
            );
    }
}

function requireConfig<K extends keyof ClientConfig>(
    config: ClientConfig,
    provider: K,
    displayName: string,
): NonNullable<ClientConfig[K]> {
    const providerConfig = config[provider];
    if (!providerConfig) {
        throw new SpeechServiceError(
            `${displayName} is not configured. Add "${provider}" to your config.`,
            "NOT_CONFIGURED",
            provider,
        );
    }
    return providerConfig as NonNullable<ClientConfig[K]>;
}

function singleLanguageResult(language: string): Map<string, number> {
    const counts = new Map<string, number>();
    if (language) {
        counts.set(getBaseLanguage(language), 1);
    }
    return counts;
}
