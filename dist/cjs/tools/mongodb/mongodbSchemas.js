"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchStage = exports.AnyAggregateStage = exports.zSupportedEmbeddingParameters = exports.zVoyageAPIParameters = exports.zVoyageEmbeddingParameters = exports.zVoyageModels = void 0;
const zod_1 = __importDefault(require("zod"));
const args_js_1 = require("../args.js");
exports.zVoyageModels = zod_1.default
    .enum(["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"])
    .default("voyage-3-large");
exports.zVoyageEmbeddingParameters = zod_1.default.object({
    // OpenAPI JSON Schema supports enum only as string so the public facing
    // parameters that are fed to LLM providers should expect the dimensions as
    // stringified numbers which are then transformed to actual numbers.
    outputDimension: zod_1.default
        .union([zod_1.default.literal("256"), zod_1.default.literal("512"), zod_1.default.literal("1024"), zod_1.default.literal("2048"), zod_1.default.literal("4096")])
        .default("1024")
        .transform((value) => Number.parseInt(value))
        .optional(),
    outputDtype: zod_1.default.enum(["float", "int8", "uint8", "binary", "ubinary"]).optional().default("float"),
});
exports.zVoyageAPIParameters = exports.zVoyageEmbeddingParameters
    .extend({
    // Unlike public facing parameters, `zVoyageEmbeddingParameters`, the
    // api parameters need to be correct number and because we do an
    // additional parsing before calling the API, we override the
    // outputDimension schema to expect a union of numbers.
    outputDimension: zod_1.default
        .union([zod_1.default.literal(256), zod_1.default.literal(512), zod_1.default.literal(1024), zod_1.default.literal(2048), zod_1.default.literal(4096)])
        .default(1024)
        .optional(),
    inputType: zod_1.default.enum(["query", "document"]),
})
    .strip();
exports.zSupportedEmbeddingParameters = exports.zVoyageEmbeddingParameters.extend({ model: exports.zVoyageModels });
exports.AnyAggregateStage = (0, args_js_1.zEJSON)();
exports.VectorSearchStage = zod_1.default.object({
    $vectorSearch: zod_1.default
        .object({
        exact: zod_1.default
            .boolean()
            .optional()
            .default(false)
            .describe("When true, uses an ENN algorithm, otherwise uses ANN. Using ENN is not compatible with numCandidates, in that case, numCandidates must be left empty."),
        index: zod_1.default.string().describe("Name of the index, as retrieved from the `collection-indexes` tool."),
        path: zod_1.default
            .string()
            .describe("Field, in dot notation, where to search. There must be a vector search index for that field. Note to LLM: When unsure, use the 'collection-indexes' tool to validate that the field is indexed with a vector search index."),
        queryVector: zod_1.default
            .union([zod_1.default.string(), zod_1.default.array(zod_1.default.number())])
            .describe("The content to search for. The embeddingParameters field is mandatory if the queryVector is a string, in that case, the tool generates the embedding automatically using the provided configuration."),
        numCandidates: zod_1.default
            .number()
            .int()
            .positive()
            .optional()
            .describe("Number of candidates for the ANN algorithm. Mandatory when exact is false."),
        limit: zod_1.default.number().int().positive().optional().default(10),
        filter: (0, args_js_1.zEJSON)()
            .optional()
            .describe("MQL filter that can only use filter fields from the index definition. Note to LLM: If unsure, use the `collection-indexes` tool to learn which fields can be used for filtering."),
        embeddingParameters: exports.zSupportedEmbeddingParameters
            .optional()
            .describe("The embedding model and its parameters to use to generate embeddings before searching. It is mandatory if queryVector is a string value. Note to LLM: If unsure, ask the user before providing one."),
    })
        .passthrough(),
});
//# sourceMappingURL=mongodbSchemas.js.map