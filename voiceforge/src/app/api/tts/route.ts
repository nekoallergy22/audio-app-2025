// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, TTSRequest } from "../../../utils/googleTTS";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // リクエストの検証
    if (!body.text) {
      return NextResponse.json(
        { error: "テキストが入力されていません" },
        { status: 400 }
      );
    }

    // Google TTSリクエストの作成
    const ttsRequest: TTSRequest = {
      text: body.text,
      language: body.language || "ja-JP",
      voiceName: body.voiceName || "ja-JP-Wavenet-A",
      speakingRate: body.speakingRate || 1.0,
      pitch: body.pitch || 0,
    };

    // 音声合成の実行
    const audioContent = await synthesizeSpeech(ttsRequest);

    // 音声データを返す
    return NextResponse.json({
      audioContent: audioContent,
      format: "mp3",
    });
  } catch (error) {
    console.error("TTS API エラー:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "音声の生成中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
