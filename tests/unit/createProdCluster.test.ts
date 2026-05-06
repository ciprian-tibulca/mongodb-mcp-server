import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { CreateProdClusterTool } from "../../src/tools/atlas/create/createProdCluster.js";
import type { ToolConstructorParams } from "../../src/tools/tool.js";
import type { Session } from "../../src/common/session.js";
import type { UserConfig } from "../../src/common/config/userConfig.js";
import type { Telemetry } from "../../src/telemetry/telemetry.js";
import type { Elicitation } from "../../src/elicitation.js";
import type { ApiClient } from "../../src/common/atlas/apiClient.js";
import { Keychain } from "../../src/common/keychain.js";
import { MockMetrics } from "./mocks/metrics.js";

function createMockApiClient(): ApiClient {
    return {
        getIpInfo: vi.fn().mockResolvedValue({ currentIpv4Address: "1.2.3.4" }),
        createAccessListEntry: vi.fn().mockResolvedValue({}),
        getGroup: vi.fn().mockResolvedValue({ id: "aaaaaaaaaaaaaaaaaaaaaaaa" }),
        createCluster: vi.fn().mockResolvedValue({}),
        updateCluster: vi.fn().mockResolvedValue({}),
        logger: { debug: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() },
    } as unknown as ApiClient;
}

function buildTool(apiClient: ApiClient): CreateProdClusterTool {
    const mockConfig = {
        apiClientId: "test-client-id",
        apiClientSecret: "test-client-secret",
        confirmationRequiredTools: [],
        previewFeatures: [],
        disabledTools: [],
        readOnly: false,
        transport: "stdio",
    } as unknown as UserConfig;

    const mockSession = {
        apiClient,
        logger: { info: vi.fn(), debug: vi.fn(), warning: vi.fn(), error: vi.fn() },
        keychain: new Keychain(),
    } as unknown as Session;

    const mockTelemetry: Telemetry = {
        isTelemetryEnabled: () => false,
        emitEvents: vi.fn(),
    } as unknown as Telemetry;

    const mockElicitation: Elicitation = {
        requestConfirmation: vi.fn().mockResolvedValue(true),
    } as unknown as Elicitation;

    const params: ToolConstructorParams = {
        name: CreateProdClusterTool.toolName,
        category: CreateProdClusterTool.category,
        operationType: CreateProdClusterTool.operationType,
        session: mockSession,
        config: mockConfig,
        telemetry: mockTelemetry,
        elicitation: mockElicitation,
        metrics: new MockMetrics(),
    };

    return new CreateProdClusterTool(params);
}

const VALID_SINGLE_REGION_ARGS = {
    projectId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    name: "my-prod-cluster",
    region: "US_EAST_1",
    instanceSize: "M30" as const,
    backupEnabled: true,
};

const VALID_MULTI_REGION_ARGS = {
    projectId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    name: "my-prod-cluster",
    instanceSize: "M30" as const,
    backupEnabled: true,
    regions: [
        { regionName: "US_EAST_1", electableNodeCount: 3 },
        { regionName: "US_WEST_2", electableNodeCount: 1 },
        { regionName: "EU_WEST_1", electableNodeCount: 1 },
    ],
};

const EXEC_CONTEXT = { signal: new AbortController().signal };

function extractText(result: Awaited<ReturnType<CreateProdClusterTool["invoke"]>>): string {
    return result.content.map((c) => ("text" in c ? c.text : "")).join("\n");
}

