import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { type ToolArgs, type OperationType } from "../../tool.js";
import { AtlasToolBase } from "../atlasTool.js";
import type { ClusterDescription20240805 } from "../../../common/atlas/openapi.js";
import { ensureCurrentIpInAccessList } from "../../../common/atlas/accessListUtils.js";
import { AtlasArgs } from "../../args.js";

export class CreateDevClusterTool extends AtlasToolBase {
    static toolName = "atlas-create-dev-cluster";
    public description =
        "Create a dedicated M10 MongoDB Atlas cluster on AWS with compute and disk autoscaling enabled. " +
        "Preferred default for 'dev cluster', 'development', 'dedicated', or 'prototype' workloads that outgrow a free M0 tier. " +
        "Single-region, AWS only (GCP and Azure are not supported by this tool). " +
        "Incurs real cloud costs — compute autoscaling may scale up to M40. No backups. " +
        "For a free ephemeral M0 sandbox with no cost, use `atlas-create-free-cluster` instead.";
    static operationType: OperationType = "create";
    public argsShape = {
        projectId: AtlasArgs.projectId().describe("Atlas project ID to create the cluster in"),
        name: AtlasArgs.clusterName().describe("Name of the cluster"),
        region: AtlasArgs.region().describe("AWS region for the cluster (AWS only)").default("US_EAST_1"),
    };

    public override get annotations(): ToolAnnotations {
        return {
            ...super.annotations,
            title: "Create Dev M10 Cluster (AWS, Paid – autoscales to M40)",
        };
    }

    protected override getConfirmationMessage({ projectId, name, region }: ToolArgs<typeof this.argsShape>): string {
        return (
            `You are about to create a dedicated M10 cluster "${name}" in project "${projectId}" (region: ${region}). ` +
            `This cluster incurs ongoing AWS costs and may autoscale up to M40. Proceed?`
        );
    }

    protected async execute({ projectId, name, region }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const input = {
            clusterType: "REPLICASET",
            name,
            replicationSpecs: [
                {
                    zoneName: "Zone 1",
                    regionConfigs: [
                        {
                            providerName: "AWS",
                            regionName: region,
                            priority: 7,
                            electableSpecs: {
                                instanceSize: "M10",
                                nodeCount: 3,
                            },
                            autoScaling: {
                                compute: {
                                    enabled: true,
                                    scaleDownEnabled: true,
                                    minInstanceSize: "M10",
                                    maxInstanceSize: "M40",
                                },
                                diskGB: {
                                    enabled: true,
                                },
                            },
                        },
                    ],
                },
            ],
            backupEnabled: false,
            terminationProtectionEnabled: false,
        } as unknown as ClusterDescription20240805;

        await ensureCurrentIpInAccessList(this.apiClient, projectId);
        await this.apiClient.createCluster({
            params: {
                path: {
                    groupId: projectId,
                },
            },
            body: input,
        });

        return {
            content: [
                {
                    type: "text",
                    text: `Cluster "${name}" (M10, AWS, single-region) has been created in region "${region}".`,
                },
                { type: "text", text: `Compute and disk autoscaling are enabled. Backups are disabled.` },
                { type: "text", text: `Double check your access lists to enable your current IP.` },
            ],
        };
    }
}
