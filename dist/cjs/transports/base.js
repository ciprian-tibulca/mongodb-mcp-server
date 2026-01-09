"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportRunnerBase = void 0;
const packageInfo_js_1 = require("../common/packageInfo.js");
const server_js_1 = require("../server.js");
const session_js_1 = require("../common/session.js");
const telemetry_js_1 = require("../telemetry/telemetry.js");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const logger_js_1 = require("../common/logger.js");
const exportsManager_js_1 = require("../common/exportsManager.js");
const deviceId_js_1 = require("../helpers/deviceId.js");
const keychain_js_1 = require("../common/keychain.js");
const connectionManager_js_1 = require("../common/connectionManager.js");
const connectionErrorHandler_js_1 = require("../common/connectionErrorHandler.js");
const elicitation_js_1 = require("../elicitation.js");
const atlasLocal_js_1 = require("../common/atlasLocal.js");
const vectorSearchEmbeddingsManager_js_1 = require("../common/search/vectorSearchEmbeddingsManager.js");
const configOverrides_js_1 = require("../common/config/configOverrides.js");
const apiClient_js_1 = require("../common/atlas/apiClient.js");
class TransportRunnerBase {
    constructor({ userConfig, createConnectionManager = connectionManager_js_1.createMCPConnectionManager, connectionErrorHandler = connectionErrorHandler_js_1.connectionErrorHandler, createAtlasLocalClient = atlasLocal_js_1.defaultCreateAtlasLocalClient, additionalLoggers = [], telemetryProperties = {}, tools, createSessionConfig, createApiClient = apiClient_js_1.createAtlasApiClient, }) {
        this.userConfig = userConfig;
        this.createConnectionManager = createConnectionManager;
        this.connectionErrorHandler = connectionErrorHandler;
        this.atlasLocalClient = createAtlasLocalClient();
        this.telemetryProperties = telemetryProperties;
        this.tools = tools;
        this.createSessionConfig = createSessionConfig;
        this.createApiClient = createApiClient;
        const loggers = [...additionalLoggers];
        if (this.userConfig.loggers.includes("stderr")) {
            loggers.push(new logger_js_1.ConsoleLogger(keychain_js_1.Keychain.root));
        }
        if (this.userConfig.loggers.includes("disk")) {
            loggers.push(new logger_js_1.DiskLogger(this.userConfig.logPath, (err) => {
                // If the disk logger fails to initialize, we log the error to stderr and exit
                console.error("Error initializing disk logger:", err);
                process.exit(1);
            }, keychain_js_1.Keychain.root));
        }
        this.logger = new logger_js_1.CompositeLogger(...loggers);
        this.deviceId = deviceId_js_1.DeviceId.create(this.logger);
    }
    async setupServer(request) {
        let userConfig = this.userConfig;
        if (this.createSessionConfig) {
            userConfig = await this.createSessionConfig({ userConfig, request });
        }
        else {
            userConfig = (0, configOverrides_js_1.applyConfigOverrides)({ baseConfig: this.userConfig, request });
        }
        const mcpServer = new mcp_js_1.McpServer({
            name: packageInfo_js_1.packageInfo.mcpServerName,
            version: packageInfo_js_1.packageInfo.version,
        }, {
            instructions: TransportRunnerBase.getInstructions(userConfig),
        });
        const logger = new logger_js_1.CompositeLogger(this.logger);
        const exportsManager = exportsManager_js_1.ExportsManager.init(userConfig, logger);
        const connectionManager = await this.createConnectionManager({
            logger,
            userConfig,
            deviceId: this.deviceId,
        });
        const apiClient = this.createApiClient({
            baseUrl: userConfig.apiBaseUrl,
            credentials: {
                clientId: userConfig.apiClientId,
                clientSecret: userConfig.apiClientSecret,
            },
        }, logger);
        const session = new session_js_1.Session({
            userConfig,
            atlasLocalClient: await this.atlasLocalClient,
            logger,
            exportsManager,
            connectionManager,
            keychain: keychain_js_1.Keychain.root,
            vectorSearchEmbeddingsManager: new vectorSearchEmbeddingsManager_js_1.VectorSearchEmbeddingsManager(userConfig, connectionManager),
            apiClient,
        });
        const telemetry = telemetry_js_1.Telemetry.create(session, userConfig, this.deviceId, {
            commonProperties: this.telemetryProperties,
        });
        const elicitation = new elicitation_js_1.Elicitation({ server: mcpServer.server });
        const result = new server_js_1.Server({
            mcpServer,
            session,
            telemetry,
            userConfig,
            connectionErrorHandler: this.connectionErrorHandler,
            elicitation,
            tools: this.tools,
        });
        // We need to create the MCP logger after the server is constructed
        // because it needs the server instance
        if (userConfig.loggers.includes("mcp")) {
            logger.addLogger(new logger_js_1.McpLogger(result, keychain_js_1.Keychain.root));
        }
        return result;
    }
    async close() {
        try {
            await this.closeTransport();
        }
        finally {
            this.deviceId.close();
        }
    }
    static getInstructions(config) {
        let instructions = `
            This is the MongoDB MCP server.
        `;
        if (config.connectionString) {
            instructions += `
            This MCP server was configured with a MongoDB connection string, and you can assume that you are connected to a MongoDB cluster.
            `;
        }
        if (config.apiClientId && config.apiClientSecret) {
            instructions += `
            This MCP server was configured with MongoDB Atlas API credentials.`;
        }
        return instructions;
    }
}
exports.TransportRunnerBase = TransportRunnerBase;
//# sourceMappingURL=base.js.map