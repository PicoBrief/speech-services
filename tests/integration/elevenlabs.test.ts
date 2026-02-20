import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv, getTestAudio, saveResult } from "./helpers.js";
import { transcribe } from "../../src/providers/elevenlabs/transcribe.js";
import { synthesize } from "../../src/providers/elevenlabs/synthesize.js";
import { fetchVoices } from "../../src/providers/elevenlabs/fetch-voices.js";

const env = loadEnv();
const apiKey = env.ELEVENLABS_API_KEY;

describe("ElevenLabs integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since ELEVENLABS_API_KEY is not defined in .env, the test for ElevenLabs is skipped");
    }

    let voiceId: string | undefined;

    it("fetches voices", async () => {
        const voices = await fetchVoices({ apiKey: apiKey! });
        assert.ok(voices.length > 0, "Should return voices");
        assert.ok(voices[0].id, "Voice should have id");
        assert.equal(voices[0].provider, "elevenlabs");
        voiceId = voices[0].id;
    });

    it("transcribes audio", async () => {
        const audio = getTestAudio();
        if (!audio) {
            console.log("Skipping: test-audio.mp3 not found in fixtures");
            return;
        }

        const result = await transcribe({ apiKey: apiKey! }, audio, ["en"]);
        saveResult("elevenlabs", "transcribe", result.text);
        assert.ok(result.text.length > 0, "Should return text");
        assert.ok(result.words.length > 0, "Should return words");
    });

    it("synthesizes speech", async () => {
        const voice = voiceId ?? "21m00Tcm4TlvDq8ikWAM"; // default Rachel voice
        const result = await synthesize({ apiKey: apiKey! }, "Hello world", voice, "en");
        assert.ok(result.audio.length > 0, "Should return audio");
        assert.equal(result.voice, voice);
    });
});
