"use strict";

const fs = require("fs");
const functions = require("../functions/jsondb.js");

class JsonDB {
    constructor(options) {
        this.dbName = options["dbName"];
        this.dbFolder = options["dbFolder"];
        this.noBlankData = options["noBlankData"] === true;
        this.readable = options["readable"] === true;
        this.filePath = `./${this.dbFolder}/${this.dbName}.json`;

        functions.initializeDbFile(this.dbFolder, this.dbName);
    }

    _readData() {
        try {
            const fileContent = fs.readFileSync(this.filePath, "utf8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`KynuxDB Error reading file ${this.filePath}:`, error);
            return {};
        }
    }

    _writeData(jsonData) {
        try {
            const fileString = this.readable
                ? JSON.stringify(jsonData, null, 2)
                : JSON.stringify(jsonData);
            fs.writeFileSync(this.filePath, fileString, "utf8");
        } catch (error) {
            console.error(`KynuxDB Error writing file ${this.filePath}:`, error);
        }
    }

    set(key, value) {
        functions.initializeDbFile(this.dbFolder, this.dbName);

        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for set operation.");
        }

        const jsonData = this._readData();
        functions.set(key, value, jsonData);
        this._writeData(jsonData);

        return functions.get(jsonData, ...key.split("."));
    }

    get(key) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for get operation.");
        }

        const jsonData = this._readData();
        return functions.get(jsonData, ...key.split("."));
    }

    fetch(key) {
        return this.get(key);
    }

    has(key) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for has operation.");
        }
        const jsonData = this._readData();
        const value = functions.get(jsonData, ...key.split("."));
        return value !== undefined;
    }

    delete(key) {
        functions.initializeDbFile(this.dbFolder, this.dbName);

        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for delete operation.");
        }

        const jsonData = this._readData();

        const currentValue = functions.get(jsonData, ...key.split("."));
        if (currentValue === undefined) {
            return false;
        }

        functions.remove(jsonData, key);

        if (this.noBlankData) {
            functions.removeEmptyData(jsonData);
        }

        this._writeData(jsonData);
        return true;
    }

    add(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for add operation.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB Error: Amount must be a valid number for add operation.");
        }

        const currentVal = this.get(key);
        let newValue;

        if (typeof currentVal === 'number' && !isNaN(currentVal)) {
            newValue = currentVal + amount;
        } else {
            newValue = amount;
        }

        this.set(key, newValue);
        return newValue;
    }

    subtract(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for subtract operation.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB Error: Amount must be a valid number for subtract operation.");
        }

        const currentVal = this.get(key);
        let finalValue;

        if (typeof currentVal === 'number' && !isNaN(currentVal)) {
            finalValue = currentVal - amount;
            this.set(key, finalValue);
        } else {
             return this.add(key, -amount);
        }
        return finalValue;
    }


    push(key, element) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for push operation.");
        }

        const currentData = this.get(key);
        let targetArray;

        if (Array.isArray(currentData)) {
            targetArray = currentData;
        } else {
            targetArray = [];
        }

        targetArray.push(element);
        this.set(key, targetArray);

        return targetArray;
    }

    unpush(key, elementToRemove) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for unpush operation.");
        }

        const currentData = this.get(key);

        if (!Array.isArray(currentData)) {
            return currentData;
        }

        const filteredArray = currentData.filter(item => item !== elementToRemove);

        this.set(key, filteredArray);

        return filteredArray;
    }

    delByPriority(key, index) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for delByPriority.");
        }
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB Error: Priority index must be a positive number.");
        }

        const currentList = this.get(key);

        if (!Array.isArray(currentList) || currentList.length < index) {
            return false;
        }

        const modifiedList = currentList.filter((_, idx) => idx !== (index - 1));

        this.set(key, modifiedList);
        return modifiedList;
    }

    setByPriority(key, data, index) {
        if (!key) {
            throw new TypeError("KynuxDB Error: Key must be provided for setByPriority.");
        }
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB Error: Priority index must be a positive number.");
        }

        const currentList = this.get(key);

        if (!Array.isArray(currentList) || currentList.length < index) {
            return false;
        }

        const modifiedList = currentList.map((currentItem, idx) => {
            return (idx === (index - 1)) ? data : currentItem;
        });

        this.set(key, modifiedList);
        return modifiedList;
    }

    all() {
        return this._readData();
    }

    deleteAll() {
        this._writeData({});
        return true;
    }
}

module.exports = JsonDB;