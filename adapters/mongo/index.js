"use strict";
const KynuxMongoBase = require("./Base");
const loadSchema = require("./Schema");
class MongoDB extends KynuxMongoBase {

    constructor(options) {
        if (!options || !options.url) {
            throw new TypeError("KynuxDB Mongo Error: Connection URL ('url') is required in options.");
        }
        super(options.url, options.connectionParams || {});

        this.dataModel = loadSchema(options.schema);
        this.message = {};
        this.ready = false;

        this.on("ready", () => {
            this.ready = true;
            console.log("[KynuxDB Mongo Adapter] Ready.");
        });
        this.on("error", (err) => {
            this.ready = false;
            console.error("[KynuxDB Mongo Adapter] Connection error:", err);
        });

        require('deasync').sleep(100);
    }

    _checkReady() {
        if (!this.ready) {
            throw new Error("KynuxDB Mongo Error: Database connection is not ready.");
        }
    }

    updateOptions(newOptions) {
         this.message = newOptions.message || this.message;
    }

    async set(key, value) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        this._checkReady();
        try {
            const options = { upsert: true, new: true, setDefaultsOnInsert: true };
            const updatedDoc = await this.dataModel.findOneAndUpdate(
                { key: key },
                { $set: { value: value } },
                options
            );
            return updatedDoc ? updatedDoc.value : undefined;
        } catch (error) {
            console.error(`KynuxDB Mongo Error setting key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async get(key) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        this._checkReady();
        try {
            const foundDoc = await this.dataModel.findOne({ key: key });
            return foundDoc ? foundDoc.value : undefined;
        } catch (error) {
            console.error(`KynuxDB Mongo Error getting key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    fetch(key) {
        return this.get(key);
    }

    async has(key) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        this._checkReady();
        try {
            const count = await this.dataModel.countDocuments({ key: key });
            return count > 0;
        } catch (error) {
            console.error(`KynuxDB Mongo Error checking key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async delete(key) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        this._checkReady();
        try {
            const result = await this.dataModel.deleteOne({ key: key });
            return result.deletedCount > 0;
        } catch (error) {
            console.error(`KynuxDB Mongo Error deleting key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async add(key, amount) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError(this.message?.errors?.blankNumber || "Amount must be a number.");
        this._checkReady();
        try {
             const updatedDoc = await this.dataModel.findOneAndUpdate(
                 { key: key },
                 { $inc: { value: amount } },
                 { upsert: true, new: true, setDefaultsOnInsert: true }
             );
             if (typeof updatedDoc.value !== 'number') {
                 const resetDoc = await this.dataModel.findOneAndUpdate(
                     { key: key },
                     { $set: { value: amount } },
                     { upsert: true, new: true }
                 );
                 return resetDoc.value;
             }

            return updatedDoc.value;
        } catch (error) {
            console.error(`KynuxDB Mongo Error adding to key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    subtract(key, amount) {
        if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError(this.message?.errors?.blankNumber || "Amount must be a number.");
        return this.add(key, -amount);
    }

    async push(key, element) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        this._checkReady();
        try {
            const options = { upsert: true, new: true, setDefaultsOnInsert: true };
            const updatedDoc = await this.dataModel.findOneAndUpdate(
                { key: key },
                { $push: { value: element } },
                options
            );
             const resultValue = Array.isArray(updatedDoc.value) ? updatedDoc.value : [element];
            return resultValue;
        } catch (error) {
            console.error(`KynuxDB Mongo Error pushing to key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async unpush(key, elementToRemove) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        this._checkReady();
        try {
            const options = { new: true };
            const updatedDoc = await this.dataModel.findOneAndUpdate(
                { key: key, value: { $type: "array" } },
                { $pull: { value: elementToRemove } },
                options
            );
            return updatedDoc ? updatedDoc.value : undefined;
        } catch (error) {
            console.error(`KynuxDB Mongo Error unpushing from key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async delByPriority(key, index) {
        if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
        if (typeof index !== 'number' || isNaN(index) || index < 1) throw new TypeError(this.message?.errors?.blankNumber || "Index must be a positive number.");
        this._checkReady();
        try {
            const currentDoc = await this.dataModel.findOne({ key: key });

            if (!currentDoc || !Array.isArray(currentDoc.value) || currentDoc.value.length < index) {
                return false;
            }

            const updatedList = currentDoc.value.filter((_, idx) => idx !== (index - 1));
            currentDoc.value = updatedList;

            await currentDoc.save();

            return updatedList;
        } catch (error) {
            console.error(`KynuxDB Mongo Error delByPriority for key "${key}":`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async setByPriority(key, data, index) {
         if (!key) throw new TypeError(this.message?.errors?.blankName || "Key is required.");
         if (typeof index !== 'number' || isNaN(index) || index < 1) throw new TypeError(this.message?.errors?.blankNumber || "Index must be a positive number.");
         this._checkReady();
         try {
            const currentDoc = await this.dataModel.findOne({ key: key });

            if (!currentDoc || !Array.isArray(currentDoc.value) || currentDoc.value.length < index) {
                return false;
            }

            currentDoc.value[index - 1] = data;
            currentDoc.markModified('value');

            await currentDoc.save();

            return currentDoc.value;
         } catch (error) {
             console.error(`KynuxDB Mongo Error setByPriority for key "${key}":`, error);
             this.emit("error", error);
             throw error;
         }
    }

    async all() {
        this._checkReady();
        try {
            const allDocs = await this.dataModel.find({});
             const result = {};
             allDocs.forEach(doc => {
                 result[doc.key] = doc.value;
             });
             return result;
        } catch (error) {
            console.error(`KynuxDB Mongo Error fetching all documents:`, error);
            this.emit("error", error);
            throw error;
        }
    }

    async deleteAll() {
        this._checkReady();
        try {
            await this.dataModel.deleteMany({});
            return true;
        } catch (error) {
            console.error(`KynuxDB Mongo Error deleting all documents:`, error);
            this.emit("error", error);
            throw error;
        }
    }
}

module.exports = MongoDB;