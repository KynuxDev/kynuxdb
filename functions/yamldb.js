"use strict";

const fs = require("fs");

module.exports.set = function (propertyPath, newValue, dataObject) {
    if (typeof propertyPath !== 'string' || propertyPath === '') {
        console.error("KynuxDB YAML Error: Invalid path provided for set operation.");
        return;
    }
    const keys = propertyPath.split(".");
    const depth = keys.length;
    let currentObj = dataObject;

    for (let i = 0; i < depth - 1; i++) {
        const key = keys[i];
        if (currentObj[key] === null || typeof currentObj[key] !== 'object') {
            currentObj[key] = {};
        }
        currentObj = currentObj[key];
    }

    const finalKey = keys[depth - 1];
    currentObj[finalKey] = newValue;
};

module.exports.get = function(yamlData, ...keysToAccess) {
  let currentData = yamlData;
  for (const currentKey of keysToAccess) {
    if (currentData && typeof currentData === 'object' && Object.prototype.hasOwnProperty.call(currentData, currentKey)) {
      currentData = currentData[currentKey];
    } else {
      return undefined;
    }
  }
  return currentData;
};

module.exports.remove = function(yamlObj, propertyPath) {
    if (!yamlObj || typeof propertyPath !== 'string' || propertyPath === '') {
      return;
    }

    const keys = propertyPath.split(".");
    const lastKeyIndex = keys.length - 1;

    let parentObj = yamlObj;

    for (let i = 0; i < lastKeyIndex; i++) {
      const key = keys[i];
      if (parentObj && typeof parentObj === 'object' && Object.prototype.hasOwnProperty.call(parentObj, key)) {
        parentObj = parentObj[key];
      } else {
        return;
      }
    }

    if (parentObj && typeof parentObj === 'object') {
      delete parentObj[keys[lastKeyIndex]];
    }
};

module.exports.initializeDbFile = function(folderPath, fileName) {
    try {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        const fullPath = `./${folderPath}/${fileName}.yaml`;
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, "{}", "utf8");
        }
    } catch (err) {
        console.error(`KynuxDB YAML Error initializing file ${folderPath}/${fileName}.yaml:`, err);
    }
};
