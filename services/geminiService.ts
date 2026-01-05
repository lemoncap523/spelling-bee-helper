
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordInfo } from "../types";

/**
 * Decodes base64 string to Uint8Array
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data to AudioBuffer
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const timeout = (ms: number): Promise<never> => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));

export const fetchWordInfo = async (word: string): Promise<WordInfo & { notFound?: boolean }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const generatePromise = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Task: Explain the word "${word}" for a young student. 
      
      CRITICAL INSTRUCTIONS:
      1. ABSOLUTELY NO AUTOCORRECTION.
      2. If the input is NOT a meaningful English word, set the field "notFound" to true.
      3. Provide:
         - A simple English definition.
         - A Traditional Chinese (繁體中文) explanation.
         - An encouraging example sentence using the word.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          definition: { type: Type.STRING },
          chineseTranslation: { type: Type.STRING },
          exampleSentence: { type: Type.STRING },
          notFound: { type: Type.BOOLEAN, description: "True if the word is nonsense/not real" }
        },
        required: ["word", "definition", "chineseTranslation", "exampleSentence"],
      },
    },
  });

  const response = await Promise.race([generatePromise, timeout(10000)]);
  const result = JSON.parse(response.text || "{}");

  return {
    ...result,
    word: word
  } as WordInfo & { notFound?: boolean };
};

export const playWordAudio = async (word: string): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${word}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return;

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    outputAudioContext,
    24000,
    1,
  );

  const source = outputAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(outputAudioContext.destination);
  source.start();
};

export const extractWordsFromFile = async (base64Data: string, mimeType: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Extract all English spelling words from this document. Return them as a clean JSON array of strings, all in lowercase.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  try {
    const textOutput = response.text?.trim() || "[]";
    const words = JSON.parse(textOutput);
    return Array.isArray(words) ? words : [];
  } catch (e) {
    console.error("Failed to parse file extraction result", e);
    return [];
  }
};
