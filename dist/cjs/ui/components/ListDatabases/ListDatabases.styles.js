"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmountTextStyles = exports.getContainerStyles = void 0;
const css_1 = require("@emotion/css");
const tokens_1 = require("@leafygreen-ui/tokens");
const lib_1 = require("@leafygreen-ui/lib");
const getContainerStyles = (darkMode) => (0, css_1.css) `
    background-color: ${tokens_1.color[darkMode ? lib_1.Theme.Dark : lib_1.Theme.Light][tokens_1.Property.Background][tokens_1.Variant.Primary][tokens_1.InteractionState.Default]};
    padding: ${tokens_1.spacing[200]}px;
`;
exports.getContainerStyles = getContainerStyles;
exports.AmountTextStyles = (0, css_1.css) `
    margin-bottom: ${tokens_1.spacing[400]}px;
`;
//# sourceMappingURL=ListDatabases.styles.js.map