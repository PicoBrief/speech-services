import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/openai/transcribe.js";
import { synthesize } from "../../src/providers/openai/synthesize.js";

const env = loadEnv();
const apiKey = env.OPENAI_API_KEY;

describe("OpenAI integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since OPENAI_API_KEY is not defined in .env, the test for OpenAI is skipped");
    }

    it("transcribes audio", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe({ apiKey }, audio, ["en"]);
        saveResult("openai", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.duration > 0, "Should have duration");
    });

    it("synthesizes speech", async () => {
        const result = await synthesize({ apiKey }, "Hello world", "nova", undefined);
        assert.ok(result.audio.length > 0, "Should return audio");
        assert.equal(result.format, "mp3");
        assert.equal(result.voice, "nova");
    });
});
