# ElevenLabs Provider

**Capabilities:** STT + TTS

## Direct Usage

```typescript
import { transcribe, synthesize, fetchVoices } from "@pico-brief/speech-services/providers/elevenlabs";

const config = { apiKey: "your-elevenlabs-key" };

// Transcribe (auto-detect language by omitting languages)
const result = await transcribe(config, audioBuffer, undefined, {
    model: "scribe_v2",
});

// Synthesize
const voices = await fetchVoices(config);
const audio = await synthesize(config, "Hello!", voices[0].id, "en", {
    modelId: "eleven_multilingual_v2",
    stability: 0.5,
    similarityBoost: 0.75,
});
```

## Notes

- **Auth**: `xi-api-key` header
- **STT**: Synchronous, supports 90+ language auto-detection (omit `language_code`)
- **Word filtering**: Must filter `type === "word"` to exclude "spacing" and "audio_event" tokens
- **Timestamps**: Can be null — defaults to 0
- **TTS language_code**: Only supported on `eleven_turbo_v2_5` and `eleven_flash_v2_5` models
- **Max file**: 3.0 GB for STT
