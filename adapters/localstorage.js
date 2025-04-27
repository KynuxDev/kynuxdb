"use strict";

const { set: setObjectValue, get: getObjectValue, remove: removeObjectValue } = require("../functions/jsondb.js");

class LocalStorageDB {
    constructor(options) {
        this.storageKey = options["dbName"] || "kynuxdb_storage";
    }

    _readStorage() {
        try {
            const rawData = localStorage.getItem(this.storageKey);
            return JSON.parse(rawData || "{}");
        } catch (error) {
            console.error(`KynuxDB localStorage Error reading data for key ${this.storageKey}:`, error);
            return {};
        }
    }

    _writeStorage(dataObject) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(dataObject));
        } catch (error) {
            console.error(`KynuxDB localStorage Error writing data for key ${this.storageKey}:`, error);
        }
    }

    set(key, value) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for set.");
        }

        const storageData = this._readStorage();
        setObjectValue(key, value, storageData);
        this._writeStorage(storageData);

        return value;
    }

    get(key) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for get.");
        }
        const storageData = this._readStorage();
        return getObjectValue(storageData, ...key.split("."));
    }

    fetch(key) {
        return this.get(key);
    }

    has(key) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for has.");
        }
        const storageData = this._readStorage();
        const value = getObjectValue(storageData, ...key.split("."));
        return value !== undefined;
    }

    delete(key) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for delete.");
        }

        const storageData = this._readStorage();

        if (getObjectValue(storageData, ...key.split(".")) === undefined) {
            return false;
        }

        removeObjectValue(storageData, key);
        this._writeStorage(storageData);
        return true;
    }

    add(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for add.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB localStorage Error: Amount must be a valid number.");
        }

        const currentValue = this.get(key);
        let resultValue = amount;

        if (typeof currentValue === 'number' && !isNaN(currentValue)) {
            resultValue = currentValue + amount;
        }

        this.set(key, resultValue);
        return resultValue;
    }

    subtract(key, amount) {
         if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for subtract.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB localStorage Error: Amount must be a valid number.");
        }
        return this.add(key, -amount);
    }


    push(key, element) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for push.");
        }

        const currentData = this.get(key);
        let currentArray = [];

        if (Array.isArray(currentData)) {
            currentArray = currentData;
        }

        currentArray.push(element);
        this.set(key, currentArray);
        return currentArray;
    }

    unpush(key, elementToRemove) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for unpush.");
        }

        const currentData = this.get(key);

        if (!Array.isArray(currentData)) {
            return currentData;
        }

        const resultArray = currentData.filter(item => item !== elementToRemove);
        this.set(key, resultArray);
        return resultArray;
    }

    delByPriority(key, index) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for delByPriority.");
        }
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB localStorage Error: Priority index must be a positive number.");
        }

        const currentList = this.get(key);

        if (!Array.isArray(currentList) || currentList.length < index) {
            return false;
        }

        const updatedList = currentList.filter((_, listIndex) => listIndex !== (index - 1));

        this.set(key, updatedList);
        return updatedList;
    }

    setByPriority(key, data, index) {
        if (!key) {
            throw new TypeError("KynuxDB localStorage Error: Key must be provided for setByPriority.");
        }
         if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB localStorage Error: Priority index must be a positive number.");
        }

        const currentList = this.get(key);

        if (!Array.isArray(currentList) || currentList.length < index) {
            return false;
        }

        const updatedList = currentList.map((item, listIndex) =>
            (listIndex === (index - 1)) ? data : item
        );

        this.set(key, updatedList);
        return updatedList;
    }

    all() {
        return this._readStorage();
    }

    deleteAll() {
        this._writeStorage({});
        return true;
    }
}

module.exports = LocalStorageDB;