import type { Client } from "@mongodb-js/atlas-local";
export type AtlasLocalClientFactoryFn = () => Promise<Client | undefined>;
export declare const defaultCreateAtlasLocalClient: AtlasLocalClientFactoryFn;
//# sourceMappingURL=atlasLocal.d.ts.map