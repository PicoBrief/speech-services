import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { resolveVoice, validateRecommendedVoices, type RecommendedVoice } from "../../src/voice-resolver.js";
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

    describe("recommended voices", () => {
        const recommended: RecommendedVoice[] = [
            { name: "en-US-AvaNeural", gender: "female" },
            { name: "en-US-AndrewNeural", gender: "male" },
            { name: "zh-CN-XiaoxiaoNeural", gender: "female" },
            { name: "zh-CN-YunxiNeural", gender: "male" },
        ];

        const voicesWithRecommended: VoiceInfo[] = [
            { id: "en-US-JennyNeural", name: "Jenny", gender: "female", locale: "en-US", provider: "azure" },
            { id: "en-US-GuyNeural", name: "Guy", gender: "male", locale: "en-US", provider: "azure" },
            { id: "en-US-AvaNeural", name: "Ava", gender: "female", locale: "en-US", provider: "azure" },
            { id: "en-US-AndrewNeural", name: "Andrew", gender: "male", locale: "en-US", provider: "azure" },
            { id: "en-GB-SoniaNeural", name: "Sonia", gender: "female", locale: "en-GB", provider: "azure" },
            { id: "en-GB-RyanNeural", name: "Ryan", gender: "male", locale: "en-GB", provider: "azure" },
            { id: "zh-CN-XiaoxiaoNeural", name: "Xiaoxiao", gender: "female", locale: "zh-CN", provider: "azure" },
            { id: "zh-CN-YunxiNeural", name: "Yunxi", gender: "male", locale: "zh-CN", provider: "azure" },
            { id: "zh-CN-XiaoyiNeural", name: "Xiaoyi", gender: "female", locale: "zh-CN", provider: "azure" },
            { id: "fr-FR-DeniseNeural", name: "Denise", gender: "female", locale: "fr-FR", provider: "azure" },
        ];

        it("picks recommended voice over first available for locale", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "en-US" }, recommended);
            assert.equal(result.id, "en-US-AvaNeural");
        });

        it("filters recommended by gender", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "en-US", gender: "male" }, recommended);
            assert.equal(result.id, "en-US-AndrewNeural");
        });

        it("matches by base language when no exact locale in recommended", () => {
            // "en-GB" has no recommended voices, but base language "en" matches "en-US-*" recommended
            const result = resolveVoice(voicesWithRecommended, { language: "en-GB" }, recommended);
            // Should still pick from recommended (en-US-AvaNeural) since it matches base language "en"
            assert.equal(result.id, "en-US-AvaNeural");
        });

        it("matches by base language with gender filter", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "en-GB", gender: "male" }, recommended);
            assert.equal(result.id, "en-US-AndrewNeural");
        });

        it("matches zh-CN recommended voices", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "zh-CN" }, recommended);
            assert.equal(result.id, "zh-CN-XiaoxiaoNeural");
        });

        it("matches zh-CN recommended voice with gender", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "zh-CN", gender: "male" }, recommended);
            assert.equal(result.id, "zh-CN-YunxiNeural");
        });

        it("matches by base language code only (e.g. 'zh')", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "zh" }, recommended);
            assert.equal(result.id, "zh-CN-XiaoxiaoNeural");
        });

        it("falls back to generic resolution when no recommended match locale or language", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "fr-FR" }, recommended);
            assert.equal(result.id, "fr-FR-DeniseNeural");
        });

        it("skips recommended voices not in the available list", () => {
            const limitedVoices: VoiceInfo[] = [
                { id: "en-US-JennyNeural", name: "Jenny", gender: "female", locale: "en-US", provider: "azure" },
                { id: "en-US-GuyNeural", name: "Guy", gender: "male", locale: "en-US", provider: "azure" },
            ];
            // AvaNeural and AndrewNeural are recommended but not in limitedVoices
            const result = resolveVoice(limitedVoices, { language: "en-US" }, recommended);
            // Should fall through to generic locale match
            assert.equal(result.id, "en-US-JennyNeural");
        });

        it("does not use recommended voices when exact voice name is provided", () => {
            const result = resolveVoice(voicesWithRecommended, { voice: "Jenny" }, recommended);
            assert.equal(result.id, "en-US-JennyNeural");
        });

        it("works the same as without recommended when list is empty", () => {
            const result = resolveVoice(voicesWithRecommended, { language: "en-US" }, []);
            // Without recommended, picks first en-US voice
            assert.equal(result.id, "en-US-JennyNeural");
        });
    });

    describe("validateRecommendedVoices", () => {
        it("warns for recommended voices not in the available list", () => {
            const warnMock = mock.method(console, "warn", () => {});
            const voices: VoiceInfo[] = [
                { id: "en-US-AvaNeural", name: "Ava", gender: "female", locale: "en-US", provider: "azure" },
            ];
            const recommended: RecommendedVoice[] = [
                { name: "en-US-AvaNeural", gender: "female" },
                { name: "en-US-MissingNeural", gender: "male" },
                { name: "zh-CN-AlsoMissingNeural", gender: "female" },
            ];

            validateRecommendedVoices(voices, recommended);

            assert.equal(warnMock.mock.calls.length, 2);
            assert.ok((warnMock.mock.calls[0].arguments[0] as string).includes("en-US-MissingNeural"));
            assert.ok((warnMock.mock.calls[1].arguments[0] as string).includes("zh-CN-AlsoMissingNeural"));
            warnMock.mock.restore();
        });

        it("does not warn when all recommended voices are available", () => {
            const warnMock = mock.method(console, "warn", () => {});
            const voices: VoiceInfo[] = [
                { id: "en-US-AvaNeural", name: "Ava", gender: "female", locale: "en-US", provider: "azure" },
            ];
            const recommended: RecommendedVoice[] = [
                { name: "en-US-AvaNeural", gender: "female" },
            ];

            validateRecommendedVoices(voices, recommended);

            assert.equal(warnMock.mock.calls.length, 0);
            warnMock.mock.restore();
        });
    });
});
