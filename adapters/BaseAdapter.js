"use strict";

const { set: setObjectValue, get: getObjectValue, remove: removeObjectValue } = require("../functions/utils.js");

class BaseAdapter {
    constructor(options = {}) {
        this.options = options;
        this.message = options.message || {};
    }

    _readAllData() {
        throw new Error("'_readAllData' method must be implemented by subclass.");
    }

    _writeAllData(data) {
        throw new Error("'_writeAllData' method must be implemented by subclass.");
    }

    _deleteAllData() {
        throw new Error("'_deleteAllData' method must be implemented by subclass.");
     }

     async _getValue(key) {
         const allData = await this._readAllData();
         return getObjectValue(allData, ...key.split('.'));
     }

     async _setValue(key, value) {
         const allData = await this._readAllData();
         setObjectValue(key, value, allData);
         await this._writeAllData(allData);
         return value;
     }

     async _deleteKey(key) {
         const allData = await this._readAllData();
         const deleted = removeObjectValue(allData, key);
         if (deleted) {
             if (this.options.noBlankData) {
                  require('../functions/utils.js').removeEmptyData(allData);
             }
             await this._writeAllData(allData);
         }
         return deleted;
     }

     async _incrementValue(key, amount) {
         const currentVal = await this._getValue(key);
         let newValue = amount;
         if (typeof currentVal === 'number' && !isNaN(currentVal)) {
             newValue = currentVal + amount;
         }
         await this._setValue(key, newValue);
         return newValue;
     }

     async _pushValue(key, element) {
         let currentArray = await this._getValue(key);
         if (!Array.isArray(currentArray)) {
             currentArray = [];
         }
         currentArray.push(element);
         await this._setValue(key, currentArray);
         return currentArray;
     }

     async _pullValue(key, elementToRemove) {
         let currentArray = await this._getValue(key);
         if (!Array.isArray(currentArray)) {
             return undefined;
         }
         const filteredArray = currentArray.filter(item => item !== elementToRemove);
         await this._setValue(key, filteredArray);
         return filteredArray;
     }

     async _deleteFromArray(key, index) {
         let currentList = await this._getValue(key);
         if (!Array.isArray(currentList) || currentList.length < index) {
             return false;
         }
         const modifiedList = currentList.filter((_, idx) => idx !== (index - 1));
         await this._setValue(key, modifiedList);
         return modifiedList;
     }

     async _setInArray(key, data, index) {
         let currentList = await this._getValue(key);
         if (!Array.isArray(currentList) || currentList.length < index) {
             return false;
         }
         const modifiedList = currentList.map((currentItem, idx) => {
             return (idx === (index - 1)) ? data : currentItem;
         });
         await this._setValue(key, modifiedList);
         return modifiedList;
     }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.message = newOptions.message || this.message;
    }

    set(key, value) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        return this._setValue(key, value);
    }

    get(key) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        return this._getValue(key);
    }

    fetch(key) {
        return this.get(key);
    }

    async has(key) {
         if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
         const value = await this._getValue(key);
         return value !== undefined;
     }

    delete(key) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        return this._deleteKey(key);
    }

    add(key, amount) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError(this.message?.errors?.blankNumber || "Amount must be a number.");
        return this._incrementValue(key, amount);
    }

    subtract(key, amount) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError(this.message?.errors?.blankNumber || "Amount must be a number.");
        return this._incrementValue(key, -amount);
    }

    push(key, element) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        return this._pushValue(key, element);
    }

    unpush(key, elementToRemove) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        return this._pullValue(key, elementToRemove);
    }

    delByPriority(key, index) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        if (typeof index !== 'number' || isNaN(index) || index < 1) throw new TypeError(this.message?.errors?.blankNumber || "Index must be a positive number.");
        return this._deleteFromArray(key, index);
    }

    setByPriority(key, data, index) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        if (typeof index !== 'number' || isNaN(index) || index < 1) throw new TypeError(this.message?.errors?.blankNumber || "Index must be a positive number.");
        return this._setInArray(key, data, index);
    }

    all() {
        return this._readAllData();
    }

    deleteAll() {
        return this._deleteAllData();
    }
}

module.exports = BaseAdapter;