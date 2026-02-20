# OpenAI Provider

**Capabilities:** STT + TTS

## Direct Usage

```typescript
import { transcribe, synthesize, fetchVoices } from "@pico-brief/speech-services/providers/openai";

const config = { apiKey: "your-openai-key" };

// Transcribe
const result = await transcribe(config, audioBuffer, ["en"], {
    model: "whisper-1",
});

// Synthesize
const audio = await synthesize(config, "Hello!", "nova", undefined, {
    model: "tts-1",
    responseFormat: "mp3",
});

// List voices (hardcoded, no API call)
const voices = await fetchVoices(config);
```

## Notes

- **Auth**: `Authorization: Bearer <key>`
- **STT**: Always multipart/form-data — URLs are downloaded first
- **Word timestamps**: Only available with `whisper-1` model + `verbose_json` format
- **Max file**: 25MB for STT
- **TTS instructions**: Only works with `gpt-4o-mini-tts` model
- **Voices**: 13 hardcoded voices (alloy, ash, ballad, coral, echo, fable, marin, nova, onyx, sage, shimmer, verse, cedar) — all multilingual
