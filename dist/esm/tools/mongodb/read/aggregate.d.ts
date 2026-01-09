import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MongoDBToolBase } from "../mongodbTool.js";
import type { ToolArgs, OperationType, ToolExecutionContext } from "../../tool.js";
import type { AutoEmbeddingsUsageMetadata, ConnectionMetadata } from "../../../telemetry/types.js";
export declare const getAggregateArgs: (vectorSearchEnabled: boolean) => {
    readonly pipeline: z.ZodArray<z.AnyZodObject | z.ZodUnion<[z.ZodObject<{
        $vectorSearch: z.ZodObject<{
            exact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            index: z.ZodString;
            path: z.ZodString;
            queryVector: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodNumber, "many">]>;
            numCandidates: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            filter: z.ZodOptional<z.AnyZodObject>;
            embeddingParameters: z.ZodOptional<z.ZodObject<{
                outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
                outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
            } & {
                model: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
            }, "strip", z.ZodTypeAny, {
                outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                outputDimension?: number | undefined;
            }, {
                outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
            }>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            exact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            index: z.ZodString;
            path: z.ZodString;
            queryVector: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodNumber, "many">]>;
            numCandidates: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            filter: z.ZodOptional<z.AnyZodObject>;
            embeddingParameters: z.ZodOptional<z.ZodObject<{
                outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
                outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
            } & {
                model: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
            }, "strip", z.ZodTypeAny, {
                outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                outputDimension?: number | undefined;
            }, {
                outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            exact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            index: z.ZodString;
            path: z.ZodString;
            queryVector: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodNumber, "many">]>;
            numCandidates: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            filter: z.ZodOptional<z.AnyZodObject>;
            embeddingParameters: z.ZodOptional<z.ZodObject<{
                outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
                outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
            } & {
                model: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
            }, "strip", z.ZodTypeAny, {
                outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                outputDimension?: number | undefined;
            }, {
                outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, "strip", z.ZodTypeAny, {
        $vectorSearch: {
            path: string;
            exact: boolean;
            index: string;
            queryVector: string | number[];
            limit: number;
            filter?: {
                [x: string]: any;
            } | undefined;
            numCandidates?: number | undefined;
            embeddingParameters?: {
                outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                outputDimension?: number | undefined;
            } | undefined;
        } & {
            [k: string]: unknown;
        };
    }, {
        $vectorSearch: {
            path: string;
            index: string;
            queryVector: string | number[];
            filter?: {
                [x: string]: any;
            } | undefined;
            exact?: boolean | undefined;
            numCandidates?: number | undefined;
            limit?: number | undefined;
            embeddingParameters?: {
                outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
            } | undefined;
        } & {
            [k: string]: unknown;
        };
    }>, z.AnyZodObject]>, "many">;
    readonly responseBytesLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
};
export declare class AggregateTool extends MongoDBToolBase {
    name: string;
    description: string;
    argsShape: {
        pipeline: z.ZodArray<z.AnyZodObject | z.ZodUnion<[z.ZodObject<{
            $vectorSearch: z.ZodObject<{
                exact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
                index: z.ZodString;
                path: z.ZodString;
                queryVector: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodNumber, "many">]>;
                numCandidates: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
                filter: z.ZodOptional<z.AnyZodObject>;
                embeddingParameters: z.ZodOptional<z.ZodObject<{
                    outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
                    outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
                } & {
                    model: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
                }, "strip", z.ZodTypeAny, {
                    outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                    model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                    outputDimension?: number | undefined;
                }, {
                    outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                    outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                    model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                exact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
                index: z.ZodString;
                path: z.ZodString;
                queryVector: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodNumber, "many">]>;
                numCandidates: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
                filter: z.ZodOptional<z.AnyZodObject>;
                embeddingParameters: z.ZodOptional<z.ZodObject<{
                    outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
                    outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
                } & {
                    model: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
                }, "strip", z.ZodTypeAny, {
                    outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                    model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                    outputDimension?: number | undefined;
                }, {
                    outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                    outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                    model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                exact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
                index: z.ZodString;
                path: z.ZodString;
                queryVector: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodNumber, "many">]>;
                numCandidates: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
                filter: z.ZodOptional<z.AnyZodObject>;
                embeddingParameters: z.ZodOptional<z.ZodObject<{
                    outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
                    outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
                } & {
                    model: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
                }, "strip", z.ZodTypeAny, {
                    outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                    model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                    outputDimension?: number | undefined;
                }, {
                    outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                    outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                    model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>;
        }, "strip", z.ZodTypeAny, {
            $vectorSearch: {
                path: string;
                exact: boolean;
                index: string;
                queryVector: string | number[];
                limit: number;
                filter?: {
                    [x: string]: any;
                } | undefined;
                numCandidates?: number | undefined;
                embeddingParameters?: {
                    outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
                    model: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3";
                    outputDimension?: number | undefined;
                } | undefined;
            } & {
                [k: string]: unknown;
            };
        }, {
            $vectorSearch: {
                path: string;
                index: string;
                queryVector: string | number[];
                filter?: {
                    [x: string]: any;
                } | undefined;
                exact?: boolean | undefined;
                numCandidates?: number | undefined;
                limit?: number | undefined;
                embeddingParameters?: {
                    outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
                    outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
                    model?: "voyage-3-large" | "voyage-3.5" | "voyage-3.5-lite" | "voyage-code-3" | undefined;
                } | undefined;
            } & {
                [k: string]: unknown;
            };
        }>, z.AnyZodObject]>, "many">;
        responseBytesLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        database: z.ZodString;
        collection: z.ZodString;
    };
    static operationType: OperationType;
    protected execute({ database, collection, pipeline, responseBytesLimit }: ToolArgs<typeof this.argsShape>, { signal }: ToolExecutionContext): Promise<CallToolResult>;
    private safeCloseCursor;
    private assertOnlyUsesPermittedStages;
    private countAggregationResultDocuments;
    private replaceRawValuesWithEmbeddingsIfNecessary;
    private isVectorSearchIndexUsed;
    private generateMessage;
    protected resolveTelemetryMetadata(args: ToolArgs<typeof this.argsShape>, { result }: {
        result: CallToolResult;
    }): ConnectionMetadata | AutoEmbeddingsUsageMetadata;
    private isSearchStage;
    private isWriteStage;
    private runWriteAggregation;
    private runReadAggregation;
}
//# sourceMappingURL=aggregate.d.ts.map