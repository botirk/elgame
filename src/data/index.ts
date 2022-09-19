import data from "./index.json";

export interface Data { imgB64: string, name: string };

export interface LoadedData extends Data { img: HTMLImageElement }

export const mapData = data as { [key: string]: Data };

export const arrayData = Object.values(mapData);

export const loadData = (maxWidth: number): LoadedData[] => arrayData.map((data) => {
  const img = new Image();
  img.onload = () => {

  };
  img.src = `data:image/png;base64,${data.imgB64}`;
  return { ...data, img };
});

export const randomWord = () => arrayData[Math.floor(Math.random() * arrayData.length)];
