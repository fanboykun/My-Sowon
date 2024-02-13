import { QueryBuilderHelperType } from "./types";

export class QueryBuilder
{
    /** Helper For backtipping your input */
    toString(value:unknown):string {
        return value ? `'${value}'` : '';
    }

    /**
     * generate value like: 
     * `songs`.`song_name`, 
     * `songs`.`song_name` AS `name`, 
     * `songs`.`song_name` as `name`,
     * `songs`.`song_name` `name`,
     * `song_name` AS `name`,
     * `song_name` as `name`,
     * `song_name` `name`
     * this method should only be used internally (private)
     */
    static backTipping(col:string) : string {
        let modifiedValue = ''
        let hasModified = false

        // check if has dot (.) separator, example input : songs.song_name
        if(col.includes('.')){
            const colSplit = col.split('.')
            if(colSplit[1] == '*') {
                modifiedValue = `\`${colSplit[0]}\`.`
                modifiedValue += '*'
            }else {
                modifiedValue = `\`${colSplit[0]}\`.\`${colSplit[1]}\``
            }
            hasModified = true
        }

        // check if has ' AS ' | ' as ' Keyword, example input song_name as name
        if(col.toUpperCase().includes(' AS ')){
            const colSplit = col.includes(' AS ') ? col.split(' AS ') : col.split(' as ') 
            if(hasModified) {
                // keep the first value| 0 index value, example input: songs.song_name AS name
                modifiedValue = `${colSplit[0]} AS \`${colSplit[1]}\``
            }else {
                // modify all value, example input: song_name AS name
                hasModified = true
                modifiedValue = `\`${colSplit[0]}\` AS \`${colSplit[1]}\``
            }
        }

        // same as ' AS '| ' as ', but use space keyword instead of AS|as Keyword, example input song_name name
        else if(col.includes(' ')){
            const colSplit = col.split(' ')
            if(colSplit.length != 2) return

            if(hasModified) {
                modifiedValue = `${colSplit[0]} \`${colSplit[1]}\``
            }else {
                hasModified = true
                modifiedValue = `\`${colSplit[0]}\` \`${colSplit[1]}\``
            }
        }

        // if the input is just regular value, example input: song_name
        if(hasModified == false) {
            modifiedValue += `\`${col}\``
        }

        return modifiedValue
    }

    /**
     * Generate Parameter Binding String for Prepared Statement, like ?, (?,?)
     * based on input length
     */
    static paramBinder(val: Array<string>):string{
        let param_binder = '' 
        for(let i = 0; i < val.length; i++) {
            if(i == val.length - 1){
                param_binder += '?'
                break
            } else {
                param_binder += '?,'
            }
        }
        return param_binder
    }

    /**
     * Generate Or Where Statement
     */
    static generateOrWhere(colum:string, operator: string, value:string|number|Array<any>) : [ string, any ] {
        let parameter: typeof value|Array<typeof value> = value
        if(value instanceof Array) {
            if(value.length == 0) {
                parameter = [['']]
            }else {
                parameter = [value]
            }
        }

        const backtippedColumn = this.backTipping(colum)
        let where = `OR ${backtippedColumn} ${operator} ?`
        return [where, parameter]
    }

    /**
     * Generate Or Where Statement
     */
    static generateWhere(colum:string, operator: string, value:string|number|Array<any>, existingWhereStatementLength:number) : [ string, any ] {
        let parameter: typeof value|Array<typeof value> = value
        if(value instanceof Array) {
            if(value.length == 0) {
                parameter = [['']]
            }else {
                parameter = [value]
            }
        }
        const backtippedColumn = this.backTipping(colum)
        // check is where is already filled
        if(existingWhereStatementLength >= 1) {
            let where = `AND ${backtippedColumn} ${operator} ?`
            return [where, parameter]
        }else {
            let where = `${backtippedColumn} ${operator} ?`
            return [where, parameter]
        }
    }

}

export class AggregateQuery
{
    static param: QueryBuilderHelperType

    static {
        this.param = {
            __count: null,
            __sum: null,
            __avg: null,
            __min: null,
            __max: null,
            __distinct: null,
        }
    }

