import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { CreateDevClusterTool } from "../../src/tools/atlas/create/createDevCluster.js";
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
        createCluster: vi.fn().mockResolvedValue({}),
        logger: {
            debug: vi.fn(),
            info: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
        },
    } as unknown as ApiClient;
}

function buildTool(apiClient: ApiClient): CreateDevClusterTool {
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
        logger: {
            info: vi.fn(),
            debug: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
        },
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
        name: CreateDevClusterTool.toolName,
        category: CreateDevClusterTool.category,
        operationType: CreateDevClusterTool.operationType,
        session: mockSession,
        config: mockConfig,
        telemetry: mockTelemetry,
        elicitation: mockElicitation,
        metrics: new MockMetrics(),
    };

    return new CreateDevClusterTool(params);
}

const BASE_ARGS = {
    projectId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    name: "my-dev-cluster",
    region: "US_EAST_1",
};

const EXEC_CONTEXT = { signal: new AbortController().signal };

function extractText(result: Awaited<ReturnType<CreateDevClusterTool["invoke"]>>): string {
    return result.content.map((c) => ("text" in c ? c.text : "")).join("\n");
}

describe("CreateDevClusterTool", () => {
    let apiClient: ReturnType<typeof createMockApiClient>;
    let tool: CreateDevClusterTool;

    beforeEach(() => {
        apiClient = createMockApiClient();
        tool = buildTool(apiClient);
    });

    describe("validation — hard requirements", () => {
        it("succeeds with M10 and no warnings", async () => {
            const result = await tool.invoke({ ...BASE_ARGS, instanceSize: "M10", backupEnabled: false }, EXEC_CONTEXT);

            expect(result.isError).toBeFalsy();
            const text = extractText(result);
            expect(text).toContain("has been created");
            expect(text).toContain("M10");
            expect(text).not.toContain("Warning:");
        });

        it("passes clusterType=REPLICASET, providerName=AWS, and autoscaling to the API", async () => {
            await tool.invoke({ ...BASE_ARGS, instanceSize: "M10", backupEnabled: false }, EXEC_CONTEXT);

            expect(apiClient.createCluster).toHaveBeenCalledOnce();
            const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;

            expect(body.clusterType).toBe("REPLICASET");
            expect(body.replicationSpecs).toHaveLength(1);

            const regionConfig = body.replicationSpecs[0].regionConfigs[0];
            expect(body.replicationSpecs[0].regionConfigs).toHaveLength(1);
            expect(regionConfig.providerName).toBe("AWS");
            expect(regionConfig.autoScaling.compute.enabled).toBe(true);
            expect(regionConfig.autoScaling.diskGB.enabled).toBe(true);
            expect(regionConfig.analyticsSpecs).toBeUndefined();
            expect(regionConfig.readOnlySpecs).toBeUndefined();
        });

        it("passes the correct instanceSize to the API", async () => {
            await tool.invoke({ ...BASE_ARGS, instanceSize: "M20", backupEnabled: false }, EXEC_CONTEXT);

            const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
            expect(body.replicationSpecs[0].regionConfigs[0].electableSpecs.instanceSize).toBe("M20");
        });

        it("passes backupEnabled to the API", async () => {
            await tool.invoke({ ...BASE_ARGS, instanceSize: "M10", backupEnabled: true }, EXEC_CONTEXT);

            const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
            expect(body.backupEnabled).toBe(true);
        });
    });

    describe("validation — warnings", () => {
        it("emits a warning when instanceSize is M20", async () => {
            const result = await tool.invoke({ ...BASE_ARGS, instanceSize: "M20", backupEnabled: false }, EXEC_CONTEXT);

            expect(result.isError).toBeFalsy();
            const text = extractText(result);
            expect(text).toContain("Warning:");
            expect(text).toContain("M10 is the recommended size");
        });

        it("emits a warning when backupEnabled is true", async () => {
            const result = await tool.invoke({ ...BASE_ARGS, instanceSize: "M10", backupEnabled: true }, EXEC_CONTEXT);

            expect(result.isError).toBeFalsy();
            const text = extractText(result);
            expect(text).toContain("Warning:");
            expect(text).toContain("backupEnabled is true");
        });

        it("emits both warnings when M20 and backupEnabled are set", async () => {
            const result = await tool.invoke({ ...BASE_ARGS, instanceSize: "M20", backupEnabled: true }, EXEC_CONTEXT);

            expect(result.isError).toBeFalsy();
            const text = extractText(result);
            const warningCount = (text.match(/Warning:/g) ?? []).length;
            expect(warningCount).toBe(2);
        });

        it("still creates the cluster when warnings are present", async () => {
            await tool.invoke({ ...BASE_ARGS, instanceSize: "M20", backupEnabled: true }, EXEC_CONTEXT);
            expect(apiClient.createCluster).toHaveBeenCalledOnce();
        });
    });

    describe("defaults", () => {
        it("schema defaults instanceSize to M10 and backupEnabled to false", () => {
            const parsed = z.object(tool.argsShape).parse({ ...BASE_ARGS });
            expect(parsed.instanceSize).toBe("M10");
            expect(parsed.backupEnabled).toBe(false);
        });

        it("creates without warnings when called with schema defaults", async () => {
            const parsed = z.object(tool.argsShape).parse({ ...BASE_ARGS });
            const result = await tool.invoke(parsed, EXEC_CONTEXT);

            expect(result.isError).toBeFalsy();
            const text = extractText(result);
            expect(text).toContain("M10");
            expect(text).toContain("disabled");
            expect(text).not.toContain("Warning:");

            const body = (apiClient.createCluster as ReturnType<typeof vi.fn>).mock.calls[0][0].body;
            expect(body.replicationSpecs[0].regionConfigs[0].electableSpecs.instanceSize).toBe("M10");
            expect(body.backupEnabled).toBe(false);
        });
    });

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
