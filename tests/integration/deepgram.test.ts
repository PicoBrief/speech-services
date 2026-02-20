import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/deepgram/transcribe.js";
import { fetchVoices } from "../../src/providers/deepgram/fetch-voices.js";

const env = loadEnv();
const apiKey = env.DEEPGRAM_API_KEY;

describe("Deepgram integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since DEEPGRAM_API_KEY is not defined in .env, the test for Deepgram is skipped");
    }

    it("transcribes audio", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe({ apiKey }, audio, ["en"]);
        saveResult("deepgram", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.words.length > 0, "Should return words");
        assert.ok(result.duration > 0, "Should have duration");
    });

    it("fetches voices", async () => {
        const voices = await fetchVoices({ apiKey });
        assert.ok(voices.length > 0, "Should return voices");
        assert.ok(voices[0].id, "Voice should have id");
        assert.equal(voices[0].provider, "deepgram");
    });
});
