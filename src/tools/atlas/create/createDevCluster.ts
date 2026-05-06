import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { type ToolArgs, type OperationType } from "../../tool.js";
import { AtlasToolBase } from "../atlasTool.js";
import type { ClusterDescription20240805 } from "../../../common/atlas/openapi.js";
import { ensureCurrentIpInAccessList } from "../../../common/atlas/accessListUtils.js";
import { AtlasArgs } from "../../args.js";

const ALLOWED_INSTANCE_SIZES = ["M10", "M20"] as const;
type DevInstanceSize = (typeof ALLOWED_INSTANCE_SIZES)[number];

type ConfigValidationParams = {
    clusterType: string;
    providerName: string;
    instanceSize: string;
    computeAutoscalingEnabled: boolean;
    diskAutoscalingEnabled: boolean;
    replicationSpecsCount: number;
    regionConfigsCount: number;
    analyticsNodeCount: number;
    readOnlyNodeCount: number;
    backupEnabled: boolean;
};

export class CreateDevClusterTool extends AtlasToolBase {
    static toolName = "atlas-create-dev-cluster";
    public description =
        "Create the lowest-cost dedicated MongoDB Atlas cluster with autoscaling enabled — an M10 on AWS. " +
        "Preferred default for 'dev cluster', 'development', 'prototype', or any workload that needs autoscaling at minimum cost. " +
        "Compute and disk autoscaling enabled; scales up to M40 automatically. No backups by default. " +
        "Single-region, AWS only (GCP and Azure are not supported by this tool). " +
        "For a completely free sandbox with no autoscaling, use `atlas-create-free-cluster` instead. " +
        "For production workloads requiring M30+ instances, use `atlas-create-prod-cluster` instead.";
    static operationType: OperationType = "create";
    public argsShape = {
        projectId: AtlasArgs.projectId().describe("Atlas project ID to create the cluster in"),
        name: AtlasArgs.clusterName().describe("Name of the cluster"),
        region: AtlasArgs.region().describe("AWS region for the cluster (AWS only)").default("US_EAST_1"),
        instanceSize: z
            .enum(ALLOWED_INSTANCE_SIZES)
            .default("M10")
            .describe("Instance size. M10 is required for a standard dev cluster; M20 is accepted but incurs higher cost."),
        backupEnabled: z
            .boolean()
            .default(false)
            .describe("Enable cloud backups. Defaults to false; enabling incurs additional cost."),
    };

    public override get annotations(): ToolAnnotations {
        return {
            ...super.annotations,
            title: "Create Dev M10 Cluster (AWS, Paid – autoscales to M40)",
        };
    }

    protected override getConfirmationMessage({
        projectId,
        name,
        region,
        instanceSize,
    }: ToolArgs<typeof this.argsShape>): string {
        return (
            `You are about to create a dedicated ${instanceSize} cluster "${name}" in project "${projectId}" (region: ${region}). ` +
            `This cluster incurs ongoing AWS costs and may autoscale up to M40. Proceed?`
        );
    }

    private validateConfig(params: ConfigValidationParams): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (params.clusterType !== "REPLICASET") {
            errors.push(`cluster_type must be REPLICASET, got: ${params.clusterType}`);
        }
        if (params.providerName !== "AWS") {
            errors.push(`provider_name must be AWS, got: ${params.providerName}`);
        }
        if (!ALLOWED_INSTANCE_SIZES.includes(params.instanceSize as DevInstanceSize)) {
            errors.push(`instance_size must be one of ${ALLOWED_INSTANCE_SIZES.join(", ")}, got: ${params.instanceSize}`);
        }
        if (!params.computeAutoscalingEnabled) {
            errors.push("auto_scaling.compute must be enabled");
        }
        if (!params.diskAutoscalingEnabled) {
            errors.push("auto_scaling.disk_gb must be enabled");
        }
        if (params.replicationSpecsCount !== 1) {
            errors.push(`replication_specs must have exactly 1 entry, got: ${params.replicationSpecsCount}`);
        }
        if (params.regionConfigsCount !== 1) {
            errors.push(`region_configs must have exactly 1 entry, got: ${params.regionConfigsCount}`);
        }
        if (params.analyticsNodeCount > 0) {
            errors.push("analytics nodes are not permitted for a dev cluster");
        }
        if (params.readOnlyNodeCount > 0) {
            errors.push("read-only nodes are not permitted for a dev cluster");
        }

        if (params.instanceSize === "M20") {
            warnings.push("instance_size is M20; M10 is the recommended size for a dev cluster and incurs lower cost.");
        }
        if (params.backupEnabled) {
            warnings.push("backupEnabled is true; this incurs additional cost. Disable backups unless required.");
        }

        return { errors, warnings };
    }

    protected async execute({
        projectId,
        name,
        region,
        instanceSize,
        backupEnabled,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const { errors, warnings } = this.validateConfig({
            clusterType: "REPLICASET",
            providerName: "AWS",
            instanceSize,
            computeAutoscalingEnabled: true,
            diskAutoscalingEnabled: true,
            replicationSpecsCount: 1,
            regionConfigsCount: 1,
            analyticsNodeCount: 0,
            readOnlyNodeCount: 0,
            backupEnabled,
        });

        if (errors.length > 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Cannot create cluster "${name}": configuration does not meet dev cluster requirements.\n${errors.map((e) => `- ${e}`).join("\n")}`,
                    },
                ],
                isError: true,
            };
        }

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
                                instanceSize,
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
            backupEnabled,
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
                    text: `Cluster "${name}" (${instanceSize}, AWS, single-region) has been created in region "${region}".`,
                },
                {
                    type: "text",
                    text: `Compute and disk autoscaling are enabled. Backups are ${backupEnabled ? "enabled" : "disabled"}.`,
                },
                ...warnings.map((w) => ({ type: "text" as const, text: `Warning: ${w}` })),
                { type: "text", text: `Double check your access lists to enable your current IP.` },
            ],
        };
    }
}
