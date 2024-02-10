import { Database }  from "./database";
import { QueryHelper } from "./helper";
import { WhereSubQuery } from "./where_sub_query";

async function testSelect(): Promise<void> {
    const db = new Database();
    const query = await db.table('songs')
    // .select('*')
    .select('id', 'name as n', 'release_year year')
    // .where('id', 'in', [8, 9, 10])
    .where('id', '>=', 8)
    // .advancedWhere("AND",(query : WhereSubQuery) => {
    //     return query.where('id', '<', 5)
    //                 .where('release_year', '>=', 2015)
    // })
    // .orWhere('id', '>', 1)
    // .orWhere((query : WhereSubQuery) => {
    //     return query.where('id', '>', 5)
    // })
    .orderBy('id', 'DESC')
    .all()
    // .logQuery()
    .catch((err) => { 
        console.log(err)
        return null
    })
    console.log(query)
}

async function testCreate() : Promise<void> {
    const db = new Database();
    const query = await db.table('songs')
    .create({name: "mamang", release_year: "2026"})
    // .logQuery()
    .run()
    .catch((err) => { 
        console.log(err)
        return null
    })
    console.log(query)
}

async function testInsert() : Promise<void> {
    const db = new Database();
    const result = await db.table('songs')
    .insert(["name", "release_year"], [
            ["yayan", 2020],
            ["yapan", 2021],
            ["yasalam", 2022],
            ["yanto", 2023],
    ])
    // .run()
    .logQuery()
    console.log(result)
}

async function testUpdate() : Promise<void> {
    const db = new Database();
    const result = await db.table('songs')
    .update({"name" : "dancing", "release_year": 2021})
    .where('id', '=', 1)
    // .logQuery()
    .run()
    .catch((err) => { 
        console.log(err)
        return null
    })
    console.log(result)
}

async function testDelete() : Promise<void> {
    const db = new Database();
    const result = await db.table('songs')
    .delete({ softDelete: false })
    .where('id', '=', 1)
    // .logQuery()
    .run()
    .catch((err) => { 
        console.log(err)
        return null
    })
    console.log(result)
}

async function main(): Promise<void> {
    await testSelect()

    // await testCreate()

    // await testInsert()

    // await testUpdate()

    // await testDelete()
}

main()
