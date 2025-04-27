interface DataSource {
    target?: string | null;
    table?: string;
    fetchAll: () => Array<{ ID: string; data: any }>;
}

declare const KynuxDB: {

    configureLanguage:(language:"tr"|"en") => string;
    configureReadableFormat:(readable:boolean) => boolean;
    configureAutoPrune:(noBlankData:boolean) => boolean;
    configureAdapter:(adapter:"jsondb"|"localstorage"|"mongo"|"yamldb", options?: object) => object | boolean; // Returns instance for mongo
    configureFolder:(folderPath:string) => true;
    configureFileName:(fileName:string) => true;

    set: (key: string, value: any) => any;
    delete: (key: string) => boolean; // Delete takes only key
    fetch: (key: string) => any;
    has: (key: string) => boolean;
    get: (key: string) => any;
    push: (key: string, value: any) => any[];
    unpush: (key: string, value: any) => any[];
    add: (key: string, value: number) => number;
    subtract: (key: string, value: number) => number;
    setByPriority: (key: string, value: any) => any;
    delByPriority: (key: string, value: any) => any;
    all: () => { [key: string]: any };
    deleteAll: () => boolean;
    importDataFrom: (sourceDB: DataSource) => boolean;

}

export = KynuxDB;
