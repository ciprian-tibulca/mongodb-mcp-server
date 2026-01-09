"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListDatabases = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const index_js_1 = require("../../hooks/index.js");
const table_1 = require("@leafygreen-ui/table");
const typography_1 = require("@leafygreen-ui/typography");
const ListDatabases_styles_js_1 = require("./ListDatabases.styles.js");
function formatBytes(bytes) {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
const ListDatabases = ({ databases: propDatabases, darkMode: darkModeProp, }) => {
    const darkMode = (0, index_js_1.useDarkMode)(darkModeProp);
    const { data: hookData, isLoading, error } = (0, index_js_1.useRenderData)();
    const databases = propDatabases ?? hookData?.databases;
    if (!propDatabases) {
        if (isLoading) {
            return (0, jsx_runtime_1.jsx)("div", { children: "Loading..." });
        }
        if (error) {
            return (0, jsx_runtime_1.jsxs)("div", { children: ["Error: ", error] });
        }
    }
    if (!databases) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, ListDatabases_styles_js_1.getContainerStyles)(darkMode), children: [(0, jsx_runtime_1.jsxs)(typography_1.Body, { className: ListDatabases_styles_js_1.AmountTextStyles, darkMode: darkMode, children: ["Your cluster has ", (0, jsx_runtime_1.jsxs)("strong", { children: [databases.length, " databases"] }), ":"] }), (0, jsx_runtime_1.jsxs)(table_1.Table, { darkMode: darkMode, children: [(0, jsx_runtime_1.jsx)(table_1.TableHead, { children: (0, jsx_runtime_1.jsxs)(table_1.HeaderRow, { children: [(0, jsx_runtime_1.jsx)(table_1.HeaderCell, { children: "Database" }), (0, jsx_runtime_1.jsx)(table_1.HeaderCell, { children: "Size" })] }) }), (0, jsx_runtime_1.jsx)(table_1.TableBody, { children: databases.map((db) => ((0, jsx_runtime_1.jsxs)(table_1.Row, { children: [(0, jsx_runtime_1.jsx)(table_1.Cell, { children: db.name }), (0, jsx_runtime_1.jsx)(table_1.Cell, { children: formatBytes(db.size) })] }, db.name))) })] })] }));
};
exports.ListDatabases = ListDatabases;
//# sourceMappingURL=ListDatabases.js.map