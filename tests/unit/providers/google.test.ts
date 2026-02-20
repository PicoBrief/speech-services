import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseGoogleDuration } from "../../../src/providers/google/helpers.js";

describe("Google helpers", () => {
    describe("parseGoogleDuration", () => {
        it("parses string durations like '1.5s'", () => {
            assert.equal(parseGoogleDuration("1.5s"), 1.5);
            assert.equal(parseGoogleDuration("0s"), 0);
            assert.equal(parseGoogleDuration("123.456s"), 123.456);
        });

        it("parses object durations with seconds and nanos", () => {
            assert.equal(parseGoogleDuration({ seconds: "1", nanos: 500000000 }), 1.5);
            assert.equal(parseGoogleDuration({ seconds: 10 }), 10);
            assert.equal(parseGoogleDuration({ nanos: 500000000 }), 0.5);
        });

        it("handles undefined", () => {
            assert.equal(parseGoogleDuration(undefined), 0);
        });

        it("handles empty string", () => {
            assert.equal(parseGoogleDuration(""), 0);
        });
    });
});
