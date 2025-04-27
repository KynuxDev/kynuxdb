"use strict";

const fs = require("fs");
const BaseAdapter = require("./BaseAdapter");
const { initializeDbFile, removeEmptyData } = require("../functions/utils.js");
let YAML;

class YamlDB extends BaseAdapter {
    constructor(options) {
        super(options);

        this.dbName = this.options["dbName"] || "kynuxdb";
        this.dbFolder = this.options["dbFolder"] || "kynuxdb";
        this.noBlankData = this.options["noBlankData"] === true;
        this.filePath = `./${this.dbFolder}/${this.dbName}.yaml`;

        try {
            if (!YAML) YAML = require("yaml");
        } catch (error) {
            throw new TypeError("KynuxDB YAML Error: You must install the 'yaml' module to use this adapter. Run 'npm install yaml'.");
        }

        initializeDbFile(this.filePath, "{}");
    }

    _readAllData() {
        try {
            const fileContent = fs.readFileSync(this.filePath, "utf8");
            return YAML.parse(fileContent || "{}");
        } catch (error) {
            console.error(`KynuxDB YAML Error reading file ${this.filePath}:`, error);
             try {
                 fs.writeFileSync(this.filePath, "{}", "utf8");
             } catch (writeError) {
                  console.error(`KynuxDB YAML Error: Failed to reset corrupted file ${this.filePath}:`, writeError);
             }
            return {};
        }
    }

    _writeAllData(yamlData) {
        try {
            if (this.noBlankData) {
                removeEmptyData(yamlData);
            }
            const fileString = YAML.stringify(yamlData);
            fs.writeFileSync(this.filePath, fileString, "utf8");
        } catch (error) {
            console.error(`KynuxDB YAML Error writing file ${this.filePath}:`, error);
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

module.exports = YamlDB;