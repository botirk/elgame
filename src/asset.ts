import assetsJSON from "./compileTime/generated/assets.json";
import soundsJSON from "./compileTime/generated/sounds.json";

import { UnloadedWord, Word } from "./games";

const loadSoundAsset = async (b64: string) => {
  const audio = new Audio(`data:audio/mp3;base64,${b64}`);
  await new Promise<void>((resolve) => audio.addEventListener("loadeddata", () => resolve()));
  return audio;
}

const loadImgAsset = async (b64: string, pxValue: number, side: "width" | "heigth"): Promise<HTMLImageElement> => {
  return new Promise<HTMLImageElement>((resolve) => {
    const asset = new Image();
    asset.src = `data:image/png;base64,${b64}`;
    asset.onload = () => {
      const scale = (side == "width") ? pxValue / asset.width : pxValue / asset.height;
      asset.width *= scale;
      asset.height *= scale;
      resolve(asset);
    };
    
  });
}

export type Assets = { 
  [K in keyof typeof assetsJSON]: HTMLImageElement;
} & {
  [K in keyof typeof soundsJSON]: HTMLAudioElement;
}
export const loadAssets = async (maxWidth: number, side: "width" | "heigth" = "width"): Promise<Assets> => {
  const result = {};
  await Promise.all(Object.entries(assetsJSON).map(async (entry) => {
    result[entry[0]] = await loadImgAsset(entry[1], maxWidth, side);
  }));
  await Promise.all(Object.entries(soundsJSON).map(async (entry) => {
    result[entry[0]] = await loadSoundAsset(entry[1]);
  }));
  return result as Assets;
}

const loadWord = async (toLoad: UnloadedWord, pxValue: number, side: "width" | "heigth"): Promise<Word> => {
  if (!toLoad.toLearnImgB64) {
    return { toLearnText: toLoad.toLearnText, translation: toLoad.translation };
  } else {
    // promise magic
    return new Promise<Word>((resolve) => {
      loadImgAsset(toLoad.toLearnImgB64 as string, pxValue, side).then((toLearnImg) => {
        resolve({ toLearnImg, toLearnText: toLoad.toLearnText, translation: toLoad.translation });
      });
    });
  }
}

export const loadWords = async (words: UnloadedWord[], maxWidth: number, side: "width" | "heigth" = "width"): Promise<Word[]> => {
  return await Promise.all(words.map(async (word) => await loadWord(word, maxWidth, side)));
}