describe("CreateProdClusterTool", () => {
    let apiClient: ReturnType<typeof createMockApiClient>;
    let tool: CreateProdClusterTool;

    beforeEach(() => {
        apiClient = createMockApiClient();
        tool = buildTool(apiClient);
    });

    // ─── Single-region flow ───────────────────────────────────────────────────

    describe("single-region flow", () => {
        describe("hard requirements", () => {
            it("succeeds with valid args and no warnings", async () => {
                const result = await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                expect(result.isError).toBeFalsy();
                const text = extractText(result);
                expect(text).toContain("has been created");
                expect(text).toContain("M30");
                expect(text).not.toContain("Warning:");
            });

            it("rejects region other than US_EAST_1", async () => {
                const result = await tool.invoke(
                    { ...VALID_SINGLE_REGION_ARGS, region: "EU_WEST_1" },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("US_EAST_1");
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });

            it("rejects backupEnabled=false", async () => {
                const result = await tool.invoke(
                    { ...VALID_SINGLE_REGION_ARGS, backupEnabled: false },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("backup_enabled must be true");
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });

            it("passes clusterType=REPLICASET, 1 replicationSpec, 1 regionConfig with providerName=AWS to the API", async () => {
                await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
                expect(body.clusterType).toBe("REPLICASET");
                expect(body.replicationSpecs).toHaveLength(1);

                const regionConfigs = body.replicationSpecs[0].regionConfigs;
                expect(regionConfigs).toHaveLength(1);
                expect(regionConfigs[0].providerName).toBe("AWS");
                expect(regionConfigs[0].regionName).toBe("US_EAST_1");
            });

            it("does not include analytics or read-only specs in the API body", async () => {
                await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                const regionConfig =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs[0];
                expect(regionConfig.analyticsSpecs).toBeUndefined();
                expect(regionConfig.readOnlySpecs).toBeUndefined();
            });

            it("enables compute and disk autoscaling (M30–M80)", async () => {
                await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                const autoScaling =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs[0].autoScaling;
                expect(autoScaling.compute.enabled).toBe(true);
                expect(autoScaling.diskGB.enabled).toBe(true);
                expect(autoScaling.compute.minInstanceSize).toBe("M30");
                expect(autoScaling.compute.maxInstanceSize).toBe("M80");
            });

            it("sets backupEnabled=true and terminationProtectionEnabled=true", async () => {
                await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
                expect(body.backupEnabled).toBe(true);
                expect(body.terminationProtectionEnabled).toBe(true);
            });

            it("passes the correct instanceSize to the API", async () => {
                await tool.invoke({ ...VALID_SINGLE_REGION_ARGS, instanceSize: "M50" }, EXEC_CONTEXT);

                const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
                expect(body.replicationSpecs[0].regionConfigs[0].electableSpecs.instanceSize).toBe("M50");
            });

            it("pauses the cluster after creation", async () => {
                await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                expect(apiClient.updateCluster).toHaveBeenCalledOnce();
                const call = (apiClient.updateCluster as ReturnType<typeof vi.fn>).mock.calls[0][0];
                expect(call.params.path.groupId).toBe(VALID_SINGLE_REGION_ARGS.projectId);
                expect(call.params.path.clusterName).toBe(VALID_SINGLE_REGION_ARGS.name);
                expect(call.body).toEqual({ paused: true });
            });

            it("success response mentions cluster is paused", async () => {
                const result = await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);
                expect(extractText(result)).toContain("paused");
            });
        });

        describe("project existence check", () => {
            it("calls getGroup to verify the project exists before creating the cluster", async () => {
                await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                expect(apiClient.getGroup).toHaveBeenCalledOnce();
                const call = (apiClient.getGroup as ReturnType<typeof vi.fn>).mock.calls[0][0];
                expect(call.params.path.groupId).toBe(VALID_SINGLE_REGION_ARGS.projectId);
            });

            it("does not create the cluster if the project does not exist", async () => {
                (apiClient.getGroup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                    new Error("Project not found")
                );

                const result = await tool.invoke(VALID_SINGLE_REGION_ARGS, EXEC_CONTEXT);

                expect(result.isError).toBeTruthy();
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });
        });

        describe("defaults", () => {
            it("schema defaults instanceSize to M30, backupEnabled to true, and region to US_EAST_1", () => {
                const parsed = z.object(tool.argsShape).parse({
                    projectId: VALID_SINGLE_REGION_ARGS.projectId,
                    name: VALID_SINGLE_REGION_ARGS.name,
                });
                expect(parsed.instanceSize).toBe("M30");
                expect(parsed.backupEnabled).toBe(true);
                expect(parsed.region).toBe("US_EAST_1");
            });

            it("creates without warnings when called with schema defaults", async () => {
                const parsed = z.object(tool.argsShape).parse({
                    projectId: VALID_SINGLE_REGION_ARGS.projectId,
                    name: VALID_SINGLE_REGION_ARGS.name,
                });
                const result = await tool.invoke(parsed, EXEC_CONTEXT);

                expect(result.isError).toBeFalsy();
                expect(extractText(result)).not.toContain("Warning:");

                const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
                expect(body.replicationSpecs[0].regionConfigs[0].electableSpecs.instanceSize).toBe("M30");
                expect(body.backupEnabled).toBe(true);
            });
        });
    });

    // ─── Multi-region flow ────────────────────────────────────────────────────

    describe("multi-region flow", () => {
        describe("hard requirements", () => {
            it("succeeds with valid args and no warnings", async () => {
                const result = await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                expect(result.isError).toBeFalsy();
                const text = extractText(result);
                expect(text).toContain("has been created");
                expect(text).toContain("3 regions");
                expect(text).not.toContain("Warning:");
            });

            it("rejects when US_EAST_1 is not among the regions", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "EU_WEST_1", electableNodeCount: 3 },
                            { regionName: "US_WEST_2", electableNodeCount: 1 },
                            { regionName: "AP_SOUTHEAST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("US_EAST_1");
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });

            it("rejects duplicate region names", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 2 },
                            { regionName: "US_EAST_1", electableNodeCount: 2 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("duplicate region names");
            });

            it("rejects fewer than 3 regions with electable nodes", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 3 },
                            { regionName: "US_WEST_2", electableNodeCount: 0, analyticsNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 0, analyticsNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("regions must have electable nodes");
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });

            it("rejects fewer than 5 total electable nodes", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 1 },
                            { regionName: "US_WEST_2", electableNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("total electable nodes");
            });

            it("rejects backupEnabled=false", async () => {
                const result = await tool.invoke(
                    { ...VALID_MULTI_REGION_ARGS, backupEnabled: false },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeTruthy();
                expect(extractText(result)).toContain("backup_enabled must be true");
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });

            it("passes clusterType=REPLICASET and AWS providerName to the API", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
                expect(body.clusterType).toBe("REPLICASET");
                for (const rc of body.replicationSpecs[0].regionConfigs) {
                    expect(rc.providerName).toBe("AWS");
                }
            });

            it("creates one regionConfig per region with correct electable node counts", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                const regionConfigs =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs;
                expect(regionConfigs).toHaveLength(3);
                expect(regionConfigs[0].regionName).toBe("US_EAST_1");
                expect(regionConfigs[0].electableSpecs.nodeCount).toBe(3);
                expect(regionConfigs[1].regionName).toBe("US_WEST_2");
                expect(regionConfigs[1].electableSpecs.nodeCount).toBe(1);
                expect(regionConfigs[2].regionName).toBe("EU_WEST_1");
                expect(regionConfigs[2].electableSpecs.nodeCount).toBe(1);
            });

            it("assigns descending priorities starting at 7 for the first region", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                const regionConfigs =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs;
                expect(regionConfigs[0].priority).toBe(7);
                expect(regionConfigs[1].priority).toBe(6);
                expect(regionConfigs[2].priority).toBe(5);
            });

            it("enables compute and disk autoscaling (M30–M80) in every region", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                const regionConfigs =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs;
                for (const rc of regionConfigs) {
                    expect(rc.autoScaling.compute.enabled).toBe(true);
                    expect(rc.autoScaling.diskGB.enabled).toBe(true);
                    expect(rc.autoScaling.compute.minInstanceSize).toBe("M30");
                    expect(rc.autoScaling.compute.maxInstanceSize).toBe("M80");
                }
            });

            it("sets backupEnabled=true and terminationProtectionEnabled=true", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
                expect(body.backupEnabled).toBe(true);
                expect(body.terminationProtectionEnabled).toBe(true);
            });

            it("pauses the cluster after creation", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                expect(apiClient.updateCluster).toHaveBeenCalledOnce();
                const call = (apiClient.updateCluster as ReturnType<typeof vi.fn>).mock.calls[0][0];
                expect(call.params.path.groupId).toBe(VALID_MULTI_REGION_ARGS.projectId);
                expect(call.params.path.clusterName).toBe(VALID_MULTI_REGION_ARGS.name);
                expect(call.body).toEqual({ paused: true });
            });

            it("accepts 4+ regions when all constraints are met", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 2 },
                            { regionName: "US_WEST_2", electableNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                            { regionName: "AP_SOUTHEAST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeFalsy();
                expect(extractText(result)).toContain("4 regions");
            });
        });

        describe("analytics and read-only nodes (warnings)", () => {
            it("warns when any region has analytics nodes but still creates the cluster", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 3, analyticsNodeCount: 2 },
                            { regionName: "US_WEST_2", electableNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeFalsy();
                const text = extractText(result);
                expect(text).toContain("Warning:");
                expect(text).toContain("Analytics nodes");
                expect(apiClient.createCluster).toHaveBeenCalledOnce();
            });

            it("warns when any region has read-only nodes but still creates the cluster", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 3 },
                            { regionName: "US_WEST_2", electableNodeCount: 1, readOnlyNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeFalsy();
                const text = extractText(result);
                expect(text).toContain("Warning:");
                expect(text).toContain("Read-only nodes");
                expect(apiClient.createCluster).toHaveBeenCalledOnce();
            });

            it("emits both warnings when analytics and read-only nodes are present", async () => {
                const result = await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 3, analyticsNodeCount: 1 },
                            { regionName: "US_WEST_2", electableNodeCount: 1, readOnlyNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                expect(result.isError).toBeFalsy();
                const warningCount = (extractText(result).match(/Warning:/g) ?? []).length;
                expect(warningCount).toBe(2);
            });

            it("includes analyticsSpecs in the API body when analytics nodes are set", async () => {
                await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 3, analyticsNodeCount: 2 },
                            { regionName: "US_WEST_2", electableNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                const regionConfigs =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs;
                expect(regionConfigs[0].analyticsSpecs.nodeCount).toBe(2);
                expect(regionConfigs[1].analyticsSpecs).toBeUndefined();
            });

            it("includes readOnlySpecs in the API body when read-only nodes are set", async () => {
                await tool.invoke(
                    {
                        ...VALID_MULTI_REGION_ARGS,
                        regions: [
                            { regionName: "US_EAST_1", electableNodeCount: 3 },
                            { regionName: "US_WEST_2", electableNodeCount: 1, readOnlyNodeCount: 1 },
                            { regionName: "EU_WEST_1", electableNodeCount: 1 },
                        ],
                    },
                    EXEC_CONTEXT
                );

                const regionConfigs =
                    (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body
                        .replicationSpecs[0].regionConfigs;
                expect(regionConfigs[1].readOnlySpecs.nodeCount).toBe(1);
                expect(regionConfigs[0].readOnlySpecs).toBeUndefined();
            });
        });

        describe("project existence check", () => {
            it("calls getGroup to verify the project exists before creating the cluster", async () => {
                await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                expect(apiClient.getGroup).toHaveBeenCalledOnce();
                const call = (apiClient.getGroup as ReturnType<typeof vi.fn>).mock.calls[0][0];
                expect(call.params.path.groupId).toBe(VALID_MULTI_REGION_ARGS.projectId);
            });

            it("does not create the cluster if the project does not exist", async () => {
                (apiClient.getGroup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                    new Error("Project not found")
                );

                const result = await tool.invoke(VALID_MULTI_REGION_ARGS, EXEC_CONTEXT);

                expect(result.isError).toBeTruthy();
                expect(apiClient.createCluster).not.toHaveBeenCalled();
            });
        });
    });

    // ─── Shared annotations ───────────────────────────────────────────────────

    describe("annotations", () => {
        it("includes cost and AWS signal in the title", () => {
            expect(tool.annotations.title).toContain("Paid");
            expect(tool.annotations.title).toContain("AWS");
        });

        it("is not read-only and not destructive", () => {
            expect(tool.annotations.readOnlyHint).toBe(false);
            expect(tool.annotations.destructiveHint).toBe(false);
        });
    });
});
