import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/azure/transcribe.js";
import { synthesize } from "../../src/providers/azure/synthesize.js";
import { fetchVoices } from "../../src/providers/azure/fetch-voices.js";
import { detectLanguages } from "../../src/providers/azure/detect-languages.js";

const env = loadEnv();
const subscriptionKey = env.AZURE_SUBSCRIPTION_KEY;
const region = env.AZURE_REGION ?? "eastus";

describe("Azure integration", { skip: !subscriptionKey }, () => {
    if (!subscriptionKey) {
        console.log("Since AZURE_SUBSCRIPTION_KEY is not defined in .env, the test for Azure is skipped");
    }

    const config = { subscriptionKey: subscriptionKey!, region };

    it("transcribes audio (fast mode)", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe(config, audio, ["en-US"], { mode: "fast" });
        saveResult("azure", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.duration > 0, "Should have duration");
    });

    it("synthesizes speech", async () => {
        const result = await synthesize(config, "Hello world", "en-US-JennyNeural", "en-US");
        assert.ok(result.audio.length > 0, "Should return audio");
        assert.equal(result.voice, "en-US-JennyNeural");
    });

    it("fetches voices", async () => {
        const voices = await fetchVoices(config);
        assert.ok(voices.length > 0, "Should return voices");
        assert.ok(voices[0].id, "Voice should have id");
        assert.equal(voices[0].provider, "azure");
    });

    it("detects languages", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const languages = await detectLanguages(config, audio);
        assert.ok(languages instanceof Map, "Should return a Map");
        assert.ok(languages.size > 0, "Should detect at least one language");
    });
});
