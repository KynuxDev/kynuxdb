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

    set: (_key: string, value: unknown) => Promise<unknown>;
    delete: (_key: string) => Promise<boolean>;
    fetch: (_key: string) => Promise<unknown>;
    has: (_key: string) => Promise<boolean>;
    get: (_key: string) => Promise<unknown>;
    push: (_key: string, value: unknown) => Promise<unknown[]>;
    unpush: (_key: string, value: unknown) => Promise<unknown[] | undefined>;
    add: (_key: string, value: number) => Promise<number>;
    subtract: (_key: string, value: number) => Promise<number>;
    setByPriority: (_key: string, value: unknown) => Promise<unknown[] | boolean>;
    delByPriority: (_key: string, value: unknown) => Promise<unknown[] | boolean>;
    all: () => Promise<Record<string, unknown>>;
    deleteAll: () => Promise<boolean>;
    importDataFrom: (_sourceDB: DataSource) => Promise<boolean>;

}

export = KynuxDB;
