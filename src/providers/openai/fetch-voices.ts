import type { OpenAIConfig, VoiceInfo } from "../../types.js";

// OpenAI has no voice listing API — voices are hardcoded
const OPENAI_VOICES: VoiceInfo[] = [
    "alloy", "ash", "ballad", "coral", "echo", "fable",
    "marin", "nova", "onyx", "sage", "shimmer", "verse", "cedar",
].map((name) => ({
    id: name,
    name,
    locale: "en",
    provider: "openai" as const,
}));

export async function fetchVoices(_config: OpenAIConfig): Promise<VoiceInfo[]> {
    return OPENAI_VOICES;
}
