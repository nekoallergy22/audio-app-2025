// src/utils/googleTTS.ts
import { VoiceSettingsType } from "../components/ui/VoiceSettings";

export interface TTSRequest {
  text: string;
  language: string;
  voiceName: string;
  speakingRate: number;
  pitch: number;
}

export async function synthesizeSpeech(request: TTSRequest): Promise<string> {
  try {
    // API Keyを環境変数から取得
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      throw new Error("Google Cloud API Keyが設定されていません");
    }

    // Google Cloud Text-to-Speech API エンドポイント
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    // APIリクエストの作成
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text: request.text },
        voice: {
          languageCode: request.language,
          name: request.voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: request.speakingRate,
          pitch: request.pitch,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "音声合成APIエラー");
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error("音声データが生成されませんでした");
    }

    // Base64エンコードされた音声データを返す
    return data.audioContent;
  } catch (error) {
    console.error("音声合成エラー:", error);
    throw error;
  }
}
