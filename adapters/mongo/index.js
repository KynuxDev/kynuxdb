"use strict";
const KynuxMongoBase = require("./Base");
const loadSchema = require("./Schema");
const deasync = require("deasync");

class MongoDB extends KynuxMongoBase {

    constructor(options) {
        if (!options || !options.url) {
            throw new TypeError("KynuxDB Mongo Error: Connection URL ('url') is required in options.");
        }
        super(options.url, options.connectionParams || {});

        this.dataModel = loadSchema(options.schema);
        this.message = {};
    }

    set(key, value) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for set operation.");
        }

        return deasync(async (callback) => {
            try {
                const options = { upsert: true, new: true, setDefaultsOnInsert: true };
                const updatedDoc = await this.dataModel.findOneAndUpdate(
                    { key: key },
                    { $set: { value: value } },
                    options
                );
                callback(null, updatedDoc.value);
            } catch (error) {
                console.error(`KynuxDB Mongo Error setting key "${key}":`, error);
                this.emit("error", error);
                callback(error, undefined);
            }
        })();
    }

    get(key) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for get operation.");
        }

        return deasync(async (callback) => {
            try {
                const foundDoc = await this.dataModel.findOne({ key: key });
                callback(null, foundDoc ? foundDoc.value : undefined);
            } catch (error) {
                console.error(`KynuxDB Mongo Error getting key "${key}":`, error);
                this.emit("error", error);
                callback(error, undefined);
            }
        })();
    }

    fetch(key) {
        return this.get(key);
    }

    has(key) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for has operation.");
        }
        return deasync(async (callback) => {
            try {
                const count = await this.dataModel.countDocuments({ key: key });
                callback(null, count > 0);
            } catch (error) {
                console.error(`KynuxDB Mongo Error checking key "${key}":`, error);
                this.emit("error", error);
                callback(error, false);
            }
        })();
    }

    delete(key) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for delete operation.");
        }

        return deasync(async (callback) => {
            try {
                const result = await this.dataModel.deleteOne({ key: key });
                callback(null, result.deletedCount > 0);
            } catch (error) {
                console.error(`KynuxDB Mongo Error deleting key "${key}":`, error);
                this.emit("error", error);
                callback(error, false);
            }
        })();
    }

    add(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for add operation.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB Mongo Error: Amount must be a valid number.");
        }

        return deasync(async (callback) => {
            try {
                const options = { upsert: true, new: true, setDefaultsOnInsert: true };
                 let doc = await this.dataModel.findOne({ key: key });
                 let newValue;
                 if (doc && typeof doc.value === 'number') {
                     doc = await this.dataModel.findOneAndUpdate(
                         { key: key },
                         { $inc: { value: amount } },
                         { new: true }
                     );
                     newValue = doc.value;
                 } else {
                     doc = await this.dataModel.findOneAndUpdate(
                         { key: key },
                         { $set: { value: amount } },
                         options
                     );
                      newValue = doc.value;
                 }

                callback(null, newValue);
            } catch (error) {
                console.error(`KynuxDB Mongo Error adding to key "${key}":`, error);
                this.emit("error", error);
                callback(error, undefined);
            }
        })();
    }

    subtract(key, amount) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for subtract operation.");
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new TypeError("KynuxDB Mongo Error: Amount must be a valid number.");
        }
        return this.add(key, -amount);
    }

    push(key, element) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for push operation.");
        }

        return deasync(async (callback) => {
            try {
                const options = { upsert: true, new: true, setDefaultsOnInsert: true };
                const updatedDoc = await this.dataModel.findOneAndUpdate(
                    { key: key },
                    { $push: { value: element } },
                    options
                );

                 const resultValue = Array.isArray(updatedDoc.value) ? updatedDoc.value : [element];

                callback(null, resultValue);
            } catch (error) {
                console.error(`KynuxDB Mongo Error pushing to key "${key}":`, error);
                this.emit("error", error);
                callback(error, undefined);
            }
        })();
    }

    unpush(key, elementToRemove) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for unpush operation.");
        }

        return deasync(async (callback) => {
            try {
                const options = { new: true };
                const updatedDoc = await this.dataModel.findOneAndUpdate(
                    { key: key, value: { $type: "array" } },
                    { $pull: { value: elementToRemove } },
                    options
                );

                callback(null, updatedDoc ? updatedDoc.value : undefined);
            } catch (error) {
                console.error(`KynuxDB Mongo Error unpushing from key "${key}":`, error);
                this.emit("error", error);
                callback(error, undefined);
            }
        })();
    }

    delByPriority(key, index) {
        if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for delByPriority.");
        }
        if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB Mongo Error: Priority index must be a positive number.");
        }

        return deasync(async (callback) => {
            try {
                const currentDoc = await this.dataModel.findOne({ key: key });
                if (!currentDoc || !Array.isArray(currentDoc.value) || currentDoc.value.length < index) {
                    return callback(null, false);
                }

                const updatedList = currentDoc.value.filter((_, idx) => idx !== (index - 1));

                currentDoc.value = updatedList;
                await currentDoc.save();

                callback(null, updatedList);
            } catch (error) {
                console.error(`KynuxDB Mongo Error delByPriority for key "${key}":`, error);
                this.emit("error", error);
                callback(error, false);
            }
        })();
    }

    setByPriority(key, data, index) {
         if (!key) {
            throw new TypeError("KynuxDB Mongo Error: Key must be provided for setByPriority.");
        }
         if (typeof index !== 'number' || isNaN(index) || index < 1) {
            throw new TypeError("KynuxDB Mongo Error: Priority index must be a positive number.");
        }

         return deasync(async (callback) => {
            try {
                const currentDoc = await this.dataModel.findOne({ key: key });
                if (!currentDoc || !Array.isArray(currentDoc.value) || currentDoc.value.length < index) {
                    return callback(null, false);
                }

                currentDoc.value[index - 1] = data;

                await currentDoc.save();

                callback(null, currentDoc.value);
            } catch (error) {
                console.error(`KynuxDB Mongo Error setByPriority for key "${key}":`, error);
                this.emit("error", error);
                callback(error, false);
            }
        })();
    }

    all() {
        return deasync(async (callback) => {
            try {
                const allDocs = await this.dataModel.find({});
                callback(null, allDocs);
            } catch (error) {
                console.error(`KynuxDB Mongo Error fetching all documents:`, error);
                this.emit("error", error);
                callback(error, []);
            }
        })();
    }

    deleteAll() {
        return deasync(async (callback) => {
            try {
                await this.dataModel.deleteMany({});
                callback(null, true);
            } catch (error) {
                console.error(`KynuxDB Mongo Error deleting all documents:`, error);
                this.emit("error", error);
                callback(error, false);
            }
        })();
    }
}

module.exports = MongoDB;