"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionIndexesTool = void 0;
const mongodbTool_js_1 = require("../mongodbTool.js");
const tool_js_1 = require("../../tool.js");
class CollectionIndexesTool extends mongodbTool_js_1.MongoDBToolBase {
    constructor() {
        super(...arguments);
        this.name = "collection-indexes";
        this.description = "Describe the indexes for a collection";
        this.argsShape = mongodbTool_js_1.DbOperationArgs;
    }
    async execute({ database, collection }) {
        const provider = await this.ensureConnected();
        const indexes = await provider.getIndexes(database, collection);
        const indexDefinitions = indexes.map((index) => ({
            name: index.name,
            key: index.key,
        }));
        const searchIndexDefinitions = [];
        if (this.isFeatureEnabled("search") && (await this.session.isSearchSupported())) {
            const searchIndexes = await provider.getSearchIndexes(database, collection);
            searchIndexDefinitions.push(...this.extractSearchIndexDetails(searchIndexes));
        }
        return {
            content: [
                ...(0, tool_js_1.formatUntrustedData)(`Found ${indexDefinitions.length} indexes in the collection "${collection}":`, ...indexDefinitions.map((i) => JSON.stringify(i))),
                ...(searchIndexDefinitions.length > 0
                    ? (0, tool_js_1.formatUntrustedData)(`Found ${searchIndexDefinitions.length} search and vector search indexes in the collection "${collection}":`, ...searchIndexDefinitions.map((i) => JSON.stringify(i)))
                    : []),
            ],
        };
    }
    handleError(error, args) {
        if (error instanceof Error && "codeName" in error && error.codeName === "NamespaceNotFound") {
            return {
                content: [
                    {
                        text: `The indexes for "${args.database}.${args.collection}" cannot be determined because the collection does not exist.`,
                        type: "text",
                    },
                ],
                isError: true,
            };
        }
        return super.handleError(error, args);
    }
    /**
     * Atlas Search index status contains a lot of information that is not relevant for the agent at this stage.
     * Like for example, the status on each of the dedicated nodes. We only care about the main status, if it's
     * queryable and the index name. We are also picking the index definition as it can be used by the agent to
     * understand which fields are available for searching.
     **/
    extractSearchIndexDetails(indexes) {
        return indexes.map((index) => ({
            name: (index["name"] ?? "default"),
            type: (index["type"] ?? "UNKNOWN"),
            status: (index["status"] ?? "UNKNOWN"),
            queryable: (index["queryable"] ?? false),
            latestDefinition: index["latestDefinition"],
        }));
    }
}
exports.CollectionIndexesTool = CollectionIndexesTool;
CollectionIndexesTool.operationType = "metadata";
//# sourceMappingURL=collectionIndexes.js.map