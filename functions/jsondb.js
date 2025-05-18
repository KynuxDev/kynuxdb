'use strict';

const fs = require('fs');

module.exports.set = function (dotPath, value, targetObj) {
  if (typeof dotPath !== 'string' || dotPath === '') {
    console.error('KynuxDB Error: Invalid path provided for set operation.');
    return;
  }
  const pathSegments = dotPath.split('.');
  const segmentCount = pathSegments.length;
  let currentLevel = targetObj;

  for (let i = 0; i < segmentCount - 1; i++) {
    const currentSegment = pathSegments[i];
    if (
      currentLevel[currentSegment] === null ||
      typeof currentLevel[currentSegment] !== 'object'
    ) {
      currentLevel[currentSegment] = {};
    }
    currentLevel = currentLevel[currentSegment];
  }

  const finalSegment = pathSegments[segmentCount - 1];
  currentLevel[finalSegment] = value;
};

module.exports.get = function (sourceObj, ...pathKeys) {
  let currentValue = sourceObj;
  for (const pathKey of pathKeys) {
    if (
      currentValue &&
      typeof currentValue === 'object' &&
      Object.prototype.hasOwnProperty.call(currentValue, pathKey)
    ) {
      currentValue = currentValue[pathKey];
    } else {
      return undefined;
    }
  }
  return currentValue;
};

const findParentAndKey = (obj, path) => {
  if (!obj || typeof path !== 'string' || path === '') {
    return null;
  }
  const keys = path.split('.');
  const lastKey = keys.pop();
  let parent = obj;

  for (const key of keys) {
    if (
      parent &&
      typeof parent === 'object' &&
      Object.prototype.hasOwnProperty.call(parent, key)
    ) {
      parent = parent[key];
    } else {
      return null;
    }
  }

  if (parent && typeof parent === 'object') {
    return { parent, key: lastKey };
  }
  return null;
};

module.exports.remove = function (targetObj, dotPath) {
  const target = findParentAndKey(targetObj, dotPath);
  if (
    target &&
    Object.prototype.hasOwnProperty.call(target.parent, target.key)
  ) {
    delete target.parent[target.key];
    return true;
  }
  return false;
};

module.exports.initializeDbFile = function (dbFolderPath, dbFileName) {
  try {
    if (!fs.existsSync(dbFolderPath)) {
      fs.mkdirSync(dbFolderPath, { recursive: true });
    }
    const filePath = `./${dbFolderPath}/${dbFileName}.json`;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf8');
    }
  } catch (error) {
    console.error(
      `KynuxDB Error initializing file ${dbFolderPath}/${dbFileName}.json:`,
      error
    );
  }
};

module.exports.removeEmptyData = function (dataObject) {
  const performCleanup = function (currentObj) {
    if (typeof currentObj !== 'object' || currentObj === null) {
      return;
    }

    Object.keys(currentObj).forEach(function (key) {
      const value = currentObj[key];

      if (value && typeof value === 'object') {
        performCleanup(value);
      }

      if (
        value === null ||
        value === '' ||
        (typeof value === 'object' && Object.keys(value).length === 0)
      ) {
        delete currentObj[key];
      }
    });
  };

  performCleanup(dataObject);
};
