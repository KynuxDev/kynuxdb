'use strict';

const fs = require('fs');
const BaseAdapter = require('./BaseAdapter');
const { initializeDbFile, removeEmptyData } = require('../functions/utils.js');

class JsonDB extends BaseAdapter {
  constructor(options) {
    super(options);

    this.dbName = this.options['dbName'] || 'kynuxdb';
    this.dbFolder = this.options['dbFolder'] || 'kynuxdb';
    this.readable = this.options['readable'] === true;
    this.noBlankData = this.options['noBlankData'] === true;
    this.filePath = `./${this.dbFolder}/${this.dbName}.json`;
    this._cache = null;
    this._cacheTimeout = null;

    initializeDbFile(this.filePath, '{}');
  }

  _clearCacheTimeout() {
    if (this._cacheTimeout) {
      clearTimeout(this._cacheTimeout);
      this._cacheTimeout = null;
    }
  }

  _resetCacheTimeout(ttl = 300000) {
    this._clearCacheTimeout();
    this._cacheTimeout = setTimeout(() => {
      this._cache = null;
    }, ttl);
  }

  _readAllData() {
    if (this._cache) {
      this._resetCacheTimeout();
      return JSON.parse(JSON.stringify(this._cache));
    }
    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(fileContent || '{}');
      this._cache = JSON.parse(JSON.stringify(data));
      this._resetCacheTimeout();
      return data;
    } catch (error) {
      console.error(`KynuxDB JSON Error reading file ${this.filePath}:`, error);
      try {
        fs.writeFileSync(this.filePath, '{}', 'utf8');
      } catch (writeError) {
        console.error(
          `KynuxDB JSON Error: Failed to reset corrupted file ${this.filePath}:`,
          writeError
        );
      }
      return {};
    }
  }

  _writeAllData(jsonData) {
    try {
      if (this.noBlankData) {
        removeEmptyData(jsonData);
      }

      const fileString = this.readable
        ? JSON.stringify(jsonData, null, 2)
        : JSON.stringify(jsonData);

      fs.writeFileSync(this.filePath, fileString, 'utf8');
      this._cache = JSON.parse(JSON.stringify(jsonData));
      this._resetCacheTimeout();
    } catch (error) {
      console.error(`KynuxDB JSON Error writing file ${this.filePath}:`, error);
    }
  }

  _deleteAllData() {
    this._writeAllData({});
    this._cache = {};
    this._resetCacheTimeout();
    return true;
  }

  async _deleteKey(key) {
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

  _find(query, options = {}) {
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

module.exports = JsonDB;
