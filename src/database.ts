import mysql, { 
    Connection,
    Pool,
    RowDataPacket,
} from "mysql2"

import { 
    InitialQuery,
    config
}  from "./config"

import { 
    ConnectionType,
    DatabaseConfig,
    DatabaseConfiguration,
    DeleteOption,
    QueryHolder,
    QueryType,
    SelectParam
} from "./types"

import { 
    SubQuery
} from "./sub_query"

import { QueryBuilder } from "./helper"
import { ValidateQuery } from "./validations"

export class Database
{
    private connection:mysql.Connection | mysql.Pool | null = null
    private connectionType: "NORMAL" | "POOL" = "NORMAL"
    
    private database_name:string
    private database_host:string
    private database_username:string
    private database_password:string
    private database_port:number

    private QUERY:QueryHolder

    private QueryType : QueryType = "SELECT"
    private QueryValidator = new ValidateQuery()
    private QueryBuilder = new QueryBuilder()

    constructor( options : DatabaseConfig = config, connectionType : ConnectionType = "NORMAL", QueryValue : QueryHolder =  InitialQuery )
    {
        try {
            this.database_name = options.DATABASE_NAME
            this.database_host = options.DATABASE_HOST
            this.database_username = options.DATABASE_USERNAME
            this.database_password = options.DATABASE_PASSWORD
            this.database_port = options.DATABASE_PORT

            this.connectionType = connectionType

            if(connectionType === "NORMAL") {
                this.connection = this.connect()
            }else if(connectionType === "POOL") {
                this.connection = this.pool()
            }

            this.QUERY = QueryValue

        }catch(err) {
            // throw(err)
            throw("Could't Connect To Database")
        }
    }

    /** Create Normal Mysql.Connection Connection */
    private connect() : Connection {
        const conn = mysql.createConnection({
            host: this.database_host,
            user: this.database_username,
            password: this.database_password,
            port: this.database_port,
            database: this.database_name
        });
        // console.log("Connected to " + this.database_name);
        return conn
    }

    /** Create Mysql.Pool Connection */
    private pool() : Pool {
        const conn: Pool = mysql.createPool({
            host: this.database_host,
            user: this.database_username,
            password: this.database_password,
            port: this.database_port,
            database: this.database_name
        });
        // console.log("Connected to " + this.database_name);
        return conn
    }

