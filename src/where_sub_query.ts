import { QUERY_HOLDER } from "./types"

export class WHERE_SUB_QUERY
{
    private SUBQUERY: QUERY_HOLDER

    constructor(subquery: QUERY_HOLDER) {
        this.SUBQUERY = subquery;
    }
    
    where( colum:string, operator: string, value:any) : WHERE_SUB_QUERY {
        // check if the table is selected
        if(this.SUBQUERY.table == null) {
            throw("table is not selected")
        }
        if(this.SUBQUERY.select != ' * ') {
            // check if the column is in the select
            if(!this.SUBQUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        // check is where is already filled
        if(this.SUBQUERY.where.length >= 1) {
            this.SUBQUERY.where.push('AND' + ' ' + colum + ' ' + operator + ' ' + value)
        }else {
            this.SUBQUERY.where.push(colum + ' ' + operator + ' ' + value)
        }
        return this
    }

    orWhere( colum:string, operator: string, value:any) : WHERE_SUB_QUERY {
        // check if the table is selected
        if(this.SUBQUERY.table == null) {
            throw("table is not selected")
        }
        if(this.SUBQUERY.select != ' * ') {
            // check if the column is in the select
            if(!this.SUBQUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        // check is where is already filled
        if(this.SUBQUERY.where.length < 1) {
            throw("Cannot use or where when no main where")
        }
        this.SUBQUERY.where.push('OR' + ' ' + colum + ' ' + operator + ' ' + value)
        return this
    }
}