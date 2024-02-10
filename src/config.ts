import { 
    DatabaseConfig,
    QueryHolder
} from "./types"

export const config: DatabaseConfig = {
    DATABASE_HOST: "localhost",
    DATABASE_PORT: 3306,
    DATABASE_USERNAME: "root",
    DATABASE_PASSWORD: "",
    DATABASE_NAME: "my_sowon"
}

export const InitialQuery: QueryHolder = {
    table: null,
    select: '*',
    insert: [],
    update: [],
    delete: [],
    limit: 300,
    where: [],
    param: [],
}