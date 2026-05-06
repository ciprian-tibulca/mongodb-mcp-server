import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { type ToolArgs, type OperationType } from "../../tool.js";
import { AtlasToolBase } from "../atlasTool.js";
import type { ClusterDescription20240805 } from "../../../common/atlas/openapi.js";
import { ensureCurrentIpInAccessList } from "../../../common/atlas/accessListUtils.js";
import { AtlasArgs } from "../../args.js";

const ALLOWED_INSTANCE_SIZES = ["M30", "M40", "M50", "M60", "M80"] as const;
type ProdInstanceSize = (typeof ALLOWED_INSTANCE_SIZES)[number];

const SINGLE_REGION_REQUIRED = "US_EAST_1";
const MULTI_REGION_PRIMARY = "US_EAST_1";
const MIN_ELECTABLE_REGIONS = 3;
const MIN_TOTAL_ELECTABLE_NODES = 5;

type RegionEntry = {
    regionName: string;
    electableNodeCount: number;
    analyticsNodeCount?: number;
    readOnlyNodeCount?: number;
};

type SingleRegionValidationParams = {
    instanceSize: string;
    region: string;
    backupEnabled: boolean;
    analyticsNodeCount: number;
    readOnlyNodeCount: number;
};

type MultiRegionValidationParams = {
    instanceSize: string;
    regions: RegionEntry[];
    backupEnabled: boolean;
};

export class CreateProdClusterTool extends AtlasToolBase {
    static toolName = "atlas-create-prod-cluster";
    public description =
        "Create a dedicated M30+ production MongoDB Atlas cluster on AWS. " +
        "Supports two topologies: single-region (omit `regions`) and multi-region (provide `regions` with 3+ AWS regions). " +
        "Single-region: US_EAST_1 only, backup required, no analytics/read-only nodes. " +
        "Multi-region: US_EAST_1 required as primary, ≥3 regions with electable nodes, ≥5 total electable nodes, backup required. " +
        "Compute and disk autoscaling enabled (M30–M80). Termination protection enabled. " +
        "Both flows verify the project exists and pause the cluster after creation. " +
        "AWS only. For development workloads, use `atlas-create-dev-cluster` (M10/M20).";
    static operationType: OperationType = "create";
    public argsShape = {
        projectId: AtlasArgs.projectId().describe("Atlas project ID to create the cluster in"),
        name: AtlasArgs.clusterName().describe("Name of the cluster"),
        instanceSize: z
            .enum(ALLOWED_INSTANCE_SIZES)
            .default("M30")
            .describe("Instance size for all regions. M30 is the minimum for production."),
        backupEnabled: z
            .boolean()
            .default(true)
            .describe("Enable cloud backups. Must be true for both topologies. Defaults to true."),
        region: AtlasArgs.region()
            .default(SINGLE_REGION_REQUIRED)
            .describe(
                `AWS region for single-region topology. Must be ${SINGLE_REGION_REQUIRED}. Ignored when \`regions\` is provided.`
            ),
        regions: z
            .array(
                z.object({
                    regionName: AtlasArgs.region().describe(
                        "AWS region name (e.g. US_EAST_1, EU_WEST_1). US_EAST_1 must be included."
                    ),
                    electableNodeCount: z
                        .number()
                        .int()
                        .min(0)
                        .describe(
                            "Electable nodes in this region. Use 0 only for analytics-only regions."
                        ),
                    analyticsNodeCount: z
                        .number()
                        .int()
                        .min(0)
                        .optional()
                        .describe("Analytics nodes in this region (optional, triggers a warning)."),
                    readOnlyNodeCount: z
                        .number()
                        .int()
                        .min(0)
                        .optional()
                        .describe("Read-only nodes in this region (optional, triggers a warning)."),
                })
            )
            .min(
                MIN_ELECTABLE_REGIONS,
                `At least ${MIN_ELECTABLE_REGIONS} regions are required for multi-region topology`
            )
            .optional()
            .describe(
                `Multi-region topology: AWS regions with node counts. ` +
                    `US_EAST_1 required. ≥${MIN_ELECTABLE_REGIONS} regions must have electable nodes. ` +
                    `≥${MIN_TOTAL_ELECTABLE_NODES} total electable nodes required. ` +
                    `When provided, takes precedence over \`region\`.`
            ),
    };

