
interface UnloadedImg { imgB64: string, name: string };
export interface LoadedImg { img: HTMLImageElement, name: string };

function loadImg(toLoad: UnloadedImg, pxValue: number, side: "width" | "heigth") {
  const img = new Image();
  img.onload = () => {
    const scale = (side == "width") ? pxValue / img.width : pxValue / img.height;
    img.width *= scale;
    img.height *= scale;
  };
  img.src = `data:image/png;base64,${toLoad.imgB64}`;
  return { img, name: toLoad.name };
};

export type TransformedImgsJSON<T extends { [key: string]: UnloadedImg }> = { [K in keyof T]: LoadedImg };
export function loadImgs(toLoad: UnloadedImg[], maxWidth: number, side: "width" | "heigth"): LoadedImg[];
export function loadImgs<T extends { [key: string]: UnloadedImg }>(toLoad: T, maxWidth: number, side: "width" | "heigth"): TransformedImgsJSON<T>;
export function loadImgs(toLoad: any, maxWidth: number, side: "width" | "heigth" = "width") {
  if (toLoad instanceof Array) {
    return toLoad.map((toLoad) => loadImg(toLoad, maxWidth, side));
  } else {
    return Object.entries(toLoad).reduce((prev, cur) => {
      prev[cur[0]] = loadImg(cur[1] as UnloadedImg, maxWidth, side);
      return prev;
    }, {});
  }
}

export const randomLoadedImg = (words: LoadedImg[]) => words[Math.floor(Math.random() * words.length)];
