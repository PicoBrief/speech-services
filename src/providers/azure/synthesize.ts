import type { AzureConfig, AzureSynthesizeOptions, SynthesizeResult } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { detectFormatFromString } from "../../utils.js";
import { escapeXml } from "./helpers.js";

export async function synthesize(
    config: AzureConfig,
    text: string,
    voice: string,
    language: string | undefined,
    options: AzureSynthesizeOptions = {},
): Promise<SynthesizeResult> {
    const {
        outputFormat = "audio-24khz-160kbitrate-mono-mp3",
        speed = "-5%",
        pitch,
        style,
    } = options;

    // Infer language from voice name if not provided (e.g., "en-US-JennyNeural" -> "en-US")
    const lang = language ?? voice.split("-").slice(0, 2).join("-");

    // Build SSML
    const escapedText = escapeXml(text);
    let ssml: string;

    if (style) {
        ssml = [
            `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">`,
            `  <voice name="${voice}">`,
            `    <mstts:express-as style="${style}" styledegree="2">`,
            `      <prosody rate="${speed}"${pitch ? ` pitch="${pitch}"` : ""}>`,
            `        ${escapedText}`,
            `      </prosody>`,
            `    </mstts:express-as>`,
            `  </voice>`,
            `</speak>`,
        ].join("\n");
    } else {
        ssml = [
            `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">`,
            `  <voice name="${voice}">`,
            `    <prosody rate="${speed}"${pitch ? ` pitch="${pitch}"` : ""}>`,
            `      ${escapedText}`,
            `    </prosody>`,
            `  </voice>`,
            `</speak>`,
        ].join("\n");
    }

    const url = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": config.subscriptionKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": outputFormat,
            "User-Agent": "SpeechServices/1.0",
        },
        body: ssml,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Azure TTS failed: ${errorText}`,
            "API_ERROR",
            "azure",
            response.status,
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
        audio: Buffer.from(arrayBuffer),
        format: detectFormatFromString(outputFormat),
        voice,
    };
}
