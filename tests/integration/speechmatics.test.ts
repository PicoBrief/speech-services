import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/speechmatics/transcribe.js";
import { detectLanguages } from "../../src/providers/speechmatics/detect-languages.js";

const env = loadEnv();
const apiKey = env.SPEECHMATICS_API_KEY;
const region = env.SPEECHMATICS_REGION ?? "eu1";

describe("Speechmatics integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since SPEECHMATICS_API_KEY is not defined in .env, the test for Speechmatics is skipped");
    }

    const config = { apiKey: apiKey!, region };

    it("transcribes audio", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe(config, audio, ["en"]);
        saveResult("speechmatics", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.words.length > 0, "Should return words");
        assert.ok(result.duration > 0, "Should have duration");
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
