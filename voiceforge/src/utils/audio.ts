/**
 * テキストを句点で分割する関数
 */
export const splitTextByPeriod = (text: string): string[] => {
  // 句点で分割し、空の要素を除外
  const segments = text
    .split("。")
    .filter((segment) => segment.trim() !== "");

  // 最後のセグメントが句点で終わっていない場合、句点を追加
  return segments.map((segment, index) => {
    return index === segments.length - 1 && !text.endsWith("。")
      ? segment
      : segment + "。";
  });
};

/**
 * Base64文字列をBlobに変換する関数
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
};
