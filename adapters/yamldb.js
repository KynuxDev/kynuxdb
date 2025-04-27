"use strict";

const fs = require("fs");
const functions = require("../functions/yamldb.js");
let YAML;

class YamlDB {
    constructor(options) {
        this.dbName = options["dbName"];
        this.dbFolder = options["dbFolder"];
        this.filePath = `./${this.dbFolder}/${this.dbName}.yaml`;

        try {
            YAML = require("yaml");
        } catch (error) {
            throw new TypeError("KynuxDB YAML Error: You must install the 'yaml' module to use this adapter. Run 'npm install yaml'.");
        }

        functions.initializeDbFile(this.dbFolder, this.dbName);
    }

    _readYamlData() {
        try {
            const fileContent = fs.readFileSync(this.filePath, "utf8");
            return YAML.parse(fileContent || "{}");
        } catch (error) {
            console.error(`KynuxDB YAML Error reading file ${this.filePath}:`, error);
            return {};
        }
    }

    _writeYamlData(yamlData) {
        try {
            const fileString = YAML.stringify(yamlData);
            fs.writeFileSync(this.filePath, fileString, "utf8");
        } catch (error) {
            console.error(`KynuxDB YAML Error writing file ${this.filePath}:`, error);
        }
    }

    set(key, value) {
        functions.initializeDbFile(this.dbFolder, this.dbName);

        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for set operation.");
        }

        const yamlData = this._readYamlData();
        functions.set(key, value, yamlData);
        this._writeYamlData(yamlData);

        return functions.get(yamlData, ...key.split("."));
    }

    get(key) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for get operation.");
        }

        const yamlData = this._readYamlData();
        return functions.get(yamlData, ...key.split("."));
    }

    fetch(key) {
        return this.get(key);
    }

    has(key) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for has operation.");
        }
        const yamlData = this._readYamlData();
        const value = functions.get(yamlData, ...key.split("."));
        return value !== undefined;
    }

    delete(key) {
        functions.initializeDbFile(this.dbFolder, this.dbName);

        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for delete operation.");
        }

        const yamlData = this._readYamlData();

        const existingValue = functions.get(yamlData, ...key.split("."));
        if (existingValue === undefined) {
            return false;
        }

        functions.remove(yamlData, key);
        this._writeYamlData(yamlData);
        return true;
    }

    add(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for add operation.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB YAML Error: Amount must be a valid number.");
        }

        const currentVal = this.get(key);
        let newValue = amount;

        if (typeof currentVal === 'number' && !isNaN(currentVal)) {
            newValue = currentVal + amount;
        }

        this.set(key, newValue);
        return newValue;
    }

    subtract(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for subtract operation.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB YAML Error: Amount must be a valid number.");
        }

        return this.add(key, -amount);
    }


    push(key, element) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for push operation.");
        }

        const currentData = this.get(key);
        let listData = [];

        if (Array.isArray(currentData)) {
            listData = currentData;
        }

        listData.push(element);
        this.set(key, listData);

        return listData;
    }

    unpush(key, elementToRemove) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for unpush operation.");
        }

        const currentData = this.get(key);

        if (!Array.isArray(currentData)) {
            return currentData;
        }

        const filteredList = currentData.filter(item => item !== elementToRemove);
        this.set(key, filteredList);

        return filteredList;
    }

    delByPriority(key, index) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for delByPriority.");
        }
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB YAML Error: Priority index must be a positive number.");
        }

        const currentList = this.get(key);

        if (!Array.isArray(currentList) || currentList.length < index) {
            return false;
        }

        const updatedList = currentList.filter((_, idx) => idx !== (index - 1));

        this.set(key, updatedList);
        return updatedList;
    }

    setByPriority(key, data, index) {
        if (!key) {
            throw new TypeError("KynuxDB YAML Error: Key must be provided for setByPriority.");
        }
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB YAML Error: Priority index must be a positive number.");
        }

        const currentList = this.get(key);

        if (!Array.isArray(currentList) || currentList.length < index) {
            return false;
        }

        const updatedList = currentList.map((item, idx) =>
            (idx === (index - 1)) ? data : item
        );

        this.set(key, updatedList);
        return updatedList;
    }

    all() {
        return this._readYamlData();
    }

    deleteAll() {
        this._writeYamlData({});
        return true;
    }
}

module.exports = YamlDB;