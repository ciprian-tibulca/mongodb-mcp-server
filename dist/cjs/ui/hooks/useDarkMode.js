"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDarkMode = useDarkMode;
const react_1 = require("react");
function subscribeToPrefersColorScheme(callback) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
}
function getPrefersDarkMode() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function useDarkMode(override) {
    const prefersDarkMode = (0, react_1.useSyncExternalStore)(subscribeToPrefersColorScheme, getPrefersDarkMode);
    return override ?? prefersDarkMode;
}
//# sourceMappingURL=useDarkMode.js.map