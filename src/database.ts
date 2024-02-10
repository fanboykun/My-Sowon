import mysql, { 
    Connection,
    Pool,
    RowDataPacket,
} from "mysql2"

import { 
    QUERY,
    config
}  from "./config"

import { 
    DeleteOption,
    QUERY_HOLDER
} from "./types"

import { 
    WhereSubQuery
} from "./where_sub_query"

export class Database
{
    private connection:mysql.Connection | mysql.Pool | null = null
    private connectionType: "NORMAL" | "POOL" = "NORMAL"
    
    private database_name:string
    private database_host:string
    private database_username:string
    private database_password:string
    private database_port:number

    private QUERY:QUERY_HOLDER

    private QUERY_TYPE : "SELECT" | "CREATE" | "INSERT" | "UPDATE" | "DELETE" = "SELECT"

    constructor( connectionType: "NORMAL" | "POOL" = "NORMAL" ) {
        try {
            this.database_name = config.DATABASE_NAME
            this.database_host = config.DATABASE_HOST
            this.database_username = config.DATABASE_USERNAME
            this.database_password = config.DATABASE_PASSWORD
            this.database_port = config.DATABASE_PORT

            this.connectionType = connectionType

            if(connectionType === "NORMAL") {
                this.connection = this.connect()
            }else if(connectionType === "POOL") {
                this.connection = this.pool()
            }

            this.QUERY = QUERY

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

    /** Generate statement based on QUERY_HOLDER value */
    private generateStatement(QUERY:QUERY_HOLDER): string {
        // begin generating query
        let statement = ''

        if(this.QUERY_TYPE === "SELECT") {
            let strSelect = '*'
            if(QUERY.select == '*' || QUERY.select == ' * ') {
                statement += 'SELECT ' + strSelect // apply column select
                statement += ` FROM \`${QUERY.table}\`` // apply table select
            }else {
                const selectField = [...QUERY.select]
                selectField.map((col, index) => {
                    let hasModified = false
                    let generatedSelect = ''

                    if(col.includes('.')){
                        const colSplit = col.split('.')
                        if(colSplit[1] == '*') {
                            generatedSelect = `\`${colSplit[0]}\`.`
                            generatedSelect += '*'
                        }else {
                            generatedSelect = `\`${colSplit[0]}\`.\`${colSplit[1]}\``
                        }
                        hasModified = true
                    }

                    if(col.toUpperCase().includes(' AS ')){
                        const colSplit = col.includes(' AS ') ? col.split(' AS ') : col.split(' as ') 
                        if(hasModified) {
                            generatedSelect = `${colSplit[0]} AS \`${colSplit[1]}\``
                        }else {
                            hasModified = true
                            generatedSelect = `\`${colSplit[0]}\` AS \`${colSplit[1]}\``
                        }
                    }else if(col.includes(' ')){
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

        if(this.QUERY_TYPE === "CREATE") {
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

        if(this.QUERY_TYPE === "INSERT") {
            statement = `INSERT INTO ${QUERY.table} (${this.QUERY.insert.map(col => `\`${col}\``).join(', ')}) VALUES ?` // apply insert
        }

        if(this.QUERY_TYPE === "UPDATE") {

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

        if(this.QUERY_TYPE === "DELETE") {
            statement = `DELETE FROM \`${QUERY.table}\`` // apply insert
        }

        if(QUERY.where.length > 0) {
            statement += ` WHERE ${QUERY.where.join(' ')} ` // apply where
        }

        if(this.QUERY_TYPE == "SELECT") {
            // check if the order value is not null
            if(QUERY.order != null) {
                statement += ` ORDER BY ${QUERY.order.toString()}`    // apply sorting
            }

            statement += ` LIMIT ${QUERY.limit.toString()}`    // apply limit
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

    /** Reset the QUERY_HOLDER value */
    private reset() : void {
        this.QUERY = QUERY
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
    select(...column:Array<string>) : Database {
        if(this.QUERY.table == null) {
            throw("table is not selected")
        }

        if(column.length == 0) {
            throw("select statement is empty")
        }
        
        column.forEach(s => {
            if(s == null) {
                throw("select statement is empty")
            }
        })
        
        
        if( this.QUERY.select != '*' && this.QUERY.select.length > 1) {
            throw("the select statement already filled")
        }

        this.QUERY.select = column
        this.QUERY_TYPE = "SELECT"
        return this
    }

    /** Write Write Statement, if where clause if exists before, and AND equivalent statement before the clause */
    where( colum:string, operator: string, value:string|number|Array<unknown>) : Database {
        // check if the table is selected
        if(this.QUERY.table == null) {
            throw("table is not selected")
        }
        if(this.QUERY.select != '*') {
            // check if the column is in the select
            if(!this.QUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        let parameter = value
        if(value instanceof Array) {
            parameter = [value]
        }
        // check is where is already filled
        if(this.QUERY.where.length >= 1) {
            this.QUERY.where.push(`AND \`${colum}\` ${operator} ?`)
            this.QUERY.param.push(parameter)
        }else {
            this.QUERY.where.push(`\`${colum}\` ${operator} ?`)
            this.QUERY.param.push(parameter)
        }
        return this
    }

    /** Write OR WHERE equivalent statement */
    orWhere( colum:string|Function, operator?: string, value?:any) : Database {
        // check if the table is selected
        if(this.QUERY.table == null) {
            throw("table is not selected")
        }
        if( typeof colum == 'string' && this.QUERY.select != '*' ) {
            // check if the column is in the select
            if(!this.QUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }

        // check is where is already filled
        if(this.QUERY.where.length < 1) {
            throw("Cannot use or where when no main where")
        }

        if(typeof colum == 'function') {
            const toSubQuery: QUERY_HOLDER = {
                table: this.QUERY.table,
                select: this.QUERY.select,
                limit: this.QUERY.limit,
                param: this.QUERY.param,
                where: []
            }
            const advancedWhereStatement = colum(new WhereSubQuery(toSubQuery))
            if(typeof advancedWhereStatement == 'undefined') throw('no query given in callback!')
            this.QUERY.where.push(`OR ( ${advancedWhereStatement.SUBQUERY.where.join(' ')} )`)
            this.QUERY.param.push(value)
            return this
        }

        this.QUERY.where.push(`OR ${colum} ${operator} ?`)
        this.QUERY.param.push(value)
        return this
    }

    /** Wrice Multiple Nested Where Clause */
    advancedWhere(  clauseIntersecOperator: "AND"|"OR" = "AND", callback: Function ) : Database {
        const toSubQuery: QUERY_HOLDER = {
            table: this.QUERY.table,
            select: this.QUERY.select,
            limit: this.QUERY.limit,
            param: this.QUERY.param,
            where: []
        }
        const advancedWhereStatement = callback(new WhereSubQuery(toSubQuery))

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
        this.QUERY_TYPE = "CREATE"
        for(let i = 0; i < columns.length; i++) {
            this.QUERY.insert.push(columns[i])
            this.QUERY.param.push(data[columns[i]])
        }
        return this
    }

    /** Perform Batch insert statement */
    insert(columns:Array<string>, values:Array<Array<unknown>>) : Database {
        this.QUERY_TYPE = "INSERT"
        
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
        this.QUERY_TYPE = "UPDATE"
        for(let i = 0; i < columns.length; i++) {
            this.QUERY.update.push(columns[i])
            this.QUERY.param.push(data[columns[i]])
        }
        return this
    }

    /** Perform delete statement */
    delete(deleteOption: DeleteOption = { softDelete: false, softDeleteColumn: "deleted_at" }) : Database {
        this.QUERY_TYPE = "DELETE"
        if(deleteOption.softDelete) {
            this.QUERY.update.push(deleteOption.softDeleteColumn)
            this.QUERY.param.push(new Date())
            this.QUERY_TYPE = "UPDATE"
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