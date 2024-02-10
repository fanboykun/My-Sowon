import { QueryHolder } from "./types"

export class WhereSubQuery implements Where
{
    private SUBQUERY: QueryHolder

    constructor(subquery: QueryHolder) {
        this.SUBQUERY = subquery;
    }
    
    where( colum:string, operator: string, value:any) : WhereSubQuery {
        // check if the table is selected
        if(this.SUBQUERY.table == null) {
            throw("table is not selected")
        }
        if(this.SUBQUERY.select != '*') {
            // check if the column is in the select
            if( typeof this.SUBQUERY.select == 'object' && !this.SUBQUERY.select.join(', ').includes(colum) ) {
                throw("column is not in the select statement")
            }else if( typeof this.SUBQUERY.select == 'string' && !this.SUBQUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        let parameter: typeof value|Array<typeof value> = value
        if(value instanceof Array) {
            if(value.length == 0) {
                parameter = [['']]
            }else {
                parameter = [value]
            }
        }

        // check is where is already filled
        if(this.SUBQUERY.where.length >= 1) {
            this.SUBQUERY.where.push(`AND \`${colum}\` ${operator} ?`)
            this.SUBQUERY.param.push(parameter)
        }else {
            this.SUBQUERY.where.push(`\`${colum}\` ${operator} ?`)
            this.SUBQUERY.param.push(parameter)
        }
        return this
    }

    orWhere( colum:string, operator: string, value:any) : WhereSubQuery {
        // check if the table is selected
        if(this.SUBQUERY.table == null) {
            throw("table is not selected")
        }
        if(this.SUBQUERY.select != '*') {
            // check if the column is in the select
            if( typeof this.SUBQUERY.select == 'object' && !this.SUBQUERY.select.join(', ').includes(colum) ) {
                throw("column is not in the select statement")
            }else if( typeof this.SUBQUERY.select == 'string' && !this.SUBQUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        // check is where is already filled
        if(this.SUBQUERY.where.length < 1) {
            throw("Cannot use or where when no main where")
        }

        let parameter: typeof value|Array<typeof value> = value
        if(value instanceof Array) {
            if(value.length == 0) {
                parameter = [['']]
            }else {
                parameter = [value]
            }
        }

        this.SUBQUERY.where.push(`OR \`${colum}\` ${operator} ?`)
        this.SUBQUERY.param.push(parameter)

        return this
    }
}

export interface Where{
    where(colum:string, operator: string, value:any) : Where
    orWhere(colum:string, operator: string, value:any) : Where
}