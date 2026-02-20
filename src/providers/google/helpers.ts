/**
 * Parses Google Cloud duration values which can be either:
 * - A string like "1.5s"
 * - An object like { seconds: "1", nanos: 500000000 }
 */
export function parseGoogleDuration(
    duration: string | { seconds?: string | number; nanos?: number } | undefined,
): number {
    if (typeof duration === "string") {
        return parseFloat(duration.replace("s", "")) || 0;
    }
    if (typeof duration === "object" && duration !== null) {
        return Number(duration.seconds ?? 0) + Number(duration.nanos ?? 0) / 1_000_000_000;
    }
    return 0;
}
