"use strict";

const availableLanguages = ["tr", "en"];
const defaultLanguage = "en";
let packageInfo;

let _currentAdapterInstance = null;
let _adapterConfig = {};
let _localeMessages = {};
let _currentLanguage = defaultLanguage;
let _isMongoActive = false;
let _mongoConnectionDetails = {};
let _dbFolderPath = "kynuxdb";
let _dbFileName = "kynuxdb";
let _readableFormat = false;
let _autoPruneEmptyObjects = false;

function _loadLanguage(langCode) {
    try {
        return require(`../language/${langCode.toLowerCase()}.json`);
    } catch (error) {
        console.warn(`KynuxDB Warning: Language file for "${langCode}" not found. Falling back to "${defaultLanguage}".`);
        try {
            return require(`../language/${defaultLanguage}.json`);
        } catch (fallbackError) {
            console.error("KynuxDB Error: Default language file 'en.json' missing!");
            return { errors: {} };
        }
    }
}

function _loadAdapter(adapterName) {
    const supportedAdapters = ["jsondb", "yamldb", "localstorage", "mongo"];
    if (!supportedAdapters.includes(adapterName)) {
        console.warn(`KynuxDB Warning: Unsupported adapter "${adapterName}". Defaulting to "jsondb".`);
        adapterName = "jsondb";
    }

    try {
        const adapterPath = adapterName === "mongo" ? "../adapters/mongo/index" : `../adapters/${adapterName}`;
        return require(adapterPath);
    } catch (error) {
        console.error(`KynuxDB Error: Failed to load adapter "${adapterName}". Check installation and dependencies.`, error);
        throw new Error(`Adapter "${adapterName}" could not be loaded.`);
    }
}

function _checkVersion() {
    try {
        if (!packageInfo) packageInfo = require("../package.json");
        fetch("https://registry.npmjs.org/kynuxdb/latest")
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
            .then(data => {
                if (data && data.version && packageInfo.version !== data.version) {
                    console.warn(_localeMessages?.errors?.oldVersion || `KynuxDB Warning: You are using an outdated version (${packageInfo.version}). Latest is ${data.version}.`);
                }
            })
            .catch(err => {
                 console.warn("KynuxDB Warning: Could not check for latest version.", err);
            });
    } catch (error) {
        console.warn("KynuxDB Warning: Could not read package.json for version check.", error);
    }
}


function _refreshAdapterConfig() {
    const currentAdapterNeedsUpdate = !_currentAdapterInstance;

    _adapterConfig = {
        dbName: _dbFileName,
        dbFolder: _dbFolderPath,
        noBlankData: _autoPruneEmptyObjects,
        readable: _readableFormat,
        language: _currentLanguage,
        ...( _isMongoActive ? { url: _mongoConnectionDetails.url, schema: _mongoConnectionDetails.schema } : {})
    };

    _localeMessages = _loadLanguage(_currentLanguage);

    try {
         if (!_currentAdapterInstance || _isMongoActive) {
            const AdapterClass = _currentAdapterInstance ? _currentAdapterInstance.constructor : _loadAdapter(_isMongoActive ? 'mongo' : 'jsondb');
            const optionsToPass = _isMongoActive ? _mongoConnectionDetails : _adapterConfig;
            _currentAdapterInstance = new AdapterClass(optionsToPass);
             if (_currentAdapterInstance && !_currentAdapterInstance.message) {
                _currentAdapterInstance.message = _localeMessages;
             }
         } else if (_currentAdapterInstance && typeof _currentAdapterInstance.updateOptions === 'function') {
             _currentAdapterInstance.updateOptions(_adapterConfig);
              if (_currentAdapterInstance && !_currentAdapterInstance.message) {
                 _currentAdapterInstance.message = _localeMessages;
              }
         } else if (_currentAdapterInstance) {
             console.warn("KynuxDB Warning: Current adapter might not support dynamic option updates. Re-instantiating.");
             const AdapterClass = _currentAdapterInstance.constructor;
             _currentAdapterInstance = new AdapterClass(_adapterConfig);
              if (_currentAdapterInstance && !_currentAdapterInstance.message) {
                 _currentAdapterInstance.message = _localeMessages;
              }
         }

    } catch (error) {
        console.error("KynuxDB Error: Failed to initialize or configure adapter.", error);
        _currentAdapterInstance = {
            set: ()=>{}, get: ()=>{}, delete: ()=>{}, all: ()=>{}, deleteAll: ()=>{}
        };
    }

    if (!_checkVersion.hasRun) {
        _checkVersion();
        _checkVersion.hasRun = true;
    }
}

