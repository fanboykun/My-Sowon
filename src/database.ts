import 
    mysql
,{ 
    Connection,
    Pool,
    RowDataPacket,
 }
from "mysql2"

import { 
    QUERY,
    config
} from "./config"

import { 
    QUERY_HOLDER
} from "./types"
import { WHERE_SUB_QUERY } from "./where_sub_query"

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

    private QUERY_TYPE : "SELECT" | "INSERT" | "UPDATE" | "DELETE" = "SELECT"

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

    private generateStatement(QUERY:QUERY_HOLDER): string {
        // begin generating query
        let statement = ''
        let parameter = ''

        if(this.QUERY_TYPE == "SELECT") {
            let strSelect = ' * '
            if(QUERY.select instanceof Array) {
                strSelect = QUERY.select.join(', ') 
            }

            statement += 'SELECT' + ' ' + strSelect // apply column select
            statement += ' ' + 'FROM' + ' ' + QUERY.table   // apply table
        }

        if(this.QUERY_TYPE == "INSERT") {
            let param_binder = '' 
            for(let i = 0; i < QUERY.insert.length; i++) {
                if(i == QUERY.insert.length - 1){
                    param_binder += '?'
                    break
                } else {
                    param_binder += '?,'
                }
            }
            statement = 'INSERT INTO' + ' ' + QUERY.table + ' ' + '(' + this.QUERY.insert.join(', ') + ')' + ' VALUES ' + '(' + param_binder + ')' // apply insert
        }

        if(QUERY.where.length > 0) {
            statement += ' ' + 'WHERE' + ' ' + QUERY.where.join(' ') // apply where
        }

        if(this.QUERY_TYPE == "SELECT") {
            statement += ' ' + 'LIMIT' + ' ' + QUERY.limit.toString()    // apply limit
        }
        // console.log(`generated statement: ${statement}`)
        return statement
    }

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

    private reset() {
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
        
        
        if( this.QUERY.select != ' * ' && this.QUERY.select.length > 1) {
            throw("the select statement already filled")
        }

        this.QUERY.select = column
        this.QUERY_TYPE = "SELECT"
        return this
    }

    /** Write Write Statement, if where clause if exists before, and AND equivalent statement before the clause */
    where( colum:string, operator: string, value:any) : Database {
        // check if the table is selected
        if(this.QUERY.table == null) {
            throw("table is not selected")
        }
        if(this.QUERY.select != ' * ') {
            // check if the column is in the select
            if(!this.QUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        // check is where is already filled
        if(this.QUERY.where.length >= 1) {
            this.QUERY.where.push('AND' + ' ' + colum + ' ' + operator + ' ' + value)
        }else {
            this.QUERY.where.push(colum + ' ' + operator + ' ' + value)
        }
        return this
    }

    /** Write OR WHERE equivalent statement */
    orWhere( colum:string, operator: string, value:any) : Database {
        // check if the table is selected
        if(this.QUERY.table == null) {
            throw("table is not selected")
        }
        if(this.QUERY.select != ' * ') {
            // check if the column is in the select
            if(!this.QUERY.select.includes(colum)) {
                throw("column is not in the select statement")
            }
        }
        // check is where is already filled
        if(this.QUERY.where.length < 1) {
            throw("Cannot use or where when no main where")
        }
        this.QUERY.where.push('OR' + ' ' + colum + ' ' + operator + ' ' + value)
        return this
    }

    /** Wrice Multiple Nested Where Clause */
    advancedWhere(  clauseIntersecOperator: "AND"|"OR" = "AND", callback: Function ) : Database {
        const toSubQuery: QUERY_HOLDER = {
            table: this.QUERY.table,
            select: this.QUERY.select,
            limit: this.QUERY.limit,
            where: []
        }
        const advancedWhereStatement = callback(new WHERE_SUB_QUERY(toSubQuery))
        // console.log('(' + advancedWhereStatement.SUBQUERY.where.join(' ') + ')')

        if(this.QUERY.where.length >= 1) {
            this.QUERY.where.push(clauseIntersecOperator + ' (' + advancedWhereStatement.SUBQUERY.where.join(' ') + ')')
        }else {
            this.QUERY.where.push('(' + advancedWhereStatement.SUBQUERY.where.join(' ') + ')')
        }
        return this
    }

    /** Perform insert statement */
    create(data: { [key: string]: string } ) : Database {
        const columns = Object.keys(data)
        this.QUERY_TYPE = "INSERT"
        for(let i = 0; i < columns.length; i++) {
            this.QUERY.insert.push(columns[i])
            this.QUERY.param.push(data[columns[i]])
        }
        return this
    }

    /** Perform insert statement, Batch Insert compatible */
    insert(columns:Array<string>, values:Array<any>[]) : Database {
        this.QUERY_TYPE = "INSERT"
        return this
    }

    /** Perform alter statement */
    update() : Database {
        this.QUERY_TYPE = "UPDATE"
        return this
    }

    /** Perform delete statement */
    delete() : Database {
        this.QUERY_TYPE = "DELETE"
        return this
    }

    /** execute the statement with default limit, default limit is 300 */
    async all() : Promise<RowDataPacket[]> {
        return new Promise((resolve, reject) => {
            if(this.QUERY.table == null) {
                reject("table is not selected")
            }
    
            const statement =  this.generateStatement(this.QUERY)
            resolve(this.execute(statement))
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
            resolve(this.execute(statement))
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