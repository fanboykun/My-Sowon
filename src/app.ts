import { Database }  from "./database";
import { AggregateQuery } from "./helper";
import { SubQueryInterface } from "./sub_query";

async function testSelect(): Promise<void> {
    const db = new Database();

    const selectAll = async () => {
        return db.table('songs')
        .select('*')
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectAliases = async () => {
        return db.table('songs')
        .select('id', 'song_name as n', 'release_year year')
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectWhere = async () => {
        return db.table('songs')
        .select('id', 'song_name as n', 'release_year year')
        .where('id', '=', 8)
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectWhereIn = async () => {
        return db.table('songs')
        .select('id', 'song_name as n', 'release_year year')
        .where('id', 'in', [20, 21, null, ''])
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectWhereLike = async (value:unknown) => {
        return db.table('songs')
        .select('id', 'song_name as n', 'release_year year')
        .where('song_name', 'like', `%${value}%`)
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectOrWhere = async () => {
        return db.table('songs')
        .select('id', 'song_name as n', 'release_year year')
        .where('id', '=', 8)
        .orWhere('id', '<=', 20)
        // .logQuery()
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectSubWhere = async () => {
        return db.table('songs')
        .select('*')
        .where('id', '>=', 10)
        .where((query: SubQueryInterface) => {
            return query.where('id', 'in', [20, 22, 25])
            .where('id', '>',17)
        })
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectOrderBy = async () => {
        return db.table('songs')
        .select('*')
        .orderBy('id', 'DESC')
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectLimit = async () => {
        return db.table('songs')
        .select('*')
        .get(5)
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectOffset = async () => {
        return db.table('songs')
        .select('*')
        .orderBy('release_year', "DESC")
        .limit(5, 10)
        .catch((err) => {
            console.log(err)
            return null
        })
    }
    const selectGroup = async () => {
        return db.table('songs')
        .select('release_year', 'song_name')
        // .where('album_id', '>', 0)
        .groupBy('release_year')
        // .logQuery()
        .all()
        // .limit(5, 10)
        .catch((err) => {
            console.log(err)
            return null
        })
    }

    const SelectSubQuery = async () => {
        try {
            return db.table('songs')
            .select( "song_name", [ (query: Database) => {
                return query.table('albums')
                .select('album_name')
                .where('id', '=', 31)
            }, "album_name" ])
            .all()
            .catch((err) => {
                console.log(err)
                return null
            })
        }catch(err) {
            console.log(err)
            return null
        }
    }
    const selectCount = async () => {
        return db.table('songs')
        .select(AggregateQuery.COUNT({ alias:'count' }))
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })    
    }
    const selectJoin = async() => {
        return db.table('songs')
        .select('songs.*', 'alb.album_name alb_name')
        .leftJoin( { table: 'albums', tableAlias: 'alb', foreignKey:'songs.album_id', localKey:'alb.id' } )
        .where('songs.album_id', '!=', '')
        .all()
        .catch((err) => {
            console.log(err)
            return null
        })    
    }

    const result = await SelectSubQuery()
    console.log(result)
}

async function testCreate() : Promise<void> {
    const db = new Database();
    const query = await db.table('songs')
    .create({song_name: "kingslayer", release_year: "2026"})
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
    .insert(["song_name", "release_year"], [
            ["yayan", 2020],
            ["yapan", 2021],
            ["yasalam", 2022],
            ["yanto", 2023],
    ])
    .run()
    .catch((err) => { 
        console.log(err)
        return null
    })
    // .logQuery()
    console.log(result)
}

async function testUpdate() : Promise<void> {
    const db = new Database();
    const result = await db.table('songs')
    .update({"song_name" : "dancing", "release_year": 2021})
    .where('id', '=', 33)
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
    .where('id', '=', 33)
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
