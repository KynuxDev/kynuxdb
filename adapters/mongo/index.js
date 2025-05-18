'use strict';
const KynuxMongoBase = require('./Base');
const loadSchema = require('./Schema');
class MongoDB extends KynuxMongoBase {
  constructor(options) {
    if (!options || !options.url) {
      throw new TypeError(
        "KynuxDB Mongo Error: Connection URL ('url') is required in options."
      );
    }
    super(options.url, options.connectionParams || {});

    this.dataModel = loadSchema(options.schema);
    this.message = {};
    this.ready = false;

    this.on('ready', () => {
      this.ready = true;
      console.log('[KynuxDB Mongo Adapter] Ready.');
    });
    this.on('error', (err) => {
      this.ready = false;
      console.error('[KynuxDB Mongo Adapter] Connection error:', err);
    });

    this._connectionPromise = new Promise((resolve, reject) => {
      if (this.ready) {
        resolve();
        return;
      }
      this.once('ready', resolve);
      this.once('error', (err) => {
        console.error(
          '[KynuxDB Mongo Adapter] Failed to connect during initialization.',
          err
        );
        reject(new Error('KynuxDB Mongo Error: Database connection failed.'));
      });
    });
  }

  async _checkReady() {
    if (!this.ready) {
      await this._connectionPromise;
    }
    if (!this.ready) {
      throw new Error(
        'KynuxDB Mongo Error: Database connection is not ready after attempting to connect.'
      );
    }
  }

  updateOptions(newOptions) {
    this.message = newOptions.message || this.message;
  }