    /** Generate statement based on QueryHolder value */
    private generateStatement(QUERY:QueryHolder, QueryType: QueryType = this.QueryType): string {
        // begin generating query
        let statement = ''
        if(QueryType === "SELECT") {
            let strSelect = '*'
            if(QUERY.select == '*' || QUERY.select == ' * ') {
                statement += 'SELECT ' + strSelect // apply column select
                statement += ` FROM \`${QUERY.table}\`` // apply table select
            }else {
                const selectField = [...QUERY.select]
                selectField.map((col : string|Array<string>, index) => {
                    
                    let hasModified = false
                    let generatedSelect = ''
                    
                    if(typeof col != 'string' && col.length != 0) {
                        generatedSelect += '(' + col + ')'
                        hasModified = true
                    }
                    if(typeof col == 'string' && col.includes('.')){
                        const colSplit = col.split('.')
                        if(colSplit[1] == '*') {
                            generatedSelect = `\`${colSplit[0]}\`.`
                            generatedSelect += '*'
                        }else {
                            generatedSelect = `\`${colSplit[0]}\`.\`${colSplit[1]}\``
                        }
                        hasModified = true
                    }

                    if(typeof col == 'string' && col.toUpperCase().includes(' AS ')){
                        const colSplit = col.includes(' AS ') ? col.split(' AS ') : col.split(' as ') 
                        if(hasModified) {
                            generatedSelect = `${colSplit[0]} AS \`${colSplit[1]}\``
                        }else {
                            hasModified = true
                            generatedSelect = `\`${colSplit[0]}\` AS \`${colSplit[1]}\``
                        }
                    }else if(typeof col == 'string' && col.includes(' ')){
                        const colSplit = col.split(' ')
                        if(colSplit.length != 2) return

                        if(hasModified) {
                            generatedSelect = `${colSplit[0]} \`${colSplit[1]}\``
                        }else {
                            hasModified = true
                            generatedSelect = `\`${colSplit[0]}\` \`${colSplit[1]}\``
                        }
                    }

                    if(hasModified == false) {
                        generatedSelect += `\`${col}\``
                    }

                    index == 0 ? strSelect = generatedSelect : strSelect += ',' + generatedSelect // apply column select
                })

                statement += `SELECT ${strSelect}` // apply select statement
                statement += ` FROM \`${QUERY.table}\`` // apply table select
            }
        }

        if(QueryType === "SUBQUERY") {
            const selectField = [...QUERY.select]
            statement += selectField.map((v) => { return `\`${v}\`` })
            // apply where clause to the statement
            if(QUERY.where.length > 0) {
                statement += ` WHERE ${QUERY.where.join(' ')} ` // apply where
            }
            console.log(selectField)
        }

        if(QueryType === "CREATE") {
            let param_binder = '' 
            for(let i = 0; i < QUERY.insert.length; i++) {
                if(i == QUERY.insert.length - 1){
                    param_binder += '?'
                    break
                } else {
                    param_binder += '?,'
                }
            }
            statement = `INSERT INTO \`${QUERY.table}\` (${this.QUERY.insert.map(col => `\`${col}\``).join(', ')}) VALUES (${param_binder})` // apply insert
        }

        if(QueryType === "INSERT") {
            statement = `INSERT INTO ${QUERY.table} (${this.QUERY.insert.map(col => `\`${col}\``).join(', ')}) VALUES ?` // apply insert
        }

        if(QueryType === "UPDATE") {

            if(QUERY.where.length == 0) {
                throw("WHERE clause is required for UPDATE query")
            }

            statement = `UPDATE \`${QUERY.table}\` SET `  // apply update
            for(let i = 0; i < QUERY.update.length; i++) {
                if(QUERY.update.length == 1) {
                    statement += `\`${QUERY.update[i]}\` = ?`
                    break;
                }

                if(i === QUERY.update.length - 1) {
                    statement += `\`${QUERY.update[i]}\` = ?`
                }else {
                    statement += `\`${QUERY.update[i]}\` = ?,`
                }
            }
        }

        if(QueryType === "DELETE") {
            statement = `DELETE FROM \`${QUERY.table}\`` // apply insert
        }

        // apply where clause to the statement
        if(QUERY.where.length > 0 && QueryType !== "SUBQUERY") {
            statement += ` WHERE ${QUERY.where.join(' ')} ` // apply where
        }

        if(QueryType == "SELECT") {
            // check if the order value is not null
            if(QUERY.order != null) {
                statement += ` ORDER BY ${QUERY.order.toString()}`    // apply sorting
            }

            if( QUERY.limit != 0 && QUERY.limit != null ) {
                statement += ` LIMIT ${QUERY.limit.toString()}`    // apply limit
            }
            // check if the offset value is not null
            if(QUERY.offset != 0 && QUERY.offset != null) {
                statement += ` OFFSET ${QUERY.offset.toString()}`    // apply offset
            }
        }

        // console.log(`generated statement: ${statement}`)
        return statement
    }
    
    /** Execute Statement */
    private execute(statement:string, parameter:unknown = null) : Promise<RowDataPacket[]> {
        return new Promise((resolve, reject) => {
            try {
                this.connection?.query<RowDataPacket[]>(statement, parameter, (err, result) => {
                    if(err) {
                        reject(err)
                    }
                    resolve(result)
                }) 
            } catch (err) {
                throw(err)
            } finally {
                this.connection?.end()
                this.reset()
            }
        })
    }

    /** Directly pass your own query */
    query(statement:string, param:Array<any> = null ): Promise<RowDataPacket[]> {
        return this.execute(statement, param)
    }

    /** Get the mysql.Conenction Instance Manually write your own query */
    getConnection() : typeof this.connection {
        if(this.connection){
            return this.connection
        }else {
            this.connection = this.connect()
        }
    }

    /** Close Connection Manually */
    close() : void {
        this.connection?.end()
    }

    /** Reset the QueryHolder value */
    private reset() : void {
        this.QUERY = InitialQuery
    }

    /** Select the table to perform the query, must needed */
    table(table:string) : Database {
        if(this.QUERY.table != null) {
            throw("the selected table already filled")
        }

        this.QUERY.table =  table
        return this

    }

    /** Write SELECT statement, place '*' for selecting all column. Or don't use this method at all because the default select is ' * ' */
    select(...column : Array<string|Function>) : Database {
        const finalSelectColumn = new Array
        // Check if one of the argument is a function
        for(let i = 0; i < column.length; i++){
            const col = column[i]
            // console.log(typeof col)
            if (typeof col === 'function') {
                // If the last parameter is a function, remove it from the list
                const callback = col as Function;
    
                // new instance of SelectSubquery
                const selectSubQuery = new SubQuery(this.QUERY, true)
    
                // Execute the callback function, passing the database instance
                // const sub_query_callback = callback( this );
                const sub_query_callback = callback( selectSubQuery );
                const sub_queries = this.generateStatement(sub_query_callback.SUBQUERY, "SUBQUERY")
                finalSelectColumn.push([sub_queries])
            } else {
                // Process columns as usual
                const columns = column.filter(param => typeof param === 'string') as string[];
                finalSelectColumn.push(...columns)
            }
        }
        this.QUERY.select = finalSelectColumn
        // console.log(finalSelectColumn)
        this.QueryType = "SELECT"
        return this
    }

    /** Write Write Statement, if where clause if exists before, and AND equivalent statement before the clause */
    where( colum:string|Function, operator?: string, value?:string|number|Array<any>) : Database {
        if(typeof colum == 'function') {
            return this.advancedWhere(colum, "AND")
        }
        // check if the table is selected
        this.QueryValidator.validateTableSelected(this.QUERY.table)

        // check if the column is in the select
        this.QueryValidator.validateWhereColumnIsInSelect(colum, this.QUERY.select)

        const [whereStatement, parameter] = this.QueryBuilder.generateWhere(colum, operator, value, this.QUERY.where.length)
        this.QUERY.where.push(whereStatement)
        this.QUERY.param.push(parameter)
        
        return this
    }

    /** Write OR WHERE equivalent statement */
    orWhere( colum:string|Function, operator?: string, value?:string|number|Array<any>) : Database {
        // check is where is already filled
        if(this.QUERY.where.length < 1) {
            throw("Cannot use or where when no main where")
        }

        // check if column is function, if so, execute advanced where function with or operator.
        if(typeof colum == 'function') {
            return this.advancedWhere(colum, "OR")
        }

        // check if the table is selected
        this.QueryValidator.validateTableSelected(this.QUERY.table)

        // check if the column is in the select
        this.QueryValidator.validateWhereColumnIsInSelect(colum, this.QUERY.select)

        const [whereStatement, parameter] = this.QueryBuilder.generateOrWhere(colum, operator, value)
        this.QUERY.where.push(whereStatement)
        this.QUERY.param.push(parameter)

        return this
    }

    /** Wrice Multiple Nested Where Clause */
    private advancedWhere( callback: Function, clauseIntersecOperator: "AND"|"OR" = "AND" ) : Database {
        const toSubQuery: QueryHolder = {
            table: this.QUERY.table,
            select: this.QUERY.select,
            limit: this.QUERY.limit,
            param: this.QUERY.param,
            where: []
        }
        const advancedWhereStatement = callback(new SubQuery(toSubQuery))
        if(advancedWhereStatement.is_select == true) {
            return this
            // this.select(advancedWhereStatement.SUBQUERY.select)
        }
        if(this.QUERY.where.length >= 1) {
            this.QUERY.where.push(`${clauseIntersecOperator} ( ${advancedWhereStatement.SUBQUERY.where.join(' ')} )` )
        }else {
            this.QUERY.where.push(`( ${advancedWhereStatement.SUBQUERY.where.join(' ')} )`)
        }
        return this
    }

    /** Sort Method */
    orderBy(column:string, order: "ASC"|"DESC" = "ASC") : Database {
        if(this.QUERY.table == null) {
            throw("table is not selected")
        }

        if(this.QUERY.select != '*') {
            // check if the column is in the select
            if(!this.QUERY.select.includes(column)) {
                throw("column is not in the select statement")
            }
        }

        this.QUERY.order = `\`${column}\` ${order}`
        return this
    }

    /** Perform insert statement */
    create(data: { [key: string]: any } ) : Database {
        const columns = Object.keys(data)
        this.QueryType = "CREATE"
        for(let i = 0; i < columns.length; i++) {
            this.QUERY.insert.push(columns[i])
            this.QUERY.param.push(data[columns[i]])
        }
        return this
    }

    /** Perform Batch insert statement */
    insert(columns:Array<string>, values:Array<Array<unknown>>) : Database {
        this.QueryType = "INSERT"
        
        this.QUERY.insert.push(...columns)
        this.QUERY.param.push([...values])
        return this
    }

    /** Perform alter statement */
    update(data: { [key: string]: any } ) : Database {
        if(data.constructor !== Object) {
            throw("data must be an object")
        }
        const columns = Object.keys(data)
        this.QueryType = "UPDATE"
        for(let i = 0; i < columns.length; i++) {
            this.QUERY.update.push(columns[i])
            this.QUERY.param.push(data[columns[i]])
        }
        return this
    }

    /** Perform delete statement */
    delete(deleteOption: DeleteOption = { softDelete: false, softDeleteColumn: "deleted_at" }) : Database {
        this.QueryType = "DELETE"
        if(deleteOption.softDelete) {
            this.QUERY.update.push(deleteOption.softDeleteColumn)
            this.QUERY.param.push(new Date())
            this.QueryType = "UPDATE"
        }
        return this
    }

    /** execute the statement with default limit, default limit is 300 */
    async all() : Promise<RowDataPacket[]> {
        return new Promise((resolve, reject) => {
            if(this.QUERY.table == null) {
                reject("table is not selected")
            }
    
            const statement =  this.generateStatement(this.QUERY)
            const param = this.QUERY.param
            resolve(this.execute(statement, param))
        })
    }

    /** Execute the statement with limit */
    async get(limit:number): Promise<RowDataPacket[]> {
        return new Promise((resolve, reject) => {

            if(this.QUERY.table == null) {
                reject("table is not selected")
            }
    
            if( limit == 0 ) {
                reject("limit cannot be zero")
            }
    
            this.QUERY.limit = limit
    
            const statement =  this.generateStatement(this.QUERY)
            const param = this.QUERY.param
            resolve(this.execute(statement, param))
        })
    }

    /** Execute Delete, Update Query */
    async run(): Promise<RowDataPacket[]>{
        return new Promise((resolve, reject) => {
            const statement =  this.generateStatement(this.QUERY)
            const params = [...this.QUERY.param]
            const result = this.execute(statement, params) 

            if(!result) {
                reject("query failed")
            }
            resolve(result)
        })
    }

    async limit(limit:number, offset?: number): Promise<RowDataPacket[]> {
        return new Promise((resolve, reject) => {
            if(this.QUERY.table == null) {
                reject("table is not selected")
            }

            if( limit == 0 ) {
                reject("limit cannot be zero")
            }

            this.QUERY.limit = limit
            this.QUERY.offset = offset

            const statement =  this.generateStatement(this.QUERY)
            const param = this.QUERY.param
            resolve(this.execute(statement, param))
        })
    }

    /** produce the statement */
    produce() : Database {
        const statement =  this.generateStatement(this.QUERY)
        console.log(statement)
        return this
    }
    
    /** return the produced statement */
    logQuery(): string {
        const statement =  this.generateStatement(this.QUERY)
        return statement
    }

}