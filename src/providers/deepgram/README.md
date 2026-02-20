# Deepgram Provider

**Capabilities:** STT + TTS

## Direct Usage

```typescript
import { transcribe, synthesize, fetchVoices } from "@pico-brief/speech-services/providers/deepgram";

const config = { apiKey: "your-deepgram-key" };

// Transcribe
const result = await transcribe(config, audioBuffer, ["en"], {
    model: "nova-2",
    smartFormat: true,
});

// Synthesize
const audio = await synthesize(config, "Hello!", "aura-2-asteria-en", undefined, {
    encoding: "mp3",
});

// List voices
const voices = await fetchVoices(config);
```

## Notes

- **Auth**: `Authorization: Token <key>` (note "Token" prefix, not "Bearer")
- **STT**: Synchronous — Buffer sent as raw bytes, URL sent as JSON `{url}`
- **TTS**: Voice passed as `model` query parameter, 2000 character limit
- **Timestamps**: Already in seconds (no conversion needed)
- **Smart format**: Enabled by default — adds punctuation, capitalization, numerals
- **Word text**: Prefers `punctuated_word` field, falls back to `word`
