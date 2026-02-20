# Cartesia Provider

**Capabilities:** TTS only

## Direct Usage

```typescript
import { synthesize, fetchVoices } from "@pico-brief/speech-services/providers/cartesia";

const config = { apiKey: "your-cartesia-key" };

const voices = await fetchVoices(config);
const result = await synthesize(config, "Hello!", voices[0].id, "en", {
    modelId: "sonic-3",
    container: "wav",
    speed: 1.0,
    emotion: "happy",
});
```

## Notes

- **Auth**: `X-API-Key` header + `Cartesia-Version` header required on all requests
- **Voice listing**: Cursor-based pagination (fetches all pages automatically)
- **Output format**: Structured object — `wav` (default), `mp3`, or `raw` with encoding
- **Gender mapping**: Cartesia uses "masculine"/"feminine" → mapped to "male"/"female"
- **Emotion**: 60+ emotion options available via `emotion` provider option
