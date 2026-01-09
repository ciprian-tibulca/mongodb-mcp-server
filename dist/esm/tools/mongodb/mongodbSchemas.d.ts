import z from "zod";
export declare const zVoyageModels: z.ZodDefault<z.ZodEnum<["voyage-3-large", "voyage-3.5", "voyage-3.5-lite", "voyage-code-3"]>>;
export declare const zVoyageEmbeddingParameters: z.ZodObject<{
    outputDimension: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"256">, z.ZodLiteral<"512">, z.ZodLiteral<"1024">, z.ZodLiteral<"2048">, z.ZodLiteral<"4096">]>>, number, "256" | "512" | "1024" | "2048" | "4096" | undefined>>;
    outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
}, "strip", z.ZodTypeAny, {
    outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
    outputDimension?: number | undefined;
}, {
    outputDimension?: "256" | "512" | "1024" | "2048" | "4096" | undefined;
    outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
}>;
export declare const zVoyageAPIParameters: z.ZodObject<{
    outputDtype: z.ZodDefault<z.ZodOptional<z.ZodEnum<["float", "int8", "uint8", "binary", "ubinary"]>>>;
} & {
    outputDimension: z.ZodOptional<z.ZodDefault<z.ZodUnion<[z.ZodLiteral<256>, z.ZodLiteral<512>, z.ZodLiteral<1024>, z.ZodLiteral<2048>, z.ZodLiteral<4096>]>>>;
    inputType: z.ZodEnum<["query", "document"]>;
}, "strip", z.ZodTypeAny, {
    outputDtype: "binary" | "float" | "int8" | "uint8" | "ubinary";
    inputType: "query" | "document";
    outputDimension?: 1024 | 256 | 512 | 2048 | 4096 | undefined;
}, {
    inputType: "query" | "document";
    outputDimension?: 1024 | 256 | 512 | 2048 | 4096 | undefined;
    outputDtype?: "binary" | "float" | "int8" | "uint8" | "ubinary" | undefined;
}>;
export type VoyageModels = z.infer<typeof zVoyageModels>;
export type VoyageEmbeddingParameters = z.infer<typeof zVoyageEmbeddingParameters> & EmbeddingParameters;
export type EmbeddingParameters = {
    inputType: "query" | "document";
};
export declare const zSupportedEmbeddingParameters: z.ZodObject<{
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
}>;
export type SupportedEmbeddingParameters = z.infer<typeof zSupportedEmbeddingParameters>;
export declare const AnyAggregateStage: z.AnyZodObject;
export declare const VectorSearchStage: z.ZodObject<{
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
}>;
//# sourceMappingURL=mongodbSchemas.d.ts.map