    /** COUNT Aggregate */
    public static COUNT( { column, alias }: { column?:string|Queries, alias?:string } ): Queries {
        let initialCount:string = ''
        let shouldBacktip = true
        if(column instanceof Queries) {
            column = column.transform()
            shouldBacktip = false
        }
        if(column == null || column.includes('*')) {
            initialCount = `COUNT(*)`
        }else {
            const backtipped = shouldBacktip ? QueryBuilder.backTipping(column) : column
            initialCount = `COUNT(${backtipped})` 
        }
        if(alias != null) {
            const backtippedAlias = QueryBuilder.backTipping(alias)
            initialCount += ` AS ${backtippedAlias}`
        }
        this.param.__count = initialCount
        return new Queries(this.param)
    }

    /** SUM Aggregate */
    public static SUM( { column, alias }: { column:string, alias?:string } ): Queries {
        let initialSum:string = ''
        const backtipped = QueryBuilder.backTipping(column)
        initialSum = `SUM(${backtipped})` 
        if(alias != null) {
            const backtippedAlias = QueryBuilder.backTipping(alias)
            initialSum += ` AS ${backtippedAlias}`
        }
        this.param.__sum = initialSum
        return new Queries(this.param)
    }

    /** AVG Aggreagate */
    public static AVG( { column, alias }: { column:string, alias?:string } ): Queries {
        let initialAvg:string = ''
        const backtipped = QueryBuilder.backTipping(column)
        initialAvg = `AVG(${backtipped})` 
        if(alias != null) {
            const backtippedAlias = QueryBuilder.backTipping(alias)
            initialAvg += ` AS ${backtippedAlias}`
        }
        this.param.__sum = initialAvg
        return new Queries(this.param)
    }

    /** MIN Aggreagate */
    public static MIN( { column, alias }: { column:string, alias?:string } ): Queries {
        let initialMin:string = ''
        const backtipped = QueryBuilder.backTipping(column)
        initialMin = `MIN(${backtipped})` 
        if(alias != null) {
            const backtippedAlias = QueryBuilder.backTipping(alias)
            initialMin += ` AS ${backtippedAlias}`
        }
        this.param.__sum = initialMin
        return new Queries(this.param)
    }

    /** MAX Aggreagate */
    public static MAX( { column, alias }: { column:string, alias?:string } ): Queries {
        let initialMax:string = ''
        const backtipped = QueryBuilder.backTipping(column)
        initialMax = `MAX(${backtipped})` 
        if(alias != null) {
            const backtippedAlias = QueryBuilder.backTipping(alias)
            initialMax += ` AS ${backtippedAlias}`
        }
        this.param.__sum = initialMax
        return new Queries(this.param)
    }

    /** DISTINCT Aggreagate WITH OUT SELECT STATEMENT, eg: COUNT(DISTINCT song_name) */
    public static DISTINCT( { column, alias }: { column:string, alias?:string } ): Queries {
        let intial:string = ''
        const backtipped = QueryBuilder.backTipping(column)
        intial = `DISTINCT ${backtipped}` 
        if(alias != null) {
            const backtippedAlias = QueryBuilder.backTipping(alias)
            intial += ` AS ${backtippedAlias}`
        }
        this.param.__distinct = intial
        return new Queries(this.param)
    }

    public get param() {
        return this.param
    }
} 

export class Queries
{
    constructor(private param:QueryBuilderHelperType) {}

    transform(): string|null {
        const filtered = Object.fromEntries( Object.entries(this.param).filter(([_, value]) => value !== null) );
        const keys = Object.keys(filtered)
        if(keys.length == 1) return filtered[keys[0]]
        const transformedQueries: string[] = new Array
        for(let k in filtered) { transformedQueries.push(`(${filtered[k]})`) }
        return transformedQueries.length > 1 ? transformedQueries.join(', ') : transformedQueries.toString()
    }
}

/** All of the available clause operators. */
export const operator: string[] = [
    '=', '<', '>', '<=', '>=', '<>', '!=', '<=>',
    'like', 'like binary', 'not like', 'ilike',
    '&', '|', '^', '<<', '>>', '&~', 'is', 'is not',
    'rlike', 'not rlike', 'regexp', 'not regexp',
    '~', '~*', '!~', '!~*', 'similar to', 'in',
    'not in', 'not similar to', 'not ilike', '~~*',
    '!~~*'
] as const
export type BasicOperator = typeof operator[number] | Uppercase<typeof operator[number]>

/** All of the available bitwise operator */
export const bitwiseOperator : string[] = [ 
    '&', '|', '^', '<<', '>>', '&~'
 ] as const
export type BitwiseOperator = typeof bitwiseOperator[number] | Uppercase<typeof bitwiseOperator[number]>

export type Operator = BasicOperator | BitwiseOperator