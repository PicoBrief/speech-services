import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/revai/transcribe.js";

const env = loadEnv();
const apiKey = env.REVAI_API_KEY;

describe("Rev.ai integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since REVAI_API_KEY is not defined in .env, the test for Rev.ai is skipped");
    }

    it("transcribes audio", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe({ apiKey: apiKey! }, audio, ["en"]);
        saveResult("revai", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.words.length > 0, "Should return words");
        assert.ok(result.duration > 0, "Should have duration");
    });
});
