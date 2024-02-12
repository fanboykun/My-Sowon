export type DatabaseConfiguration = {
    options?: DatabaseConfig,
    connectionType?: "NORMAL"|"POOL",
    QueryValue : QueryHolder,
}
export interface QueryHolder {
    table: string;
    select:Array<string|null>|string,
    order?:Array<string|null>|string,
    group?:Array<string|null>|string,
    insert?:Array<string|null>,
    update?:Array<string|null>,
    delete?:Array<string|null>,
    limit?:number,
    offset?:number,
    where?:Array<string|null>,
    param?:Array<any|null>,
    join?:JoinType
}
type JoinType = {
    inner?:string|null
    left?:string|null
    right?:string|null
    full?:string|null
    cross?:string|null
    natural?:string|null
}

export type DatabaseConfig = {
    DATABASE_HOST: string
    DATABASE_PORT: number
    DATABASE_USERNAME: string
    DATABASE_PASSWORD?: string
    DATABASE_NAME: string
}

export type DeleteOption = {
    softDelete?: boolean
    softDeleteColumn?: string
}

export type QueryBuilderHelperType = {
    __count?: string
}

export type ConnectionType = "NORMAL" | "POOL"
export type QueryType = "SELECT" | "CREATE" | "INSERT" | "UPDATE" | "DELETE" | "SUBQUERY"
export type SelectParam = string[] | Function;
export type JoinTypes = "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS" | "NATURAL"