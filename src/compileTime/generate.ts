import { readFileSync, readdirSync, writeFileSync } from "fs";

const imgToB64 = (imgPath) => readFileSync(`${__dirname}/../data/img/${imgPath}`).toString('base64');

const soundToB64 = (soundPath) => readFileSync(`${__dirname}/../data/${soundPath}`).toString('base64');

const removeExtension = (str) => str.replace(/\.(.*)$/, '');

const getImgNames = (dirPath) => readdirSync(`${__dirname}/../data/img/${dirPath}`).map(removeExtension);

const getSoundNames = (dirPath) => readdirSync(`${__dirname}/../data/${dirPath}`).map(removeExtension);

// const generateArray = (dirPath) => getImgNames(dirPath).reduce((a, name) => { a.push({ imgB64: imgToB64(`${dirPath}/${name}.png`), name }); return a; }, []);

const generateSounds = (dirPath) => getSoundNames(dirPath).reduce((a, name) => { a[name] = soundToB64(`${dirPath}/${name}.mp3`); return a; }, {});

const generateAssets = (dirPath) => getImgNames(dirPath).reduce((a, name) => { a[name] = imgToB64(`${dirPath}/${name}.png`); return a; }, {});

const generateWords = (dirPath) => getImgNames(dirPath).map((name) => ({ toLearnImgB64: imgToB64(`${dirPath}/${name}.png`), toLearnText: name }));

const convertAssets = () => writeFileSync(`${__dirname}/generated/assets.json`, JSON.stringify(generateAssets('assets')));

const convertWords = () => writeFileSync(`${__dirname}/generated/words.json`, JSON.stringify(generateWords('words')));

const convertSounds = () => writeFileSync(`${__dirname}/generated/sounds.json`, JSON.stringify(generateSounds('sound')))

export default () => {
  convertAssets();
  convertWords();
  convertSounds();
};
