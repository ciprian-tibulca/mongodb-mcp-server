"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_CONFIG_KEYS = exports.UserConfigSchema = exports.configRegistry = void 0;
const v4_1 = require("zod/v4");
const configUtils_js_1 = require("./configUtils.js");
const schemas_js_1 = require("../schemas.js");
const arg_parser_1 = require("@mongosh/arg-parser/arg-parser");
const constants_js_1 = require("../../transports/constants.js");
exports.configRegistry = v4_1.z.registry();
const ServerConfigSchema = v4_1.z.object({
    apiBaseUrl: v4_1.z
        .string()
        .default("https://cloud.mongodb.com/")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    apiClientId: v4_1.z
        .string()
        .optional()
        .describe("Atlas API client ID for authentication. Required for running Atlas tools.")
        .register(exports.configRegistry, { isSecret: true, overrideBehavior: "not-allowed" }),
    apiClientSecret: v4_1.z
        .string()
        .optional()
        .describe("Atlas API client secret for authentication. Required for running Atlas tools.")
        .register(exports.configRegistry, { isSecret: true, overrideBehavior: "not-allowed" }),
    connectionString: v4_1.z
        .string()
        .optional()
        .describe("MongoDB connection string for direct database connections. Optional, if not set, you'll need to call the connect tool before interacting with MongoDB data.")
        .register(exports.configRegistry, { isSecret: true, overrideBehavior: "not-allowed" }),
    loggers: v4_1.z
        .preprocess((val) => (0, configUtils_js_1.commaSeparatedToArray)(val), v4_1.z.array(v4_1.z.enum(["stderr", "disk", "mcp"])))
        .check(v4_1.z.minLength(1, "Cannot be an empty array"), v4_1.z.refine((val) => new Set(val).size === val.length, {
        message: "Duplicate loggers found in config",
    }))
        .default(["disk", "mcp"])
        .describe("An array of logger types.")
        .register(exports.configRegistry, {
        defaultValueDescription: '`"disk,mcp"` see below*',
        overrideBehavior: "not-allowed",
    }),
    logPath: v4_1.z
        .string()
        .default((0, configUtils_js_1.getLogPath)())
        .describe("Folder to store logs.")
        .register(exports.configRegistry, { defaultValueDescription: "see below*", overrideBehavior: "not-allowed" }),
    disabledTools: v4_1.z
        .preprocess((val) => (0, configUtils_js_1.commaSeparatedToArray)(val), v4_1.z.array(v4_1.z.string()))
        .default([])
        .describe("An array of tool names, operation types, and/or categories of tools that will be disabled.")
        .register(exports.configRegistry, { overrideBehavior: "merge" }),
    confirmationRequiredTools: v4_1.z
        .preprocess((val) => (0, configUtils_js_1.commaSeparatedToArray)(val), v4_1.z.array(v4_1.z.string()))
        .default([
        "atlas-create-access-list",
        "atlas-create-db-user",
        "drop-database",
        "drop-collection",
        "delete-many",
        "drop-index",
    ])
        .describe("An array of tool names that require user confirmation before execution. Requires the client to support elicitation.")
        .register(exports.configRegistry, { overrideBehavior: "merge" }),
    readOnly: v4_1.z
        .preprocess(configUtils_js_1.parseBoolean, v4_1.z.boolean())
        .default(false)
        .describe("When set to true, only allows read, connect, and metadata operation types, disabling create/update/delete operations.")
        .register(exports.configRegistry, {
        overrideBehavior: (0, configUtils_js_1.oneWayOverride)(true),
    }),
    indexCheck: v4_1.z
        .preprocess(configUtils_js_1.parseBoolean, v4_1.z.boolean())
        .default(false)
        .describe("When set to true, enforces that query operations must use an index, rejecting queries that perform a collection scan.")
        .register(exports.configRegistry, {
        overrideBehavior: (0, configUtils_js_1.oneWayOverride)(true),
    }),
    telemetry: v4_1.z
        .enum(["enabled", "disabled"])
        .default("enabled")
        .describe("When set to disabled, disables telemetry collection.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    transport: v4_1.z
        .enum(["stdio", "http"])
        .default("stdio")
        .describe("Either 'stdio' or 'http'.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    httpPort: v4_1.z.coerce
        .number()
        .int()
        .min(0, "Invalid httpPort: must be at least 0")
        .max(65535, "Invalid httpPort: must be at most 65535")
        .default(3000)
        .describe("Port number for the HTTP server (only used when transport is 'http'). Use 0 for a random port.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    httpHost: v4_1.z
        .string()
        .default("127.0.0.1")
        .describe("Host address to bind the HTTP server to (only used when transport is 'http').")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    httpHeaders: v4_1.z
        .object({})
        .loose()
        .default({})
        .describe("Header that the HTTP server will validate when making requests (only used when transport is 'http').")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    httpBodyLimit: v4_1.z.coerce
        .number()
        .int()
        .min(constants_js_1.TRANSPORT_PAYLOAD_LIMITS.http, `Invalid httpBodyLimit: must be at least ${constants_js_1.TRANSPORT_PAYLOAD_LIMITS.http} bytes`)
        .default(constants_js_1.TRANSPORT_PAYLOAD_LIMITS.http)
        .describe("Maximum size of the HTTP request body in bytes (only used when transport is 'http'). This value is passed as the optional limit parameter to the Express.js json() middleware.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    idleTimeoutMs: v4_1.z.coerce
        .number()
        .default(600000)
        .describe("Idle timeout for a client to disconnect (only applies to http transport).")
        .register(exports.configRegistry, { overrideBehavior: (0, configUtils_js_1.onlyLowerThanBaseValueOverride)() }),
    notificationTimeoutMs: v4_1.z.coerce
        .number()
        .default(540000)
        .describe("Notification timeout for a client to be aware of disconnect (only applies to http transport).")
        .register(exports.configRegistry, { overrideBehavior: (0, configUtils_js_1.onlyLowerThanBaseValueOverride)() }),
    maxBytesPerQuery: v4_1.z.coerce
        .number()
        .default(16777216)
        .describe("The maximum size in bytes for results from a find or aggregate tool call. This serves as an upper bound for the responseBytesLimit parameter in those tools.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    maxDocumentsPerQuery: v4_1.z.coerce
        .number()
        .default(100)
        .describe("The maximum number of documents that can be returned by a find or aggregate tool call. For the find tool, the effective limit will be the smaller of this value and the tool's limit parameter.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    exportsPath: v4_1.z
        .string()
        .default((0, configUtils_js_1.getExportsPath)())
        .describe("Folder to store exported data files.")
        .register(exports.configRegistry, { defaultValueDescription: "see below*", overrideBehavior: "not-allowed" }),
    exportTimeoutMs: v4_1.z.coerce
        .number()
        .default(300000)
        .describe("Time in milliseconds after which an export is considered expired and eligible for cleanup.")
        .register(exports.configRegistry, { overrideBehavior: (0, configUtils_js_1.onlyLowerThanBaseValueOverride)() }),
    exportCleanupIntervalMs: v4_1.z.coerce
        .number()
        .default(120000)
        .describe("Time in milliseconds between export cleanup cycles that remove expired export files.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    atlasTemporaryDatabaseUserLifetimeMs: v4_1.z.coerce
        .number()
        .default(14400000)
        .describe("Time in milliseconds that temporary database users created when connecting to MongoDB Atlas clusters will remain active before being automatically deleted.")
        .register(exports.configRegistry, { overrideBehavior: (0, configUtils_js_1.onlyLowerThanBaseValueOverride)() }),
    voyageApiKey: v4_1.z
        .string()
        .default("")
        .describe("API key for Voyage AI embeddings service (required for vector search operations with text-to-embedding conversion).")
        .register(exports.configRegistry, { isSecret: true, overrideBehavior: "not-allowed" }),
    embeddingsValidation: v4_1.z
        .preprocess(configUtils_js_1.parseBoolean, v4_1.z.boolean())
        .default(true)
        .describe("When set to false, disables validation of embeddings dimensions.")
        .register(exports.configRegistry, { overrideBehavior: (0, configUtils_js_1.oneWayOverride)(true) }),
    vectorSearchDimensions: v4_1.z.coerce
        .number()
        .default(1024)
        .describe("Default number of dimensions for vector search embeddings.")
        .register(exports.configRegistry, { overrideBehavior: "override" }),
    vectorSearchSimilarityFunction: v4_1.z
        .enum(schemas_js_1.similarityValues)
        .default("euclidean")
        .describe("Default similarity function for vector search: 'euclidean', 'cosine', or 'dotProduct'.")
        .register(exports.configRegistry, { overrideBehavior: "override" }),
    previewFeatures: v4_1.z
        .preprocess((val) => (0, configUtils_js_1.commaSeparatedToArray)(val), v4_1.z.array(v4_1.z.enum(schemas_js_1.previewFeatureValues)))
        .default([])
        .describe("An array of preview features that are enabled.")
        .register(exports.configRegistry, { overrideBehavior: (0, configUtils_js_1.onlySubsetOfBaseValueOverride)() }),
    allowRequestOverrides: v4_1.z
        .preprocess(configUtils_js_1.parseBoolean, v4_1.z.boolean())
        .default(false)
        .describe("When set to true, allows configuration values to be overridden via request headers and query parameters.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
    dryRun: v4_1.z
        .boolean()
        .default(false)
        .describe("When true, runs the server in dry mode: dumps configuration and enabled tools, then exits without starting the server.")
        .register(exports.configRegistry, { overrideBehavior: "not-allowed" }),
});
exports.UserConfigSchema = v4_1.z.object({
    ...arg_parser_1.CliOptionsSchema.shape,
    ...ServerConfigSchema.shape,
});
exports.ALL_CONFIG_KEYS = Object.keys(exports.UserConfigSchema.shape);
//# sourceMappingURL=userConfig.js.map