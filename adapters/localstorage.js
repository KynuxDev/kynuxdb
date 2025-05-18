'use strict';

const BaseAdapter = require('./BaseAdapter');
const { removeEmptyData } = require('../functions/utils.js');

let storageAvailable = false;
try {
  if (typeof localStorage !== 'undefined' && localStorage !== null) {
    const testKey = '__kynuxdb_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    storageAvailable = true;
  }
} catch (e) {
  storageAvailable = false;
  console.warn(
    'KynuxDB Warning: localStorage is not available or accessible in this environment. LocalStorageAdapter will not function.'
  );
}

class LocalStorageDB extends BaseAdapter {
  constructor(options) {
    super(options);

    this.storageKey = this.options['dbName'] || 'kynuxdb_storage';
    this.noBlankData = this.options['noBlankData'] === true;

    if (!storageAvailable) {
      console.error(
        'KynuxDB Error: localStorage adapter initialized but storage is unavailable.'
      );
    }
  }

  _readAllData() {
    if (!storageAvailable) return {};
    try {
      const rawData = localStorage.getItem(this.storageKey);
      return JSON.parse(rawData || '{}');
    } catch (error) {
      console.error(
        `KynuxDB localStorage Error reading data for key ${this.storageKey}:`,
        error
      );
      try {
        localStorage.setItem(this.storageKey, '{}');
      } catch (resetError) {
        console.error(
          `KynuxDB localStorage Error: Failed to reset corrupted data for key ${this.storageKey}:`,
          resetError
        );
      }
      return {};
    }
  }

  _writeAllData(dataObject) {
    if (!storageAvailable) return;
    try {
      if (this.noBlankData) {
        removeEmptyData(dataObject);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(dataObject));
    } catch (error) {
      console.error(
        `KynuxDB localStorage Error writing data for key ${this.storageKey}:`,
        error
      );
    }
  }

  _deleteAllData() {
    if (!storageAvailable) return false;
    this._writeAllData({});
    return true;
  }

  _getValue(key) {
    const allData = this._readAllData();
    return require('../functions/utils.js').get(allData, ...key.split('.'));
  }

  _setValue(key, value) {
    const allData = this._readAllData();
    require('../functions/utils.js').set(key, value, allData);
    this._writeAllData(allData);
    return value;
  }

  _deleteKey(key) {
    const allData = this._readAllData();
    const deleted = require('../functions/utils.js').remove(allData, key);
    if (deleted) {
      if (this.noBlankData) {
        removeEmptyData(allData);
      }
      this._writeAllData(allData);
    }
    return deleted;
  }

  _incrementValue(key, amount) {
    const currentVal = this._getValue(key);
    let newValue = amount;
    if (typeof currentVal === 'number' && !isNaN(currentVal)) {
      newValue = currentVal + amount;
    }
    this._setValue(key, newValue);
    return newValue;
  }

  _pushValue(key, element) {
    let currentArray = this._getValue(key);
    if (!Array.isArray(currentArray)) {
      currentArray = [];
    }
    currentArray.push(element);
    this._setValue(key, currentArray);
    return currentArray;
  }

  _pullValue(key, elementToRemove) {
    let currentArray = this._getValue(key);
    if (!Array.isArray(currentArray)) {
      return undefined;
    }
    const filteredArray = currentArray.filter(
      (item) => item !== elementToRemove
    );
    this._setValue(key, filteredArray);
    return filteredArray;
  }

  _deleteFromArray(key, index) {
    let currentList = this._getValue(key);
    if (!Array.isArray(currentList) || currentList.length < index) {
      return false;
    }
    const modifiedList = currentList.filter((_, idx) => idx !== index - 1);
    this._setValue(key, modifiedList);
    return modifiedList;
  }

  _setInArray(key, data, index) {
    let currentList = this._getValue(key);
    if (!Array.isArray(currentList) || currentList.length < index) {
      return false;
    }
    const modifiedList = currentList.map((currentItem, idx) => {
      return idx === index - 1 ? data : currentItem;
    });
    this._setValue(key, modifiedList);
    return modifiedList;
  }

  _find(query, options = {}) {
    if (!storageAvailable) return [];
    const allData = this._readAllData();
    let results = [];

    const dataEntries = Array.isArray(allData)
      ? allData
      : Object.values(allData);

    const matchesQuery = (item, q) => {
      for (const key in q) {
        const queryValue = q[key];
        const itemValue = require('../functions/utils.js').get(
          item,
          ...key.split('.')
        );

        if (
          typeof queryValue === 'object' &&
          queryValue !== null &&
          !Array.isArray(queryValue) &&
          Object.keys(queryValue).length > 0
        ) {
          const operator = Object.keys(queryValue)[0];
          const operand = queryValue[operator];
          switch (operator) {
            case '$gt':
              if (!(itemValue > operand)) return false;
              break;
            case '$gte':
              if (!(itemValue >= operand)) return false;
              break;
            case '$lt':
              if (!(itemValue < operand)) return false;
              break;
            case '$lte':
              if (!(itemValue <= operand)) return false;
              break;
            case '$ne':
              if (itemValue === operand) return false;
              break;
            default:
              if (JSON.stringify(itemValue) !== JSON.stringify(queryValue))
                return false;
          }
        } else {
          if (itemValue !== queryValue) return false;
        }
      }
      return true;
    };

    results = dataEntries.filter((item) => matchesQuery(item, query));

    if (options.sort && typeof options.sort === 'object') {
      const sortKeys = Object.keys(options.sort);
      if (sortKeys.length > 0) {
        const sortKey = sortKeys[0];
        const sortOrder = options.sort[sortKey] === -1 ? -1 : 1;
        results.sort((a, b) => {
          const valA = require('../functions/utils.js').get(
            a,
            ...sortKey.split('.')
          );
          const valB = require('../functions/utils.js').get(
            b,
            ...sortKey.split('.')
          );
          if (valA < valB) return -1 * sortOrder;
          if (valA > valB) return 1 * sortOrder;
          return 0;
        });
      }
    }

    if (
      options.projection &&
      typeof options.projection === 'object' &&
      Object.keys(options.projection).length > 0
    ) {
      const {
        get: getObjectValue,
        set: setObjectValue,
      } = require('../functions/utils.js');
      results = results.map((item) => {
        const projectedItem = {};
        for (const key in options.projection) {
          if (options.projection[key]) {
            const value = getObjectValue(item, ...key.split('.'));
            if (value !== undefined) {
              setObjectValue(key, value, projectedItem);
            }
          }
        }
        return projectedItem;
      });
    }

    if (options.skip && typeof options.skip === 'number' && options.skip > 0) {
      results = results.slice(options.skip);
    }
    if (
      options.limit &&
      typeof options.limit === 'number' &&
      options.limit > 0
    ) {
      results = results.slice(0, options.limit);
    }

    return results;
  }
}

module.exports = LocalStorageDB;
