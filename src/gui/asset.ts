import assetsJSON from "../compileTime/generated/assets.json";
import wordsJSON from "../compileTime/generated/words.json";

import { UnloadedWord, Word } from "../games/word";

const loadAsset = async (b64: string, pxValue: number, side: "width" | "heigth"): Promise<HTMLImageElement> => {
  return new Promise<HTMLImageElement>((resolve) => {
    const asset = new Image();
    asset.onload = () => {
      const scale = (side == "width") ? pxValue / asset.width : pxValue / asset.height;
      asset.width *= scale;
      asset.height *= scale;
      resolve(asset);
    };
    asset.src = `data:image/png;base64,${b64}`;
  });
}

export type Assets = { [K in keyof typeof assetsJSON]: HTMLImageElement };

export const loadAssets = async (maxWidth: number, side: "width" | "heigth" = "width"): Promise<Assets> => {
  const result = {};
  await Promise.all(Object.entries(assetsJSON).map(async (entry) => {
    result[entry[0]] = await loadAsset(entry[1], maxWidth, side);
  }));
  return result as Assets;
}

const loadWord = async (toLoad: UnloadedWord, pxValue: number, side: "width" | "heigth"): Promise<Word> => {
  if (!toLoad.toLearnImgB64) {
    return { toLearnText: toLoad.toLearnText, translation: toLoad.translation };
  } else {
    // promise magic
    return new Promise<Word>((resolve) => {
      loadAsset(toLoad.toLearnImgB64 as string, pxValue, side).then((toLearnImg) => {
        resolve({ toLearnImg, toLearnText: toLoad.toLearnText, translation: toLoad.translation });
      })
    });
  }
};

export type Words = { [K in keyof typeof wordsJSON]: Word };
export const loadWords = async (maxWidth: number, side: "width" | "heigth" = "width"): Promise<Words> => {
  const result = {};
  await Promise.all(Object.entries(wordsJSON).map(async (entry) => {
    result[entry[0]] = await loadWord(entry[1], maxWidth, side);
  }));
  return result as Words;
}

