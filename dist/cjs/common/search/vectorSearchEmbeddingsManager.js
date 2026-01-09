"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchEmbeddingsManager = exports.quantizationEnum = void 0;
const bson_1 = require("bson");
const zod_1 = __importDefault(require("zod"));
const errors_js_1 = require("../errors.js");
const embeddingsProvider_js_1 = require("./embeddingsProvider.js");
const tool_js_1 = require("../../tools/tool.js");
exports.quantizationEnum = zod_1.default.enum(["none", "scalar", "binary"]);
class VectorSearchEmbeddingsManager {
    constructor(config, connectionManager, embeddings = new Map(), embeddingsProvider = embeddingsProvider_js_1.getEmbeddingsProvider) {
        this.config = config;
        this.connectionManager = connectionManager;
        this.embeddings = embeddings;
        this.embeddingsProvider = embeddingsProvider;
        connectionManager.events.on("connection-close", () => {
            this.embeddings.clear();
        });
    }
    cleanupEmbeddingsForNamespace({ database, collection }) {
        const embeddingDefKey = `${database}.${collection}`;
        this.embeddings.delete(embeddingDefKey);
    }
    async indexExists({ database, collection, indexName, }) {
        const provider = await this.atlasSearchEnabledProvider();
        if (!provider) {
            return false;
        }
        const searchIndexesWithName = await provider.getSearchIndexes(database, collection, indexName);
        return searchIndexesWithName.length >= 1;
    }
    async embeddingsForNamespace({ database, collection, }) {
        const provider = await this.atlasSearchEnabledProvider();
        if (!provider) {
            return [];
        }
        // We only need the embeddings for validation now, so don't query them if
        // validation is disabled.
        if (!this.config.embeddingsValidation) {
            return [];
        }
        const embeddingDefKey = `${database}.${collection}`;
        const definition = this.embeddings.get(embeddingDefKey);
        if (!definition) {
            const allSearchIndexes = await provider.getSearchIndexes(database, collection);
            const vectorSearchIndexes = allSearchIndexes.filter((index) => index.type === "vectorSearch");
            const vectorFields = vectorSearchIndexes
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                .flatMap((index) => index.latestDefinition?.fields ?? [])
                .filter((field) => this.isVectorFieldIndexDefinition(field));
            this.embeddings.set(embeddingDefKey, vectorFields);
            return vectorFields;
        }
        return definition;
    }
    async assertFieldsHaveCorrectEmbeddings({ database, collection }, documents) {
        const embeddingValidationResults = (await Promise.all(documents.map((document) => this.findFieldsWithWrongEmbeddings({ database, collection }, document)))).flat();
        if (embeddingValidationResults.length > 0) {
            const embeddingValidationMessages = embeddingValidationResults.map((validation) => `- Field ${validation.path} is an embedding with ${validation.expectedNumDimensions} dimensions,` +
                ` and the provided value is not compatible. Actual dimensions: ${validation.actualNumDimensions},` +
                ` Error: ${validation.error}`);
            throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.AtlasVectorSearchInvalidQuery, (0, tool_js_1.formatUntrustedData)("", ...embeddingValidationMessages)
                .map(({ text }) => text)
                .join("\n"));
        }
    }
    async findFieldsWithWrongEmbeddings({ database, collection, }, document) {
        const provider = await this.atlasSearchEnabledProvider();
        if (!provider) {
            return [];
        }
        // While we can do our best effort to ensure that the embedding validation is correct
        // based on https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-quantization/
        // it's a complex process so we will also give the user the ability to disable this validation
        if (!this.config.embeddingsValidation) {
            return [];
        }
        const embeddings = await this.embeddingsForNamespace({ database, collection });
        return embeddings
            .map((emb) => this.getValidationErrorForDocument(emb, document))
            .filter((e) => e !== undefined);
    }
    async atlasSearchEnabledProvider() {
        const connectionState = this.connectionManager.currentConnectionState;
        if (connectionState.tag === "connected" && (await connectionState.isSearchSupported())) {
            return connectionState.serviceProvider;
        }
        return null;
    }
    isVectorFieldIndexDefinition(doc) {
        return doc["type"] === "vector";
    }
    getValidationErrorForDocument(definition, document) {
        const fieldPath = definition.path.split(".");
        let fieldRef = document;
        const constructError = (details) => ({
            path: definition.path,
            expectedNumDimensions: definition.numDimensions,
            actualNumDimensions: details.actualNumDimensions ?? "unknown",
            error: details.error ?? "not-a-vector",
        });
        const extractUnderlyingVector = (fieldRef) => {
            if (fieldRef instanceof bson_1.BSON.Binary) {
                try {
                    return fieldRef.toFloat32Array();
                }
                catch {
                    // nothing to do here
                }
                try {
                    return fieldRef.toBits();
                }
                catch {
                    // nothing to do here
                }
            }
            if (Array.isArray(fieldRef)) {
                return fieldRef;
            }
            return undefined;
        };
        for (const field of fieldPath) {
            if (fieldRef && typeof fieldRef === "object" && field in fieldRef) {
                fieldRef = fieldRef[field];
            }
            else {
                return undefined;
            }
        }
        const maybeVector = extractUnderlyingVector(fieldRef);
        if (!maybeVector) {
            return constructError({
                error: "not-a-vector",
            });
        }
        if (maybeVector.length !== definition.numDimensions) {
            return constructError({
                actualNumDimensions: maybeVector.length,
                error: "dimension-mismatch",
            });
        }
        if (Array.isArray(maybeVector) && maybeVector.some((e) => !this.isANumber(e))) {
            return constructError({
                actualNumDimensions: maybeVector.length,
                error: "not-numeric",
            });
        }
        return undefined;
    }
    async assertVectorSearchIndexExists({ database, collection, path, }) {
        const embeddingInfoForCollection = await this.embeddingsForNamespace({ database, collection });
        const embeddingInfoForPath = embeddingInfoForCollection.find((definition) => definition.path === path);
        if (!embeddingInfoForPath) {
            throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.AtlasVectorSearchIndexNotFound, `No Vector Search index found for path "${path}" in namespace "${database}.${collection}"`);
        }
    }
    async generateEmbeddings({ rawValues, embeddingParameters, inputType, }) {
        const provider = await this.atlasSearchEnabledProvider();
        if (!provider) {
            throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.AtlasSearchNotSupported, "Atlas Search is not supported in this cluster.");
        }
        const embeddingsProvider = this.embeddingsProvider(this.config);
        if (!embeddingsProvider) {
            throw new errors_js_1.MongoDBError(errors_js_1.ErrorCodes.NoEmbeddingsProviderConfigured, "No embeddings provider configured.");
        }
        return await embeddingsProvider.embed(embeddingParameters.model, rawValues, {
            inputType,
            ...embeddingParameters,
        });
    }
    isANumber(value) {
        if (typeof value === "number") {
            return true;
        }
        if (value instanceof bson_1.BSON.Int32 ||
            value instanceof bson_1.BSON.Decimal128 ||
            value instanceof bson_1.BSON.Double ||
            value instanceof bson_1.BSON.Long) {
            return true;
        }
        return false;
    }
}
exports.VectorSearchEmbeddingsManager = VectorSearchEmbeddingsManager;
//# sourceMappingURL=vectorSearchEmbeddingsManager.js.map