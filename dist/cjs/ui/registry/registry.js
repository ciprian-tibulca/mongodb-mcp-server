"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIRegistry = void 0;
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
class UIRegistry {
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
            const module = (await Promise.resolve(`${`../lib/tools/${toolName}.js`}`).then(s => __importStar(require(s))));
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
exports.UIRegistry = UIRegistry;
//# sourceMappingURL=registry.js.map