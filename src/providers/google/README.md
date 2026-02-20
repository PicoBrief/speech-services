# Google Provider

**Capabilities:** STT + TTS

## Direct Usage

```typescript
import { transcribe, synthesize, fetchVoices } from "@pico-brief/speech-services/providers/google";

const config = { apiKey: "your-google-key" };

// Transcribe (sync for Buffer/HTTP, async for gs:// URIs)
const result = await transcribe(config, audioBuffer, ["en-US"], {
    model: "latest_long",
});

// Synthesize
const audio = await synthesize(config, "Hello!", "en-US-Neural2-A", "en-US", {
    audioEncoding: "MP3",
});

// List voices
const voices = await fetchVoices(config);
```

## Notes

- **Auth**: API key as query parameter `?key=...`
- **STT sync**: Max ~60 seconds, Buffer is base64-encoded
- **STT async**: For `gs://` URIs, uses `longrunningrecognize` with polling
- **HTTP URLs**: Downloaded first, then base64-encoded for sync mode
- **Timestamps**: Duration strings like `"1.5s"` or `{seconds, nanos}` objects
- **TTS response**: Base64 JSON (`audioContent` field), not raw binary
- **Voice listing**: Voices can have multiple `languageCodes` — one entry per locale
- **TTS limits**: `speakingRate`/`pitch` not supported on Chirp3-HD and Journey voices
