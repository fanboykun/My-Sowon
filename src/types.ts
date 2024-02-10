export interface QUERY_HOLDER {
    table: string;
    select:Array<string|null>|string,
    order?:Array<string|null>|string,
    insert?:Array<string|null>,
    update?:Array<string|null>,
    delete?:Array<string|null>,
    limit?:number
    where?:Array<string|null>,
    param?:Array<any|null>,
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