'use strict';

const fs = require('fs');

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

const set = function (dotPath, value, targetObj) {
  if (typeof dotPath !== 'string' || dotPath === '') {
    console.error('KynuxDB Error: Invalid path provided for set operation.');
    return false;
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
  return true;
};

const get = function (sourceObj, ...pathKeys) {
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

const remove = function (targetObj, dotPath) {
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

const initializeDbFile = function (filePath, defaultContent = '{}') {
  try {
    const dirPath = require('path').dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContent, 'utf8');
    }
  } catch (error) {
    console.error(`KynuxDB Error initializing file ${filePath}:`, error);
  }
};

const removeEmptyData = function (dataObject) {
  const performCleanup = function (currentObj) {
    if (typeof currentObj !== 'object' || currentObj === null) {
      return false;
    }

    let isEmpty = true;
    Object.keys(currentObj).forEach(function (key) {
      const value = currentObj[key];
      let isValueEmpty = false;

      if (value && typeof value === 'object') {
        isValueEmpty = performCleanup(value);
      }

      if (
        value === null ||
        value === '' ||
        isValueEmpty ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete currentObj[key];
      } else {
        isEmpty = false;
      }
    });
    return isEmpty;
  };

  performCleanup(dataObject);
};

module.exports = {
  set,
  get,
  remove,
  initializeDbFile,
  removeEmptyData,
  findParentAndKey,
};
