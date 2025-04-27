"use strict";

const fs = require("fs");

module.exports.set = function (dotPath, value, targetObj) {
    if (typeof dotPath !== 'string' || dotPath === '') {
        console.error("KynuxDB Error: Invalid path provided for set operation.");
        return;
    }
    const pathSegments = dotPath.split(".");
    const segmentCount = pathSegments.length;
    let currentLevel = targetObj;

    for (let i = 0; i < segmentCount - 1; i++) {
        const currentSegment = pathSegments[i];
        if (currentLevel[currentSegment] === null || typeof currentLevel[currentSegment] !== 'object') {
             currentLevel[currentSegment] = {};
        }
        currentLevel = currentLevel[currentSegment];
    }

    const finalSegment = pathSegments[segmentCount - 1];
    currentLevel[finalSegment] = value;
};

module.exports.get = function(sourceObj, ...pathKeys) {
  let currentValue = sourceObj;
  for (const pathKey of pathKeys) {
    if (currentValue && typeof currentValue === 'object' && Object.prototype.hasOwnProperty.call(currentValue, pathKey)) {
      currentValue = currentValue[pathKey];
    } else {
      return undefined;
    }
  }
  return currentValue;
};

module.exports.remove = function(targetObj, dotPath) {
    if (!targetObj || typeof dotPath !== 'string' || dotPath === '') {
      return;
    }

    const pathSegments = dotPath.split(".");
    const lastSegmentIndex = pathSegments.length - 1;

    let parentLevel = targetObj;

    for (let i = 0; i < lastSegmentIndex; i++) {
      const segment = pathSegments[i];
      if (parentLevel && typeof parentLevel === 'object' && Object.prototype.hasOwnProperty.call(parentLevel, segment)) {
        parentLevel = parentLevel[segment];
      } else {
        return;
      }
    }

    if (parentLevel && typeof parentLevel === 'object') {
      delete parentLevel[pathSegments[lastSegmentIndex]];
    }
};

module.exports.initializeDbFile = function(dbFolderPath, dbFileName) {
    try {
        if (!fs.existsSync(dbFolderPath)) {
            fs.mkdirSync(dbFolderPath, { recursive: true });
        }
        const filePath = `./${dbFolderPath}/${dbFileName}.json`;
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "{}", "utf8");
        }
    } catch (error) {
        console.error(`KynuxDB Error initializing file ${dbFolderPath}/${dbFileName}.json:`, error);
    }
};

module.exports.removeEmptyData = function (dataObject) {

  const performCleanup = function(currentObj) {
    if (typeof currentObj !== 'object' || currentObj === null) {
        return;
    }

    Object.keys(currentObj).forEach(function(key) {
      const value = currentObj[key];

      if (value && typeof value === 'object') {
        performCleanup(value);
      }

      if (value === null || value === "" || (typeof value === 'object' && Object.keys(value).length === 0)) {
        delete currentObj[key];
      }
    });
  };

  performCleanup(dataObject);

};
