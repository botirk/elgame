import assetsJSON from "../compileTime/generated/assets.json";
import wordsJSON from "../compileTime/generated/words.json";
import { dropPlan, formPlan, memoryPlan, viewerPlan } from "../compileTime/plan";

import { InitSettings } from "..";
import { Game } from "../games";
import drop from "../games/drop/game";
import form from "../games/form/game";
import memory from "../games/memory/game";
import { UnloadedWord, Word, WordWithImage } from "../games/word";
import viewer from "../games/viewer/game";

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

const getWordsWithImage = (is: InitSettings, words: string[]) => {
  const [found, missing] = words.reduce((prev, cur) => {
    if (is.prepared.words[cur] && is.prepared.words[cur]?.toLearnImg) prev[0].push(is.prepared.words[cur]);
    else prev[1].push(cur);
    return prev;
  }, [[], []] as [WordWithImage[], string[]]);
  if (missing.length > 0) return `Words not found in collection: ${missing.join(', ')}`;
  return found;
}

const getWords = (is: InitSettings, words: string[]) => {
  const [found, missing] = words.reduce((prev, cur) => {
    if (is.prepared.words[cur]) prev[0].push(is.prepared.words[cur]);
    else prev[1].push(cur);
    return prev;
  }, [[], []] as [Word[], string[]]);
  if (missing.length > 0) return `Words not found in collection: ${missing.join(', ')}`;
  return found;
}

export const loadPlans = (is: InitSettings) => {
  const plans = [] as { place: number, label: string, game: Game }[];

  for (const plan of viewerPlan) {
    const words = getWords(is, plan.words);
    if (typeof(words) == "string") return words;
    plans.push({
      place: plan.place,
      label: plan.label,
      game: viewer(is, words),
    });
  }

  for (const plan of formPlan) {
    const words = getWordsWithImage(is, plan.words);
    if (typeof(words) == "string") return words;
    plans.push({
      place: plan.place,
      label: plan.label,
      game: form(is, words, plan.dif),
    });
  }

  for (const plan of dropPlan) {
    const words = getWordsWithImage(is, plan.words);
    if (typeof(words) == "string") return words;
    plans.push({
      place: plan.place,
      label: plan.label,
      game: drop(is, words, plan.dif),
    });
  }

  for (const plan of memoryPlan) {
    const words = getWordsWithImage(is, plan.words);
    if (typeof(words) == "string") return words;
    plans.push({
      place: plan.place,
      label: plan.label,
      game: memory(is, words),
    });
  }

  return plans;
}

