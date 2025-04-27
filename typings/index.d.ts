interface DataSource {
    target?: string | null;
    table?: string;
    fetchAll: () => { ID: string; data: unknown }[];
}

declare const KynuxDB: {

    configureLanguage:(_language:"tr"|"en") => string;
    configureReadableFormat:(_readable:boolean) => boolean;
    configureAutoPrune:(_noBlankData:boolean) => boolean;
    configureAdapter:(_adapter:"jsondb"|"localstorage"|"mongo"|"yamldb", options?: object) => object | boolean;
    configureFolder:(_folderPath:string) => true;
    configureFileName:(_fileName:string) => true;

    set: (_key: string, value: unknown) => unknown;
    delete: (_key: string) => boolean;
    fetch: (_key: string) => unknown;
    has: (_key: string) => boolean;
    get: (_key: string) => unknown;
    push: (_key: string, value: unknown) => unknown[];
    unpush: (_key: string, value: unknown) => unknown[];
    add: (_key: string, value: number) => number;
    subtract: (_key: string, value: number) => number;
    setByPriority: (_key: string, value: unknown) => unknown;
    delByPriority: (_key: string, value: unknown) => unknown;
    all: () => Record<string, unknown>;
    deleteAll: () => boolean;
    importDataFrom: (_sourceDB: DataSource) => boolean;

}

export = KynuxDB;
