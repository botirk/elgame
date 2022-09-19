const { readFileSync, readdirSync, writeFileSync } = require("fs");

const imgToB64 = (fruit) => readFileSync(`${__dirname}/img/${fruit}.png`).toString('base64');

const getImgNames = () => readdirSync(`${__dirname}/img`).map((str) => str.replace(/\.(.*)$/, ''));

const generateObject = () => getImgNames().reduce((obj, name) => { obj[name] = { imgB64: imgToB64(name), name }; return obj; }, {});

const writeJSON = () => writeFileSync(`${__dirname}/index.json`, JSON.stringify(generateObject()));

module.exports = writeJSON;
