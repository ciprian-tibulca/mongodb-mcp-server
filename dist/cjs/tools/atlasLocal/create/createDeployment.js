"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDeploymentTool = void 0;
const atlasLocalTool_js_1 = require("../atlasLocalTool.js");
const args_js_1 = require("../../args.js");
const zod_1 = __importDefault(require("zod"));
class CreateDeploymentTool extends atlasLocalTool_js_1.AtlasLocalToolBase {
    constructor() {
        super(...arguments);
        this.name = "atlas-local-create-deployment";
        this.description = "Create a MongoDB Atlas local deployment";
        this.argsShape = {
            deploymentName: args_js_1.CommonArgs.string().describe("Name of the deployment to create").optional(),
            loadSampleData: zod_1.default.boolean().describe("Load sample data into the deployment").optional().default(false),
        };
    }
    async executeWithAtlasLocalClient({ deploymentName, loadSampleData }, { client }) {
        const deploymentOptions = {
            name: deploymentName,
            creationSource: {
                type: "MCPServer",
                source: "MCPServer",
            },
            loadSampleData,
            doNotTrack: !this.telemetry.isTelemetryEnabled(),
        };
        // Create the deployment
        const deployment = await client.createDeployment(deploymentOptions);
        return {
            content: [
                {
                    type: "text",
                    text: `Deployment with container ID "${deployment.containerId}" and name "${deployment.name}" created.`,
                },
            ],
            _meta: {
                ...(await this.lookupTelemetryMetadata(client, deployment.containerId)),
            },
        };
    }
}
exports.CreateDeploymentTool = CreateDeploymentTool;
CreateDeploymentTool.operationType = "create";
//# sourceMappingURL=createDeployment.js.map