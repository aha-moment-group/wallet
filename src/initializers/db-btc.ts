import { getPg } from "../utils";

if (require.main === module) {
  (async () => {
    const pg = getPg();
    await pg.connect();
    await pg.query(`delete from kv_pairs where "key" = 'btcCursor'`);
    await pg.query(
      `insert into kv_pairs ("key", "value") values ('btcCursor', $1)`,
      [0]
    );
    await pg.end();
  })();
}
