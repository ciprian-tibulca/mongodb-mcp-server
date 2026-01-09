"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsertManyTool = void 0;
const zod_1 = require("zod");
const mongodbTool_js_1 = require("../mongodbTool.js");
const tool_js_1 = require("../../tool.js");
const args_js_1 = require("../../args.js");
const mongodbSchemas_js_1 = require("../mongodbSchemas.js");
const errors_js_1 = require("../../../common/errors.js");
const zSupportedEmbeddingParametersWithInput = mongodbSchemas_js_1.zSupportedEmbeddingParameters.extend({
    input: zod_1.z
        .array(zod_1.z.object({}).passthrough())
        .describe("Array of objects with vector search index fields as keys (in dot notation) and the raw text values to generate embeddings for as values. The index of each object corresponds to the index of the document in the documents array."),
});
const commonArgs = {
    ...mongodbTool_js_1.DbOperationArgs,
    documents: zod_1.z
        .array((0, args_js_1.zEJSON)().describe("An individual MongoDB document"))
        .describe("The array of documents to insert, matching the syntax of the document argument of db.collection.insertMany()."),
};
class InsertManyTool extends mongodbTool_js_1.MongoDBToolBase {
    constructor() {
        super(...arguments);
        this.name = "insert-many";
        this.description = "Insert an array of documents into a MongoDB collection. If the list of documents is above com.mongodb/maxRequestPayloadBytes, consider inserting them in batches.";
        this.argsShape = this.isFeatureEnabled("search")
            ? {
                ...commonArgs,
                embeddingParameters: zSupportedEmbeddingParametersWithInput
                    .optional()
                    .describe("The embedding model and its parameters to use to generate embeddings for fields with vector search indexes. Note to LLM: If unsure which embedding model to use, ask the user before providing one."),
            }
            : commonArgs;
    }
    async execute({ database, collection, documents, ...conditionalArgs }) {
        const provider = await this.ensureConnected();
        let embeddingParameters;
        if ("embeddingParameters" in conditionalArgs) {
            embeddingParameters = conditionalArgs.embeddingParameters;
        }
        // Process documents to replace raw string values with generated embeddings
        documents = await this.replaceRawValuesWithEmbeddingsIfNecessary({
            database,
            collection,
            documents,
            embeddingParameters,
        });
        await this.session.vectorSearchEmbeddingsManager.assertFieldsHaveCorrectEmbeddings({ database, collection }, documents);
        const result = await provider.insertMany(database, collection, documents);
        const content = (0, tool_js_1.formatUntrustedData)("Documents were inserted successfully.", `Inserted \`${result.insertedCount}\` document(s) into ${database}.${collection}.`, `Inserted IDs: ${Object.values(result.insertedIds).join(", ")}`);
        return {
            content,
        };
    }
    async replaceRawValuesWithEmbeddingsIfNecessary({ database, collection, documents, embeddingParameters, }) {
        // If no embedding parameters or no input specified, return documents as-is
        if (!embeddingParameters?.input || embeddingParameters.input.length === 0) {
            return documents;
        }
        // Get vector search indexes for the collection
        const vectorIndexes = await this.session.vectorSearchEmbeddingsManager.embeddingsForNamespace({
            database,
            collection,
        });
        // Ensure for inputted fields, the vector search index exists.
        for (const input of embeddingParameters.input) {
            for (const fieldPath of Object.keys(input)) {
                if (!vectorIndexes.some((index) => index.path === fieldPath)) {
                    throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.AtlasVectorSearchInvalidQuery, `Field '${fieldPath}' does not have a vector search index in collection ${database}.${collection}. Only fields with vector search indexes can have embeddings generated.`);
                }
            }
        }
        // We make one call to generate embeddings for all documents at once to avoid making too many API calls.
        const flattenedEmbeddingsInput = embeddingParameters.input.flatMap((documentInput, index) => Object.entries(documentInput).map(([fieldPath, rawTextValue]) => ({
            fieldPath,
            rawTextValue,
            documentIndex: index,
        })));
        const generatedEmbeddings = await this.session.vectorSearchEmbeddingsManager.generateEmbeddings({
            rawValues: flattenedEmbeddingsInput.map(({ rawTextValue }) => rawTextValue),
            embeddingParameters,
            inputType: "document",
        });
        const processedDocuments = [...documents];
        for (const [index, { fieldPath, documentIndex }] of flattenedEmbeddingsInput.entries()) {
            if (!processedDocuments[documentIndex]) {
                throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.Unexpected, `Document at index ${documentIndex} does not exist.`);
            }
            // Ensure no nested fields are present in the field path.
            this.deleteFieldPath(processedDocuments[documentIndex], fieldPath);
            processedDocuments[documentIndex][fieldPath] = generatedEmbeddings[index];
        }
        return processedDocuments;
    }
    // Delete a specified field path from a document using dot notation.
    deleteFieldPath(document, fieldPath) {
        const parts = fieldPath.split(".");
        let current = document;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const key = part;
            if (!current[key]) {
                return;
            }
            else if (i === parts.length - 1) {
                delete current[key];
            }
            else {
                current = current[key];
            }
        }
    }
    resolveTelemetryMetadata(args, { result }) {
        if ("embeddingParameters" in args && this.config.voyageApiKey) {
            return {
                ...super.resolveTelemetryMetadata(args, { result }),
                embeddingsGeneratedBy: "mcp",
            };
        }
        else {
            return super.resolveTelemetryMetadata(args, { result });
        }
    }
}
exports.InsertManyTool = InsertManyTool;
InsertManyTool.operationType = "create";
//# sourceMappingURL=insertMany.js.map