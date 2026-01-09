// Converts kebab-case to PascalCase: "list-databases" -> "ListDatabases"
function toPascalCase(kebabCase) {
    return kebabCase
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
}
/**
 * UI Registry that manages bundled UI HTML strings for tools.
 */
export class UIRegistry {
    constructor(options) {
        this.cache = new Map();
        this.customUIs = options?.customUIs;
    }
    /**
     * Gets the UI HTML string for a tool, or null if none exists.
     */
    async get(toolName) {
        if (this.customUIs) {
            const customUI = await this.customUIs(toolName);
            if (customUI !== null && customUI !== undefined) {
                return customUI;
            }
        }
        const cached = this.cache.get(toolName);
        if (cached !== undefined) {
            return cached;
        }
        try {
            const module = (await import(`../lib/tools/${toolName}.js`));
            const exportName = `${toPascalCase(toolName)}Html`;
            const html = module[exportName]; // HTML generated at build time
            if (html === undefined) {
                return null;
            }
            this.cache.set(toolName, html);
            return html;
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=registry.js.map