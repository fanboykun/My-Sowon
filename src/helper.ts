import { AggregateQueryPropertyType } from "./types";

export class QueryHelper
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

export class Queries
{
    constructor(private param:AggregateQueryPropertyType) {}

    transform(): string|null {
        const filtered = Object.fromEntries( Object.entries(this.param).filter(([_, value]) => value !== null) );
        const keys = Object.keys(filtered)
        if(keys.length == 1) return filtered[keys[0]]
        const transformedQueries: string[] = new Array
        for(let k in filtered) { transformedQueries.push(`(${filtered[k]})`) }
        return transformedQueries.length > 1 ? transformedQueries.join(', ') : transformedQueries.toString()
    }
}
