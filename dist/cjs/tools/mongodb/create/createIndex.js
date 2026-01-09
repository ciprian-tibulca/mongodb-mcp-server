"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIndexTool = void 0;
const zod_1 = require("zod");
const mongodbTool_js_1 = require("../mongodbTool.js");
const vectorSearchEmbeddingsManager_js_1 = require("../../../common/search/vectorSearchEmbeddingsManager.js");
const schemas_js_1 = require("../../../common/schemas.js");
class CreateIndexTool extends mongodbTool_js_1.MongoDBToolBase {
    constructor() {
        super(...arguments);
        this.vectorSearchIndexDefinition = zod_1.z
            .object({
            type: zod_1.z.literal("vectorSearch"),
            fields: zod_1.z
                .array(zod_1.z.discriminatedUnion("type", [
                zod_1.z
                    .object({
                    type: zod_1.z.literal("filter"),
                    path: zod_1.z
                        .string()
                        .describe("Name of the field to index. For nested fields, use dot notation to specify path to embedded fields"),
                })
                    .strict()
                    .describe("Definition for a field that will be used for pre-filtering results."),
                zod_1.z
                    .object({
                    type: zod_1.z.literal("vector"),
                    path: zod_1.z
                        .string()
                        .describe("Name of the field to index. For nested fields, use dot notation to specify path to embedded fields"),
                    numDimensions: zod_1.z
                        .number()
                        .min(1)
                        .max(8192)
                        .default(this.config.vectorSearchDimensions)
                        .describe("Number of vector dimensions that MongoDB Vector Search enforces at index-time and query-time"),
                    similarity: zod_1.z
                        .enum(schemas_js_1.similarityValues)
                        .default(this.config.vectorSearchSimilarityFunction)
                        .describe("Vector similarity function to use to search for top K-nearest neighbors. You can set this field only for vector-type fields."),
                    quantization: vectorSearchEmbeddingsManager_js_1.quantizationEnum
                        .default("none")
                        .describe("Type of automatic vector quantization for your vectors. Use this setting only if your embeddings are float or double vectors."),
                })
                    .strict()
                    .describe("Definition for a field that contains vector embeddings."),
            ]))
                .nonempty()
                .refine((fields) => fields.some((f) => f.type === "vector"), {
                message: "At least one vector field must be defined",
            })
                .describe("Definitions for the vector and filter fields to index, one definition per document. You must specify `vector` for fields that contain vector embeddings and `filter` for additional fields to filter on. At least one vector-type field definition is required."),
        })
            .describe("Definition for a Vector Search index.");
        this.atlasSearchIndexDefinition = zod_1.z
            .object({
            type: zod_1.z.literal("search"),
            analyzer: zod_1.z
                .string()
                .optional()
                .default("lucene.standard")
                .describe("The analyzer to use for the index. Can be one of the built-in lucene analyzers (`lucene.standard`, `lucene.simple`, `lucene.whitespace`, `lucene.keyword`), a language-specific analyzer, such as `lucene.cjk` or `lucene.czech`, or a custom analyzer defined in the Atlas UI."),
            mappings: zod_1.z
                .object({
                dynamic: zod_1.z
                    .boolean()
                    .optional()
                    .default(false)
                    .describe("Enables or disables dynamic mapping of fields for this index. If set to true, Atlas Search recursively indexes all dynamically indexable fields. If set to false, you must specify individual fields to index using mappings.fields."),
                fields: zod_1.z
                    .record(zod_1.z.string().describe("The field name"), zod_1.z
                    .object({
                    type: zod_1.z
                        .enum([
                        "autocomplete",
                        "boolean",
                        "date",
                        "document",
                        "embeddedDocuments",
                        "geo",
                        "number",
                        "objectId",
                        "string",
                        "token",
                        "uuid",
                    ])
                        .describe("The field type"),
                })
                    .passthrough()
                    .describe("The field index definition. It must contain the field type, as well as any additional options for that field type."))
                    .optional()
                    .describe("The field mapping definitions. If `dynamic` is set to `false`, this is required."),
            })
                .refine((data) => data.dynamic !== !!(data.fields && Object.keys(data.fields).length > 0), {
                message: "Either `dynamic` must be `true` and `fields` empty or `dynamic` must be `false` and at least one field must be defined in `fields`",
            })
                .describe("Document describing the index to create. Either `dynamic` must be `true` and `fields` empty or `dynamic` must be `false` and at least one field must be defined in the `fields` document."),
            numPartitions: zod_1.z
                .union([zod_1.z.literal("1"), zod_1.z.literal("2"), zod_1.z.literal("4")])
                .default("1")
                .transform((value) => Number.parseInt(value))
                .describe("Specifies the number of sub-indexes to create if the document count exceeds two billion. If omitted, defaults to 1."),
        })
            .describe("Definition for an Atlas Search (lexical) index.");
        this.name = "create-index";
        this.description = "Create an index for a collection";
        this.argsShape = {
            ...mongodbTool_js_1.DbOperationArgs,
            name: zod_1.z.string().optional().describe("The name of the index"),
            definition: zod_1.z
                .array(zod_1.z.discriminatedUnion("type", [
                zod_1.z
                    .object({
                    type: zod_1.z.literal("classic"),
                    keys: zod_1.z.object({}).catchall(zod_1.z.custom()).describe("The index definition"),
                })
                    .describe("Definition for a MongoDB index (e.g. ascending/descending/geospatial)."),
                ...(this.isFeatureEnabled("search")
                    ? [this.vectorSearchIndexDefinition, this.atlasSearchIndexDefinition]
                    : []),
            ]))
                .describe(`The index definition. Use 'classic' for standard indexes${this.isFeatureEnabled("search") ? ", 'vectorSearch' for vector search indexes, and 'search' for Atlas Search (lexical) indexes" : ""}.`),
        };
    }
    async execute({ database, collection, name, definition: definitions, }) {
        const provider = await this.ensureConnected();
        let indexes = [];
        const definition = definitions[0];
        if (!definition) {
            throw new Error("Index definition not provided. Expected one of the following: `classic`, `vectorSearch`");
        }
        let responseClarification = "";
        switch (definition.type) {
            case "classic":
                indexes = await provider.createIndexes(database, collection, [
                    {
                        key: definition.keys,
                        name,
                    },
                ]);
                break;
            case "vectorSearch":
                {
                    await this.ensureSearchIsSupported();
                    indexes = await provider.createSearchIndexes(database, collection, [
                        {
                            name,
                            definition: {
                                fields: definition.fields,
                            },
                            type: "vectorSearch",
                        },
                    ]);
                    responseClarification =
                        " Since this is a vector search index, it may take a while for the index to build. Use the `list-indexes` tool to check the index status.";
                    // clean up the embeddings cache so it considers the new index
                    this.session.vectorSearchEmbeddingsManager.cleanupEmbeddingsForNamespace({ database, collection });
                }
                break;
            case "search":
                {
                    await this.ensureSearchIsSupported();
                    indexes = await provider.createSearchIndexes(database, collection, [
                        {
                            name,
                            definition: {
                                mappings: definition.mappings,
                                analyzer: definition.analyzer,
                                numPartitions: definition.numPartitions,
                            },
                            type: "search",
                        },
                    ]);
                    responseClarification =
                        " Since this is a search index, it may take a while for the index to build. Use the `list-indexes` tool to check the index status.";
                }
                break;
        }
        return {
            content: [
                {
                    text: `Created the index "${indexes[0]}" on collection "${collection}" in database "${database}".${responseClarification}`,
                    type: "text",
                },
            ],
        };
    }
}
exports.CreateIndexTool = CreateIndexTool;
CreateIndexTool.operationType = "create";
//# sourceMappingURL=createIndex.js.map