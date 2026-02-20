import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveVoice } from "../../src/voice-resolver.js";
import type { VoiceInfo } from "../../src/types.js";

const mockVoices: VoiceInfo[] = [
    { id: "en-US-JennyNeural", name: "Jenny", gender: "female", locale: "en-US", provider: "azure" },
    { id: "en-US-GuyNeural", name: "Guy", gender: "male", locale: "en-US", provider: "azure" },
    { id: "en-GB-SoniaNeural", name: "Sonia", gender: "female", locale: "en-GB", provider: "azure" },
    { id: "fr-FR-DeniseNeural", name: "Denise", gender: "female", locale: "fr-FR", provider: "azure" },
    { id: "fr-FR-HenriNeural", name: "Henri", gender: "male", locale: "fr-FR", provider: "azure" },
    { id: "de-DE-KatjaNeural", name: "Katja", gender: "female", locale: "de-DE", provider: "azure" },
];

describe("resolveVoice", () => {
    describe("by voice ID", () => {
        it("finds exact match by ID", () => {
            const result = resolveVoice(mockVoices, { voice: "en-US-JennyNeural" });
            assert.equal(result.id, "en-US-JennyNeural");
        });

        it("finds match by ID case-insensitively", () => {
            const result = resolveVoice(mockVoices, { voice: "en-us-jennyneural" });
            assert.equal(result.id, "en-US-JennyNeural");
        });
    });

    describe("by voice name", () => {
        it("finds match by name", () => {
            const result = resolveVoice(mockVoices, { voice: "Jenny" });
            assert.equal(result.id, "en-US-JennyNeural");
        });

        it("finds match by name case-insensitively", () => {
            const result = resolveVoice(mockVoices, { voice: "jenny" });
            assert.equal(result.id, "en-US-JennyNeural");
        });
    });

    describe("by language", () => {
        it("finds voice by exact locale", () => {
            const result = resolveVoice(mockVoices, { language: "en-US" });
            assert.equal(result.locale, "en-US");
        });

        it("prefers matching gender", () => {
            const result = resolveVoice(mockVoices, { language: "en-US", gender: "male" });
            assert.equal(result.id, "en-US-GuyNeural");
        });

        it("falls back to first voice if gender not found", () => {
            const result = resolveVoice(mockVoices, { language: "de-DE", gender: "male" });
            assert.equal(result.id, "de-DE-KatjaNeural"); // only female voice for de-DE
        });

        it("finds voice by base language", () => {
            const result = resolveVoice(mockVoices, { language: "en" });
            assert.ok(result.locale.startsWith("en"));
        });

        it("throws when no language or voice provided", () => {
            assert.throws(
                () => resolveVoice(mockVoices, {}),
                { code: "INVALID_INPUT" },
            );
        });

        it("throws when language not found", () => {
            assert.throws(
                () => resolveVoice(mockVoices, { language: "ja-JP" }),
                { code: "VOICE_NOT_FOUND" },
            );
        });
    });

    describe("fuzzy fallback from voice string", () => {
        it("extracts locale from voice name and matches", () => {
            const result = resolveVoice(mockVoices, { voice: "en-US-SomeNewVoice" });
            assert.equal(result.locale, "en-US");
        });

        it("prefers gender when falling back from voice string", () => {
            const result = resolveVoice(mockVoices, { voice: "fr-FR-SomeVoice", gender: "male" });
            assert.equal(result.id, "fr-FR-HenriNeural");
        });
    });

    describe("voice not found", () => {
        it("throws for completely unknown voice", () => {
            assert.throws(
                () => resolveVoice(mockVoices, { voice: "nonexistent" }),
                { code: "VOICE_NOT_FOUND" },
            );
        });
    });
});
