import { Database }  from "./database";
import { QueryHelper } from "./helper";
import { WHERE_SUB_QUERY } from "./where_sub_query";

async function testSelect(): Promise<void> {
    const db = new Database();
    const query = await db.table('songs')
    .select(' * ')
    .where('id', '>', 1)
    .orWhere('name', '!=', QueryHelper.toString('glass bead'))
    .advancedWhere("AND",(query : WHERE_SUB_QUERY) => {
        return query.where('id', '>', 0)
                    .where('release_year', '>=', 2015)
                    .orWhere('name', '!=', QueryHelper.toString('Not Exists'))
    })
    .where('release_year', '>=', 2017)
    .produce()
    .all()
    .catch((err) => { 
        console.log(err)
        return null
    })
    console.log(query)
}

async function testCreate() : Promise<void> {
    const db = new Database();
    const query = await db.table('songs')
    .create({name: "ayee", release_year: "2026"})
    .logQuery()
    console.log(query)
}

async function main(): Promise<void> {
    // await testSelect()
    await testCreate()
}
main()
