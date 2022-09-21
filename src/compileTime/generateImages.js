const { readFileSync, readdirSync, writeFileSync } = require("fs");

const imgToB64 = (imgPath) => readFileSync(`${__dirname}/../data/img/${imgPath}`).toString('base64');

const removeExtension = (str) => str.replace(/\.(.*)$/, '');

const getImgNames = (dirPath) => readdirSync(`${__dirname}/../data/img/${dirPath}`).map(removeExtension);

const generateArray = (dirPath) => getImgNames(dirPath).reduce((a, name) => { a.push({ imgB64: imgToB64(`${dirPath}/${name}.png`), name }); return a; }, []);

const generateObject = (dirPath) => getImgNames(dirPath).reduce((a, name) => { a[name] = { imgB64: imgToB64(`${dirPath}/${name}.png`), name }; return a; }, {});

const writeData = (dirPath, isObject) => writeFileSync(`${__dirname}/generated/${dirPath}.json`, JSON.stringify(isObject ? generateObject(dirPath) : generateArray(dirPath)));

module.exports = () => {
  writeData('fruits', false);
  writeData('game', true);
};
