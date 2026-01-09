/**
 * UI Registry that manages bundled UI HTML strings for tools.
 */
export declare class UIRegistry {
    private customUIs?;
    private cache;
    constructor(options?: {
        customUIs?: (toolName: string) => string | null | Promise<string | null>;
    });
    /**
     * Gets the UI HTML string for a tool, or null if none exists.
     */
    get(toolName: string): Promise<string | null>;
}
//# sourceMappingURL=registry.d.ts.map