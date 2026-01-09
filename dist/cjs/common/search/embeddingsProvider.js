"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddingsProvider = getEmbeddingsProvider;
const voyage_ai_provider_1 = require("voyage-ai-provider");
const ai_1 = require("ai");
const assert_1 = __importDefault(require("assert"));
const devtools_proxy_support_1 = require("@mongodb-js/devtools-proxy-support");
const mongodbSchemas_js_1 = require("../../tools/mongodb/mongodbSchemas.js");
class VoyageEmbeddingsProvider {
    constructor({ voyageApiKey }, providedFetch) {
        (0, assert_1.default)(voyageApiKey, "The VoyageAI API Key does not exist. This is likely a bug.");
        // We should always use, by default, any enterprise proxy that the user has configured.
        // Direct requests to VoyageAI might get blocked by the network if they don't go through
        // the provided proxy.
        const customFetch = (providedFetch ??
            (0, devtools_proxy_support_1.createFetch)({ useEnvironmentVariableProxies: true }));
        this.voyage = (0, voyage_ai_provider_1.createVoyage)({ apiKey: voyageApiKey, fetch: customFetch });
    }
    static isConfiguredIn({ voyageApiKey, previewFeatures }) {
        return previewFeatures.includes("search") && !!voyageApiKey;
    }
    async embed(modelId, content, parameters) {
        // This ensures that if we receive any random parameter from the outside (agent or us)
        // it's stripped before sending it to Voyage, as Voyage will reject the request on
        // a single unknown parameter.
        const voyage = mongodbSchemas_js_1.zVoyageAPIParameters.parse(parameters);
        const model = this.voyage.textEmbeddingModel(modelId);
        const { embeddings } = await (0, ai_1.embedMany)({
            model,
            values: content,
            providerOptions: { voyage },
        });
        return embeddings;
    }
}
function getEmbeddingsProvider(userConfig) {
    if (VoyageEmbeddingsProvider.isConfiguredIn(userConfig)) {
        return new VoyageEmbeddingsProvider(userConfig);
    }
    return undefined;
}
//# sourceMappingURL=embeddingsProvider.js.map