    public override get annotations(): ToolAnnotations {
        return {
            ...super.annotations,
            title: "Create Prod Cluster (AWS, Paid – paused after creation)",
        };
    }

    protected override getConfirmationMessage({
        projectId,
        name,
        instanceSize,
        region,
        regions,
    }: ToolArgs<typeof this.argsShape>): string {
        const topology = regions
            ? `across ${regions.length} regions: ${regions.map((r) => `${r.regionName} (${r.electableNodeCount} electable)`).join(", ")}`
            : `in region: ${region}`;
        return (
            `You are about to create a dedicated ${instanceSize} production cluster "${name}" in project "${projectId}" ${topology}. ` +
            `The cluster will be paused immediately after creation. It incurs ongoing AWS costs when resumed and may autoscale up to M80. Proceed?`
        );
    }

    private validateSingleRegion(params: SingleRegionValidationParams): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!ALLOWED_INSTANCE_SIZES.includes(params.instanceSize as ProdInstanceSize)) {
            errors.push(
                `instance_size must be one of ${ALLOWED_INSTANCE_SIZES.join(", ")}, got: ${params.instanceSize}`
            );
        }
        if (params.region !== SINGLE_REGION_REQUIRED) {
            errors.push(
                `region_name must be ${SINGLE_REGION_REQUIRED} for single-region prod cluster, got: ${params.region}`
            );
        }
        if (!params.backupEnabled) {
            errors.push("backup_enabled must be true for single-region prod clusters (daily snapshots required)");
        }
        if (params.analyticsNodeCount > 0) {
            errors.push(
                `analytics nodes are not permitted for a prod cluster, got: ${params.analyticsNodeCount}`
            );
        }
        if (params.readOnlyNodeCount > 0) {
            errors.push(
                `read-only nodes are not permitted for a prod cluster, got: ${params.readOnlyNodeCount}`
            );
        }

        return { errors, warnings };
    }

    private validateMultiRegion(params: MultiRegionValidationParams): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!ALLOWED_INSTANCE_SIZES.includes(params.instanceSize as ProdInstanceSize)) {
            errors.push(
                `instance_size must be one of ${ALLOWED_INSTANCE_SIZES.join(", ")}, got: ${params.instanceSize}`
            );
        }

        const hasUsEast1 = params.regions.some((r) => r.regionName === MULTI_REGION_PRIMARY);
        if (!hasUsEast1) {
            errors.push(`${MULTI_REGION_PRIMARY} must be included as the primary application region`);
        }

        const regionNames = params.regions.map((r) => r.regionName);
        if (new Set(regionNames).size !== regionNames.length) {
            errors.push("duplicate region names are not allowed");
        }

        const electableRegions = params.regions.filter((r) => r.electableNodeCount > 0);
        if (electableRegions.length < MIN_ELECTABLE_REGIONS) {
            errors.push(
                `at least ${MIN_ELECTABLE_REGIONS} regions must have electable nodes, got: ${electableRegions.length}`
            );
        }

        const totalElectable = params.regions.reduce((sum, r) => sum + r.electableNodeCount, 0);
        if (totalElectable < MIN_TOTAL_ELECTABLE_NODES) {
            errors.push(
                `total electable nodes must be at least ${MIN_TOTAL_ELECTABLE_NODES}, got: ${totalElectable}`
            );
        }

        if (!params.backupEnabled) {
            errors.push(
                "backup_enabled must be true for multi-region prod clusters (PITR audit requirement, zero data loss)"
            );
        }

        if (params.regions.some((r) => (r.analyticsNodeCount ?? 0) > 0)) {
            warnings.push(
                "Analytics nodes are configured but are not required for this workload."
            );
        }
        if (params.regions.some((r) => (r.readOnlyNodeCount ?? 0) > 0)) {
            warnings.push(
                "Read-only nodes are configured but are not required for this workload."
            );
        }

        return { errors, warnings };
    }

    protected async execute({
        projectId,
        name,
        instanceSize,
        backupEnabled,
        region,
        regions,
    }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult> {
        const isMultiRegion = regions !== undefined;

        const { errors, warnings } = isMultiRegion
            ? this.validateMultiRegion({ instanceSize, regions, backupEnabled })
            : this.validateSingleRegion({
                  instanceSize,
                  region,
                  backupEnabled,
                  analyticsNodeCount: 0,
                  readOnlyNodeCount: 0,
              });

        if (errors.length > 0) {
            return {
                content: [
                    {
                        type: "text",
                        text:
                            `Cannot create cluster "${name}": configuration does not meet prod cluster requirements.\n` +
                            errors.map((e) => `- ${e}`).join("\n"),
                    },
                ],
                isError: true,
            };
        }

        // Verify the project exists before creating the cluster.
        await this.apiClient.getGroup({
            params: { path: { groupId: projectId } },
        });

        const regionConfigs = isMultiRegion
            ? regions.map((r, index) => {
                  const analyticsCount = r.analyticsNodeCount ?? 0;
                  const readOnlyCount = r.readOnlyNodeCount ?? 0;
                  return {
                      providerName: "AWS",
                      regionName: r.regionName,
                      priority: Math.max(7 - index, 1),
                      electableSpecs: { instanceSize, nodeCount: r.electableNodeCount },
                      ...(analyticsCount > 0 && {
                          analyticsSpecs: { instanceSize, nodeCount: analyticsCount },
                      }),
                      ...(readOnlyCount > 0 && {
                          readOnlySpecs: { instanceSize, nodeCount: readOnlyCount },
                      }),
                      autoScaling: {
                          compute: {
                              enabled: true,
                              scaleDownEnabled: true,
                              minInstanceSize: "M30",
                              maxInstanceSize: "M80",
                          },
                          diskGB: { enabled: true },
                      },
                  };
              })
            : [
                  {
                      providerName: "AWS",
                      regionName: region,
                      priority: 7,
                      electableSpecs: { instanceSize, nodeCount: 3 },
                      autoScaling: {
                          compute: {
                              enabled: true,
                              scaleDownEnabled: true,
                              minInstanceSize: "M30",
                              maxInstanceSize: "M80",
                          },
                          diskGB: { enabled: true },
                      },
                  },
              ];

        const input = {
            clusterType: "REPLICASET",
            name,
            replicationSpecs: [{ zoneName: "Zone 1", regionConfigs }],
            backupEnabled,
            terminationProtectionEnabled: true,
        } as unknown as ClusterDescription20240805;

        await ensureCurrentIpInAccessList(this.apiClient, projectId);
        await this.apiClient.createCluster({
            params: { path: { groupId: projectId } },
            body: input,
        });

        let pauseNote: string;
        try {
            await this.apiClient.updateCluster({
                params: { path: { groupId: projectId, clusterName: name } },
                body: { paused: true },
            });
            pauseNote = "The cluster is paused. Resume it in the Atlas UI or via the API when ready to use.";
        } catch {
            pauseNote =
                "A pause request was issued but the cluster must reach IDLE state first. " +
                "Pause it via the Atlas UI or API once it is ready.";
        }

        const topologyLine = isMultiRegion
            ? `Cluster "${name}" (${instanceSize}, AWS, ${regions.length} regions) has been created across: ` +
              `${regions.map((r) => `${r.regionName} (${r.electableNodeCount} electable nodes)`).join(", ")}. ` +
              `Total electable nodes: ${regions.reduce((sum, r) => sum + r.electableNodeCount, 0)}.`
            : `Cluster "${name}" (${instanceSize}, AWS, single-region) has been created in region "${region}" and is now paused.`;

        return {
            content: [
                { type: "text", text: topologyLine },
                {
                    type: "text",
                    text: `Compute and disk autoscaling are enabled (M30–M80). Backups are enabled. Termination protection is enabled.`,
                },
                { type: "text", text: pauseNote },
                ...warnings.map((w) => ({ type: "text" as const, text: `Warning: ${w}` })),
                { type: "text", text: `Double check your access lists to enable your current IP.` },
            ],
        };
    }
}
