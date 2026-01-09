"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const bson_1 = require("bson");
const apiClient_js_1 = require("./atlas/apiClient.js");
const logger_js_1 = require("./logger.js");
const events_1 = __importDefault(require("events"));
const errors_js_1 = require("./errors.js");
const arg_parser_1 = require("@mongosh/arg-parser");
class Session extends events_1.default {
    constructor({ userConfig, logger, connectionManager, exportsManager, keychain, atlasLocalClient, vectorSearchEmbeddingsManager, apiClient, }) {
        super();
        this.sessionId = new bson_1.ObjectId().toString();
        this.userConfig = userConfig;
        this.keychain = keychain;
        this.logger = logger;
        this.apiClient =
            apiClient ??
                (0, apiClient_js_1.createAtlasApiClient)({
                    baseUrl: userConfig.apiBaseUrl,
                    credentials: {
                        clientId: userConfig.apiClientId,
                        clientSecret: userConfig.apiClientSecret,
                    },
                }, logger);
        this.atlasLocalClient = atlasLocalClient;
        this.exportsManager = exportsManager;
        this.connectionManager = connectionManager;
        this.vectorSearchEmbeddingsManager = vectorSearchEmbeddingsManager;
        this.connectionManager.events.on("connection-success", () => this.emit("connect"));
        this.connectionManager.events.on("connection-time-out", (error) => this.emit("connection-error", error));
        this.connectionManager.events.on("connection-close", () => this.emit("disconnect"));
        this.connectionManager.events.on("connection-error", (error) => this.emit("connection-error", error));
    }
    setMcpClient(mcpClient) {
        if (!mcpClient) {
            this.connectionManager.setClientName("unknown");
            this.logger.debug({
                id: logger_js_1.LogId.serverMcpClientSet,
                context: "session",
                message: "MCP client info not found",
            });
        }
        this.mcpClient = {
            name: mcpClient?.name || "unknown",
            version: mcpClient?.version || "unknown",
            title: mcpClient?.title || "unknown",
        };
        // Set the client name on the connection manager for appName generation
        this.connectionManager.setClientName(this.mcpClient.name || "unknown");
    }
    async disconnect() {
        const atlasCluster = this.connectedAtlasCluster;
        await this.connectionManager.close();
        if (atlasCluster?.username && atlasCluster?.projectId) {
            void this.apiClient
                .deleteDatabaseUser({
                params: {
                    path: {
                        groupId: atlasCluster.projectId,
                        username: atlasCluster.username,
                        databaseName: "admin",
                    },
                },
            })
                .catch((err) => {
                const error = err instanceof Error ? err : new Error(String(err));
                this.logger.error({
                    id: logger_js_1.LogId.atlasDeleteDatabaseUserFailure,
                    context: "session",
                    message: `Error deleting previous database user: ${error.message}`,
                });
            });
        }
    }
    async close() {
        await this.disconnect();
        await this.apiClient.close();
        await this.exportsManager.close();
        this.emit("close");
    }
    async connectToConfiguredConnection() {
        const connectionInfo = (0, arg_parser_1.generateConnectionInfoFromCliArgs)({
            ...this.userConfig,
            connectionSpecifier: this.userConfig.connectionString,
        });
        await this.connectToMongoDB(connectionInfo);
    }
    async connectToMongoDB(settings) {
        await this.connectionManager.connect({ ...settings });
    }
    get isConnectedToMongoDB() {
        return this.connectionManager.currentConnectionState.tag === "connected";
    }
    async isSearchSupported() {
        const state = this.connectionManager.currentConnectionState;
        if (state.tag === "connected") {
            return await state.isSearchSupported();
        }
        return false;
    }
    async assertSearchSupported() {
        const isSearchSupported = await this.isSearchSupported();
        if (!isSearchSupported) {
            throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.AtlasSearchNotSupported, "Atlas Search is not supported in the current cluster.");
        }
    }
    get serviceProvider() {
        if (this.isConnectedToMongoDB) {
            const state = this.connectionManager.currentConnectionState;
            return state.serviceProvider;
        }
        throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.NotConnectedToMongoDB, "Not connected to MongoDB");
    }
    get connectedAtlasCluster() {
        return this.connectionManager.currentConnectionState.connectedAtlasCluster;
    }
    get connectionStringAuthType() {
        return this.connectionManager.currentConnectionState.connectionStringAuthType;
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map