const KynuxDB_API = {

    configureLanguage(langCode = defaultLanguage) {
        _currentLanguage = availableLanguages.includes(langCode.toLowerCase())
            ? langCode.toLowerCase()
            : defaultLanguage;
        _localeMessages = _loadLanguage(_currentLanguage);
         if (_currentAdapterInstance) {
             _currentAdapterInstance.message = _localeMessages;
         } else {
             this._refreshAdapterConfig();
         }
        return _currentLanguage;
    },

     configureAdapter(adapterName = 'jsondb', adapterOptions = {}) {
        adapterName = adapterName.toLowerCase();

        if (adapterName === "mongo") {
            try {
                require("mongoose");
                require("deasync");
            } catch (error) {
                throw new TypeError(`KynuxDB Error: To use the 'mongo' adapter, you must install "mongoose" and "deasync" modules. Run 'npm install mongoose deasync'.`);
            }
            _isMongoActive = true;
            _mongoConnectionDetails = adapterOptions;
        } else {
            _isMongoActive = false;
            _mongoConnectionDetails = {};
        }

        try {
            const AdapterClass = _loadAdapter(adapterName);
            const optionsToPass = _isMongoActive ? _mongoConnectionDetails : _adapterConfig;
            _currentAdapterInstance = new AdapterClass(optionsToPass);
             if (_currentAdapterInstance && !_currentAdapterInstance.message) {
                 _currentAdapterInstance.message = _localeMessages;
             }
            this._refreshAdapterConfig();
            return _isMongoActive ? _currentAdapterInstance : true;
        } catch (error) {
             _currentAdapterInstance = null;
            return false;
        }
    },

    configureFolder(folderPath) {
        _dbFolderPath = folderPath || "kynuxdb";
        this._refreshAdapterConfig();
        return true;
    },

    configureFileName(fileName) {
        _dbFileName = fileName || "kynuxdb";
        this._refreshAdapterConfig();
        return true;
    },

    configureReadableFormat(isReadable) {
        _readableFormat = isReadable === true;
        this._refreshAdapterConfig();
        return _readableFormat;
    },

    configureAutoPrune(shouldPrune) {
        _autoPruneEmptyObjects = shouldPrune === true;
        this._refreshAdapterConfig();
        return _autoPruneEmptyObjects;
    },

    set(key, value) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        try {
             return _currentAdapterInstance.set(key, value);
        } catch (e) {
            console.error(`KynuxDB Error in adapter set: ${e}`);
            throw e;
        }
    },

    get(key) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
         try {
            return _currentAdapterInstance.get(key);
         } catch (e) {
             console.error(`KynuxDB Error in adapter get: ${e}`);
             return undefined;
         }
    },

    fetch(key) {
        return this.get(key);
    },

    has(key) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
         try {
             if (typeof _currentAdapterInstance.has === 'function') {
                return _currentAdapterInstance.has(key);
             } else {
                return this.get(key) !== undefined;
             }
         } catch (e) {
            console.error(`KynuxDB Error in adapter has: ${e}`);
            return false;
         }
    },

    delete(key) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        try {
            return _currentAdapterInstance.delete(key);
        } catch (e) {
            console.error(`KynuxDB Error in adapter delete: ${e}`);
            return false;
        }
    },

    add(key, amount) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError(_localeMessages?.errors?.blankNumber || "Amount must be a number.");
        try {
            return _currentAdapterInstance.add(key, amount);
        } catch (e) {
             console.error(`KynuxDB Error in adapter add: ${e}`);
             throw e;
        }
    },

    subtract(key, amount) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError(_localeMessages?.errors?.blankNumber || "Amount must be a number.");

        try {
            const subtractFn = _currentAdapterInstance.subtract || ((k, a) => _currentAdapterInstance.add(k, -a));
            return subtractFn.call(_currentAdapterInstance, key, amount);
        } catch (e) {
            console.error(`KynuxDB Error in adapter subtract: ${e}`);
            throw e;
        }
    },

    push(key, element) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        try {
            return _currentAdapterInstance.push(key, element);
        } catch (e) {
             console.error(`KynuxDB Error in adapter push: ${e}`);
             throw e;
        }
    },

    unpush(key, elementToRemove) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!key) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        try {
            return _currentAdapterInstance.unpush(key, elementToRemove);
        } catch (e) {
             console.error(`KynuxDB Error in adapter unpush: ${e}`);
             throw e;
        }
    },

    delByPriority(key, index) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        const isInvalidKey = !key;
        const isInvalidIndex = typeof index !== 'number' || isNaN(index) || index < 1;

        if (isInvalidKey) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        if (isInvalidIndex) throw new TypeError(_localeMessages?.errors?.blankNumber || "Index must be a positive number.");

        try {
            if (typeof _currentAdapterInstance.delByPriority !== 'function') {
                 console.warn(`KynuxDB Warning: Adapter does not support delByPriority.`);
                 return false;
            }
            return _currentAdapterInstance.delByPriority(key, index);
        } catch (e) {
            console.error(`KynuxDB Error in adapter delByPriority: ${e}`);
            return false;
        }
    },

    setByPriority(key, data, index) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        const isInvalidKey = !key;
        const isInvalidIndex = typeof index !== 'number' || isNaN(index) || index < 1;

        if (isInvalidKey) throw new TypeError(_localeMessages?.errors?.blankName || "Key is required.");
        if (isInvalidIndex) throw new TypeError(_localeMessages?.errors?.blankNumber || "Index must be a positive number.");

        try {
            if (typeof _currentAdapterInstance.setByPriority !== 'function') {
                 console.warn(`KynuxDB Warning: Adapter does not support setByPriority.`);
                 return false;
            }
            return _currentAdapterInstance.setByPriority(key, data, index);
        } catch (e) {
            console.error(`KynuxDB Error in adapter setByPriority: ${e}`);
            return false;
        }
    },

    all() {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        try {
            return _currentAdapterInstance.all();
        } catch (e) {
             console.error(`KynuxDB Error in adapter all: ${e}`);
             return {};
        }
    },

    deleteAll() {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
         try {
            return _currentAdapterInstance.deleteAll();
         } catch (e) {
             console.error(`KynuxDB Error in adapter deleteAll: ${e}`);
             return false;
         }
    },

    importDataFrom(sourceDB) {
        if (!_currentAdapterInstance) this._refreshAdapterConfig();
        if (!sourceDB || typeof sourceDB.fetchAll !== 'function') {
             console.error("KynuxDB Error: Invalid sourceDB provided for import. 'fetchAll' method required.");
             return false;
        }
        console.log("Importing to KynuxDB: Started importing data...");
        try {
            const allSourceData = sourceDB.fetchAll();
            if (!Array.isArray(allSourceData)) {
                 console.error("KynuxDB Error: sourceDB.fetchAll() did not return an array.");
                 return false;
            }
            let importCount = 0;
            allSourceData.forEach((item) => {
                if (item && typeof item.ID === 'string') {
                    this.set(item.ID, item.data);
                    importCount++;
                } else {
                    console.warn("KynuxDB Import Warning: Skipping invalid item during import:", item);
                }
            });
            console.log(`Importing to KynuxDB: Finished importing ${importCount} items.`);
            return true;
        } catch (error) {
            console.error("KynuxDB Error during data import:", error);
            return false;
        }
    }
};

_refreshAdapterConfig();

module.exports = KynuxDB_API;