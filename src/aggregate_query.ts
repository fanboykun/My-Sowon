import { Queries, QueryHelper } from "./helper"
import { AggregateQueryPropertyType } from "./types"

/** COUNT Aggregate */
export const COUNT = ( { column, alias }: { column?:string|Queries, alias?:string } ): Queries => {
    const param: AggregateQueryPropertyType = {}
    let initialCount:string = ''
    let shouldBacktip = true
    if(column instanceof Queries) {
        column = column.transform()
        shouldBacktip = false
    }
    if(column == null || column.includes('*')) {
        initialCount = `COUNT(*)`
    }else {
        const backtipped = shouldBacktip ? QueryHelper.backTipping(column) : column
        initialCount = `COUNT(${backtipped})` 
    }
    if(alias != null) {
        const backtippedAlias = QueryHelper.backTipping(alias)
        initialCount += ` AS ${backtippedAlias}`
    }
    param.__count = initialCount
    return new Queries(param)
}

/** SUM Aggregate */
export const SUM = ( { column, alias }: { column:string, alias?:string } ): Queries => {
    const param: AggregateQueryPropertyType = {}
    let initialSum:string = ''
    const backtipped = QueryHelper.backTipping(column)
    initialSum = `SUM(${backtipped})` 
    if(alias != null) {
        const backtippedAlias = QueryHelper.backTipping(alias)
        initialSum += ` AS ${backtippedAlias}`
    }
    param.__sum = initialSum
    return new Queries(param)
}

/** AVG Aggreagate */
export const AVG = ( { column, alias }: { column:string, alias?:string } ): Queries => {
    const param: AggregateQueryPropertyType = {}
    let initialAvg:string = ''
    const backtipped = QueryHelper.backTipping(column)
    initialAvg = `AVG(${backtipped})` 
    if(alias != null) {
        const backtippedAlias = QueryHelper.backTipping(alias)
        initialAvg += ` AS ${backtippedAlias}`
    }
    param.__sum = initialAvg
    return new Queries(param)
}

/** MIN Aggreagate */
export const MIN = ( { column, alias }: { column:string, alias?:string } ): Queries => {
    const param: AggregateQueryPropertyType = {}
    let initialMin:string = ''
    const backtipped = QueryHelper.backTipping(column)
    initialMin = `MIN(${backtipped})` 
    if(alias != null) {
        const backtippedAlias = QueryHelper.backTipping(alias)
        initialMin += ` AS ${backtippedAlias}`
    }
    param.__sum = initialMin
    return new Queries(param)
}

/** MAX Aggreagate */
export const MAX = ( { column, alias }: { column:string, alias?:string } ): Queries => {
    const param: AggregateQueryPropertyType = {}
    let initialMax:string = ''
    const backtipped = QueryHelper.backTipping(column)
    initialMax = `MAX(${backtipped})` 
    if(alias != null) {
        const backtippedAlias = QueryHelper.backTipping(alias)
        initialMax += ` AS ${backtippedAlias}`
    }
    param.__sum = initialMax
    return new Queries(param)
}

/** DISTINCT Aggreagate WITH OUT SELECT STATEMENT, eg: COUNT(DISTINCT song_name) */
export const DISTINCT = ( { column, alias }: { column:string, alias?:string } ): Queries  => {
    const param: AggregateQueryPropertyType = {}
    let intial:string = ''
    const backtipped = QueryHelper.backTipping(column)
    intial = `DISTINCT ${backtipped}` 
    if(alias != null) {
        const backtippedAlias = QueryHelper.backTipping(alias)
        intial += ` AS ${backtippedAlias}`
    }
    param.__distinct = intial
    return new Queries(param)
}