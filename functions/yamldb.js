'use strict';

const fs = require('fs');

module.exports.set = function (propertyPath, newValue, dataObject) {
  if (typeof propertyPath !== 'string' || propertyPath === '') {
    console.error(
      'KynuxDB YAML Error: Invalid path provided for set operation.'
    );
    return;
  }
  const keys = propertyPath.split('.');
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

module.exports.get = function (yamlData, ...keysToAccess) {
  let currentData = yamlData;
  for (const currentKey of keysToAccess) {
    if (
      currentData &&
      typeof currentData === 'object' &&
      Object.prototype.hasOwnProperty.call(currentData, currentKey)
    ) {
      currentData = currentData[currentKey];
    } else {
      return undefined;
    }
  }
  return currentData;
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

module.exports.remove = function (yamlObj, propertyPath) {
  const target = findParentAndKey(yamlObj, propertyPath);
  if (
    target &&
    Object.prototype.hasOwnProperty.call(target.parent, target.key)
  ) {
    delete target.parent[target.key];
    return true;
  }
  return false;
};

module.exports.initializeDbFile = function (folderPath, fileName) {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const fullPath = `./${folderPath}/${fileName}.yaml`;
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '{}', 'utf8');
    }
  } catch (err) {
    console.error(
      `KynuxDB YAML Error initializing file ${folderPath}/${fileName}.yaml:`,
      err
    );
  }
};
