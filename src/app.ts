import { Database }  from "./database";
import { WhereSubQuery } from "./sub_query";

async function testSelect(): Promise<void> {
    const db = new Database();
    const like = 'a'
    const query = await db.table('songs')
    // .select('*')
    .select('id', 'song_name as n', 'release_year year')
    // .where('song_name', 'IS', null)
    // .where('id', 'in', [8, 9, 10])
    // .where('id', 'in', [20, 21, null, ''])
    .where((query: WhereSubQuery) => {
        return query.where('id', 'in', [20, 22, 25])
        .where('song_name', 'like',`%${like}%`)
    })
    // .where('id', '=', 8)
    .orderBy('id', 'DESC')
    .all()
    .catch((err) => { 
        console.log(err)
        return null
    })
    // .logQuery()
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
