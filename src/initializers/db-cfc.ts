import { getPg } from "../utils";

if (require.main === module) {
  (async () => {
    const pg = getPg();
    await pg.connect();
    await pg.query(`delete from kv_pairs where "key" = 'CFCCursor'`);
    await pg.query(
      `insert into kv_pairs ("key", "value") values ('CFCCursor', $1)`,
      [5730500]
    );
    await pg.end();
  })();
}
