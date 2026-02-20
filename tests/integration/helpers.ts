import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Walk up from compiled output (dist-test/tests/integration/) to project root
function findProjectRoot(): string {
    let dir = __dirname;
    while (dir !== dirname(dir)) {
        if (existsSync(join(dir, "package.json"))) return dir;
        dir = dirname(dir);
    }
    return __dirname;
}

const projectRoot = findProjectRoot();
const resultsDir = join(projectRoot, "tests", "results");

/**
 * Loads environment variables from .env file using dotenv.
 * Returns process.env as a Record for convenient access.
 */
export function loadEnv(): Record<string, string> {
    dotenv.config({ path: join(projectRoot, ".env"), quiet: true });
    return process.env as Record<string, string>;
}

/**
 * Returns a small test audio buffer (from fixtures) or undefined if not found.
 */
/**
 * Saves a transcription result to tests/results/<provider>.txt for inspection.
 */
export function saveResult(provider: string, label: string, data: string): void {
    mkdirSync(resultsDir, { recursive: true });
    const filePath = join(resultsDir, `${provider}.txt`);
    const entry = `[${label}]\n${data}\n\n`;
    writeFileSync(filePath, entry, { flag: "a" });
}

export function getTestAudio(): Buffer | undefined {
    const audioPath = join(projectRoot, "tests", "fixtures", "test-audio.mp3");
    if (!existsSync(audioPath)) return undefined;
    return readFileSync(audioPath);
}
