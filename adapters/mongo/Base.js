const EventEmitter = require("events").EventEmitter;
const mongoose = require("mongoose");

class KynuxMongoBase extends EventEmitter {

    constructor(mongoConnectURL, connectionParams = {}) {
        super();

        if (!mongoConnectURL || !mongoConnectURL.startsWith("mongodb")) {
            throw new TypeError("KynuxDB Mongo Error: A valid MongoDB connection URL must be provided.");
        }
        if (typeof mongoConnectURL !== "string") {
             throw new TypeError(`KynuxDB Mongo Error: Expected a string for mongoConnectURL, received ${typeof mongoConnectURL}`);
        }
        if (typeof connectionParams !== "object" || connectionParams === null) {
             throw new TypeError(`KynuxDB Mongo Error: Expected an object for connectionParams, received ${typeof connectionParams}`);
        }

        this.mongoURI = mongoConnectURL;
        this.connectionParams = connectionParams;

        this._initializeConnection();
        this._setupConnectionListeners();
    }

    _setupConnectionListeners() {
        const connection = mongoose.connection;

        connection.on("error", (error) => {
            console.error("KynuxDB Mongo Error: Mongoose connection error:", error);
            this.emit("error", error);
        });

        connection.on("open", () => {
            console.log("[KynuxDB Mongo] Successfully connected to MongoDB. Discord: https://discord.gg/wCK5dVSY2n");
            this.emit("ready");
        });

    }


    _initializeConnection() {
        const finalOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ...this.connectionParams
        };

        mongoose.connect(this.mongoURI, finalOptions)
            .catch(err => {
                console.error("KynuxDB Mongo Error: Initial connection failed.", err);
                this.emit("error", err);
            });
    }

    _closeConnection() {
        mongoose.disconnect()
            .then(() => console.log("KynuxDB Mongo: Connection closed."))
            .catch(err => console.error("KynuxDB Mongo Error: Failed to close connection.", err));
    }
}

module.exports = KynuxMongoBase;