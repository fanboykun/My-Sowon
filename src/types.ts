import { Queries } from "./helper";
import { bitwiseOperator, operator } from "./validations";

export type DatabaseConfiguration = {
    options?: DatabaseConfig,
    connectionType?: "NORMAL"|"POOL",
    QueryValue : QueryHolder,
}
export interface QueryHolder {
    select?:Array<string|null>|string,
    table?: string;
    join?:JoinType
    where?:Array<string|null>,
    group?:Array<string|null>|string,
    order?:Array<string|null>|string,
    limit?:number,
    offset?:number,
    insert?:Array<string|null>,
    update?:Array<string|null>,
    delete?:Array<string|null>,
    param?:Array<any|null>,
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

export type SowonConfiguration = {
    options?: DatabaseConfig,
    connectionType? : ConnectionType
    QueryValue?: QueryHolder,
    shouldConnect?: boolean
}

export type AggregateQueryPropertyType = {
    __count?: string
    __sum?: string
    __avg?: string
    __min?: string
    __max?: string
    __distinct?:string
}

export type Operator = BasicOperator | BitwiseOperator
export type BasicOperator = typeof operator[number] | Uppercase<typeof operator[number]>
export type BitwiseOperator = typeof bitwiseOperator[number] | Uppercase<typeof bitwiseOperator[number]>

export type ConnectionType = "NORMAL" | "POOL"
export type QueryType = "SELECT" | "CREATE" | "INSERT" | "UPDATE" | "DELETE" | "SUBQUERY"
export type SelectType = string|Queries|Function|[Function, string]
export type JoinTypes = "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS" | "NATURAL"