import z from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { OperationType, ToolArgs } from "../../tool.js";
import { MongoDBToolBase } from "../mongodbTool.js";
export declare class ExportTool extends MongoDBToolBase {
    name: string;
    description: string;
    argsShape: {
        exportTitle: z.ZodString;
        exportTarget: z.ZodArray<z.ZodDiscriminatedUnion<"name", [z.ZodObject<{
            name: z.ZodLiteral<"find">;
            arguments: z.ZodObject<{
                limit: z.ZodOptional<z.ZodNumber>;
                filter: z.ZodOptional<z.AnyZodObject>;
                projection: z.ZodOptional<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>>;
                sort: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodType<import("mongodb").SortDirection, z.ZodTypeDef, import("mongodb").SortDirection>, {}, {}>>;
                responseBytesLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                responseBytesLimit: number;
                sort?: {} | undefined;
                filter?: {
                    [x: string]: any;
                } | undefined;
                limit?: number | undefined;
                projection?: z.objectOutputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
            }, {
                sort?: {} | undefined;
                filter?: {
                    [x: string]: any;
                } | undefined;
                limit?: number | undefined;
                responseBytesLimit?: number | undefined;
                projection?: z.objectInputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            name: "find";
            arguments: {
                responseBytesLimit: number;
                sort?: {} | undefined;
                filter?: {
                    [x: string]: any;
                } | undefined;
                limit?: number | undefined;
                projection?: z.objectOutputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
            };
        }, {
            name: "find";
            arguments: {
                sort?: {} | undefined;
                filter?: {
                    [x: string]: any;
                } | undefined;
                limit?: number | undefined;
                responseBytesLimit?: number | undefined;
                projection?: z.objectInputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
            };
        }>, z.ZodObject<{
            name: z.ZodLiteral<"aggregate">;
            arguments: z.ZodObject<{
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
            }, "strip", z.ZodTypeAny, {
                responseBytesLimit: number;
                pipeline: ({
                    [x: string]: any;
                } | {
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
                })[];
            }, {
                pipeline: ({
                    [x: string]: any;
                } | {
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
                })[];
                responseBytesLimit?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            name: "aggregate";
            arguments: {
                responseBytesLimit: number;
                pipeline: ({
                    [x: string]: any;
                } | {
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
                })[];
            };
        }, {
            name: "aggregate";
            arguments: {
                pipeline: ({
                    [x: string]: any;
                } | {
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
                })[];
                responseBytesLimit?: number | undefined;
            };
        }>]>, "many">;
        jsonExportFormat: z.ZodDefault<z.ZodEnum<["relaxed", "canonical"]>>;
        database: z.ZodString;
        collection: z.ZodString;
    };
    static operationType: OperationType;
    protected execute({ database, collection, jsonExportFormat, exportTitle, exportTarget: target, }: ToolArgs<typeof this.argsShape>): Promise<CallToolResult>;
    private isServerRunningLocally;
}
//# sourceMappingURL=export.d.ts.map