  async set(key, value, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    await this._checkReady();
    try {
      const mongooseOptions = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        session: opOptions.session,
      };
      const updatedDoc = await this.dataModel.findOneAndUpdate(
        { key: key },
        { $set: { value: value } },
        mongooseOptions
      );
      return updatedDoc ? updatedDoc.value : undefined;
    } catch (error) {
      console.error(`KynuxDB Mongo Error setting key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async get(key, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    await this._checkReady();
    try {
      const foundDoc = await this.dataModel.findOne({ key: key }, null, {
        session: opOptions.session,
      });
      return foundDoc ? foundDoc.value : undefined;
    } catch (error) {
      console.error(`KynuxDB Mongo Error getting key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  fetch(key, opOptions = {}) {
    return this.get(key, opOptions);
  }

  async has(key, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    await this._checkReady();
    try {
      const count = await this.dataModel.countDocuments(
        { key: key },
        { session: opOptions.session }
      );
      return count > 0;
    } catch (error) {
      console.error(`KynuxDB Mongo Error checking key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async delete(key, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    await this._checkReady();
    try {
      const result = await this.dataModel.deleteOne(
        { key: key },
        { session: opOptions.session }
      );
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`KynuxDB Mongo Error deleting key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async add(key, amount, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    if (typeof amount !== 'number' || isNaN(amount))
      throw new TypeError(
        this.message?.errors?.blankNumber || 'Amount must be a number.'
      );
    await this._checkReady();
    try {
      const mongooseOptions = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        session: opOptions.session,
      };
      let updatedDoc = await this.dataModel.findOneAndUpdate(
        { key: key },
        { $inc: { value: amount } },
        mongooseOptions
      );
      if (updatedDoc && typeof updatedDoc.value !== 'number') {
        updatedDoc = await this.dataModel.findOneAndUpdate(
          { key: key },
          { $set: { value: amount } },
          mongooseOptions
        );
      } else if (!updatedDoc) {
        updatedDoc = await this.dataModel.findOneAndUpdate(
          { key: key },
          { $set: { value: amount } },
          mongooseOptions
        );
      }
      return updatedDoc ? updatedDoc.value : amount;
    } catch (error) {
      console.error(`KynuxDB Mongo Error adding to key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  subtract(key, amount, opOptions = {}) {
    if (typeof amount !== 'number' || isNaN(amount))
      throw new TypeError(
        this.message?.errors?.blankNumber || 'Amount must be a number.'
      );
    return this.add(key, -amount, opOptions);
  }

  async push(key, element, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    await this._checkReady();
    try {
      const mongooseOptions = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        session: opOptions.session,
      };
      const updatedDoc = await this.dataModel.findOneAndUpdate(
        { key: key },
        { $push: { value: element } },
        mongooseOptions
      );
      return updatedDoc ? updatedDoc.value : [element];
    } catch (error) {
      console.error(`KynuxDB Mongo Error pushing to key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async unpush(key, elementToRemove, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    await this._checkReady();
    try {
      const mongooseOptions = { new: true, session: opOptions.session };
      const updatedDoc = await this.dataModel.findOneAndUpdate(
        { key: key, value: { $type: 'array' } },
        { $pull: { value: elementToRemove } },
        mongooseOptions
      );
      return updatedDoc ? updatedDoc.value : undefined;
    } catch (error) {
      console.error(`KynuxDB Mongo Error unpushing from key "${key}":`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async delByPriority(key, index, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    if (typeof index !== 'number' || isNaN(index) || index < 1)
      throw new TypeError(
        this.message?.errors?.blankNumber || 'Index must be a positive number.'
      );
    await this._checkReady();
    try {
      const currentDoc = await this.dataModel.findOne({ key: key }, null, {
        session: opOptions.session,
      });

      if (
        !currentDoc ||
        !Array.isArray(currentDoc.value) ||
        currentDoc.value.length < index
      ) {
        return false;
      }

      const updatedList = currentDoc.value.filter(
        (_, idx) => idx !== index - 1
      );
      currentDoc.value = updatedList;
      await currentDoc.save({ session: opOptions.session });

      return updatedList;
    } catch (error) {
      console.error(
        `KynuxDB Mongo Error delByPriority for key "${key}":`,
        error
      );
      this.emit('error', error);
      throw error;
    }
  }

  async setByPriority(key, data, index, opOptions = {}) {
    if (!key)
      throw new TypeError(
        this.message?.errors?.blankName || 'Key is required.'
      );
    if (typeof index !== 'number' || isNaN(index) || index < 1)
      throw new TypeError(
        this.message?.errors?.blankNumber || 'Index must be a positive number.'
      );
    await this._checkReady();
    try {
      const currentDoc = await this.dataModel.findOne({ key: key }, null, {
        session: opOptions.session,
      });

      if (
        !currentDoc ||
        !Array.isArray(currentDoc.value) ||
        currentDoc.value.length < index
      ) {
        return false;
      }

      currentDoc.value[index - 1] = data;
      currentDoc.markModified('value');
      await currentDoc.save({ session: opOptions.session });

      return currentDoc.value;
    } catch (error) {
      console.error(
        `KynuxDB Mongo Error setByPriority for key "${key}":`,
        error
      );
      this.emit('error', error);
      throw error;
    }
  }

  async all(opOptions = {}) {
    await this._checkReady();
    try {
      const allDocs = await this.dataModel.find({}, null, {
        session: opOptions.session,
      });
      const result = {};
      allDocs.forEach((doc) => {
        result[doc.key] = doc.value;
      });
      return result;
    } catch (error) {
      console.error(`KynuxDB Mongo Error fetching all documents:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async deleteAll(opOptions = {}) {
    await this._checkReady();
    try {
      await this.dataModel.deleteMany({}, { session: opOptions.session });
      return true;
    } catch (error) {
      console.error(`KynuxDB Mongo Error deleting all documents:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async _find(query, options = {}) {
    await this._checkReady();
    try {
      const MongooseQuery = {};
      for (const key in query) {
        MongooseQuery[`value.${key}`] = query[key];
      }

      let findOperation = this.dataModel.find(MongooseQuery, null, {
        session: options.session,
      });

      if (
        options.projection &&
        typeof options.projection === 'object' &&
        Object.keys(options.projection).length > 0
      ) {
        const MongooseProjection = {};
        for (const key in options.projection) {
          if (key === '_id' || key.startsWith('value.')) {
            MongooseProjection[key] = options.projection[key];
          } else {
            MongooseProjection[`value.${key}`] = options.projection[key];
          }
        }
        findOperation = findOperation.select(MongooseProjection);
      }

      if (options.sort && typeof options.sort === 'object') {
        const MongooseSort = {};
        for (const key in options.sort) {
          MongooseSort[`value.${key}`] = options.sort[key];
        }
        findOperation = findOperation.sort(MongooseSort);
      }

      if (
        options.skip &&
        typeof options.skip === 'number' &&
        options.skip > 0
      ) {
        findOperation = findOperation.skip(options.skip);
      }
      if (
        options.limit &&
        typeof options.limit === 'number' &&
        options.limit > 0
      ) {
        findOperation = findOperation.limit(options.limit);
      }

      const docs = await findOperation.exec();
      return docs.map((doc) => {
        if (doc.value !== undefined) {
          return doc.value;
        }
        return doc.value;
      });
    } catch (error) {
      console.error(`KynuxDB Mongo Error during find operation:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async _startTransaction() {
    await this._checkReady();
    const session = await this.connection.startSession();
    session.startTransaction();
    return session;
  }

  async _commitTransaction(session) {
    if (!session) throw new Error('Session is required to commit transaction.');
    await session.commitTransaction();
    session.endSession();
  }

  async _abortTransaction(session) {
    if (!session) throw new Error('Session is required to abort transaction.');
    await session.abortTransaction();
    session.endSession();
  }
}

module.exports = MongoDB;
