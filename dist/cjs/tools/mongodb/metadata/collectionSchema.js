"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionSchemaTool = void 0;
const mongodbTool_js_1 = require("../mongodbTool.js");
const tool_js_1 = require("../../tool.js");
const mongodb_schema_1 = require("mongodb-schema");
const zod_1 = __importDefault(require("zod"));
const constants_js_1 = require("../../../helpers/constants.js");
const collectCursorUntilMaxBytes_js_1 = require("../../../helpers/collectCursorUntilMaxBytes.js");
const isObjectEmpty_js_1 = require("../../../helpers/isObjectEmpty.js");
const MAXIMUM_SAMPLE_SIZE_HARD_LIMIT = 50000;
class CollectionSchemaTool extends mongodbTool_js_1.MongoDBToolBase {
    constructor() {
        super(...arguments);
        this.name = "collection-schema";
        this.description = "Describe the schema for a collection";
        this.argsShape = {
            ...mongodbTool_js_1.DbOperationArgs,
            sampleSize: zod_1.default.number().optional().default(50).describe("Number of documents to sample for schema inference"),
            responseBytesLimit: zod_1.default
                .number()
                .optional()
                .default(constants_js_1.ONE_MB)
                .describe(`The maximum number of bytes to return in the response. This value is capped by the server's configured maxBytesPerQuery and cannot be exceeded.`),
        };
    }
    async execute({ database, collection, sampleSize, responseBytesLimit }, { signal }) {
        const provider = await this.ensureConnected();
        const cursor = provider.aggregate(database, collection, [
            { $sample: { size: Math.min(sampleSize, MAXIMUM_SAMPLE_SIZE_HARD_LIMIT) } },
        ]);
        const { cappedBy, documents } = await (0, collectCursorUntilMaxBytes_js_1.collectCursorUntilMaxBytesLimit)({
            cursor,
            configuredMaxBytesPerQuery: this.config.maxBytesPerQuery,
            toolResponseBytesLimit: responseBytesLimit,
            abortSignal: signal,
        });
        const schema = await (0, mongodb_schema_1.getSimplifiedSchema)(documents);
        if ((0, isObjectEmpty_js_1.isObjectEmpty)(schema)) {
            return {
                content: [
                    {
                        text: `Could not deduce the schema for "${database}.${collection}". This may be because it doesn't exist or is empty.`,
                        type: "text",
                    },
                ],
            };
        }
        const fieldsCount = Object.keys(schema).length;
        const header = `Found ${fieldsCount} fields in the schema for "${database}.${collection}"`;
        const cappedWarning = cappedBy !== undefined
            ? `\nThe schema was inferred from a subset of documents due to the response size limit. (${cappedBy})`
            : "";
        return {
            content: (0, tool_js_1.formatUntrustedData)(`${header}${cappedWarning}`, JSON.stringify(schema)),
        };
    }
}
exports.CollectionSchemaTool = CollectionSchemaTool;
CollectionSchemaTool.operationType = "metadata";
//# sourceMappingURL=collectionSchema.js.map