import type {
    ClientConfig,
    SpeechClient,
    TranscribeParams,
    TranscribeResult,
    SynthesizeParams,
    SynthesizeResult,
    DetectLocalesParams,
    FetchVoicesProvider,
    VoiceInfo,
} from "./types.js";
import { VoiceCache } from "./voice-cache.js";
import { transcribe as transcribeRouter } from "./transcribe.js";
import { synthesize as synthesizeRouter } from "./synthesize.js";
import { detectLocales as detectLocalesRouter } from "./detect-locale.js";
import { fetchVoices as fetchVoicesRouter } from "./fetch-voices.js";

export function createSpeechClient(config: ClientConfig): SpeechClient {
    const voiceCache = new VoiceCache();

    return {
        async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
            return transcribeRouter(config, params);
        },

        async synthesize(params: SynthesizeParams): Promise<SynthesizeResult> {
            return synthesizeRouter(config, params, voiceCache);
        },

        async detectLocales(params: DetectLocalesParams): Promise<Map<string, number>> {
            return detectLocalesRouter(config, params);
        },

        async fetchVoices(provider: FetchVoicesProvider): Promise<VoiceInfo[]> {
            return fetchVoicesRouter(config, provider);
        },
    };
}
