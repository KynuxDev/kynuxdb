"use strict";

const fs = require("fs");
const BaseAdapter = require("./BaseAdapter");
const { initializeDbFile, removeEmptyData } = require("../functions/utils.js");

class JsonDB extends BaseAdapter {
    constructor(options) {
        super(options);

        this.dbName = this.options["dbName"] || "kynuxdb";
        this.dbFolder = this.options["dbFolder"] || "kynuxdb";
        this.readable = this.options["readable"] === true;
        this.noBlankData = this.options["noBlankData"] === true;
        this.filePath = `./${this.dbFolder}/${this.dbName}.json`;

        initializeDbFile(this.filePath, "{}");
    }

    _readAllData() {
        try {
            const fileContent = fs.readFileSync(this.filePath, "utf8");
            return JSON.parse(fileContent || "{}");
        } catch (error) {
            console.error(`KynuxDB JSON Error reading file ${this.filePath}:`, error);
            try {
                fs.writeFileSync(this.filePath, "{}", "utf8");
            } catch (writeError) {
                 console.error(`KynuxDB JSON Error: Failed to reset corrupted file ${this.filePath}:`, writeError);
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

            fs.writeFileSync(this.filePath, fileString, "utf8");
        } catch (error) {
            console.error(`KynuxDB JSON Error writing file ${this.filePath}:`, error);
        }
    }

     _deleteAllData() {
         this._writeAllData({});
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
}

module.exports = JsonDB;