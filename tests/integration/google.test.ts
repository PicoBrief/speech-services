import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/google/transcribe.js";
import { synthesize } from "../../src/providers/google/synthesize.js";
import { fetchVoices } from "../../src/providers/google/fetch-voices.js";

const env = loadEnv();
const apiKey = env.GOOGLE_API_KEY;

describe("Google integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since GOOGLE_API_KEY is not defined in .env, the test for Google is skipped");
    }

    it("transcribes audio", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe({ apiKey: apiKey! }, audio, ["en-US"]);
        saveResult("google", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.duration > 0, "Should have duration");
    });

    it("synthesizes speech", async () => {
        const result = await synthesize({ apiKey: apiKey! }, "Hello world", "en-US-Neural2-A", "en-US");
        assert.ok(result.audio.length > 0, "Should return audio");
        assert.equal(result.voice, "en-US-Neural2-A");
    });

    it("fetches voices", async () => {
        const voices = await fetchVoices({ apiKey: apiKey! });
        assert.ok(voices.length > 0, "Should return voices");
        assert.ok(voices[0].id, "Voice should have id");
        assert.equal(voices[0].provider, "google");
    });
});
