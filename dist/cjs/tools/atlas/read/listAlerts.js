"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAlertsTool = exports.ListAlertsArgs = void 0;
const tool_js_1 = require("../../tool.js");
const atlasTool_js_1 = require("../atlasTool.js");
const args_js_1 = require("../../args.js");
exports.ListAlertsArgs = {
    projectId: args_js_1.AtlasArgs.projectId().describe("Atlas project ID to list alerts for"),
};
class ListAlertsTool extends atlasTool_js_1.AtlasToolBase {
    constructor() {
        super(...arguments);
        this.name = "atlas-list-alerts";
        this.description = "List MongoDB Atlas alerts";
        this.argsShape = {
            ...exports.ListAlertsArgs,
        };
    }
    async execute({ projectId }) {
        const data = await this.session.apiClient.listAlerts({
            params: {
                path: {
                    groupId: projectId,
                },
            },
        });
        if (!data?.results?.length) {
            return { content: [{ type: "text", text: "No alerts found in your MongoDB Atlas project." }] };
        }
        const alerts = data.results.map((alert) => ({
            id: alert.id,
            status: alert.status,
            created: alert.created ? new Date(alert.created).toISOString() : "N/A",
            updated: alert.updated ? new Date(alert.updated).toISOString() : "N/A",
            eventTypeName: alert.eventTypeName,
            acknowledgementComment: alert.acknowledgementComment ?? "N/A",
        }));
        return {
            content: (0, tool_js_1.formatUntrustedData)(`Found ${data.results.length} alerts in project ${projectId}`, JSON.stringify(alerts)),
        };
    }
}
exports.ListAlertsTool = ListAlertsTool;
ListAlertsTool.operationType = "read";
//# sourceMappingURL=listAlerts.js.map