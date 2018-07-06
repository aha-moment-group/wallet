import assert from "assert";
import axios from "axios";
import { Client as PgClient } from "pg";

import { priceCrypto as config } from "../../config";
import { daemonWrapper, getPg } from "../utils";

const priceCrypto = async (pg: PgClient): Promise<number> => {
  await Promise.all(
    config.map(async crypto => {
      const res0 = await axios.get(
        `https://api.coinmarketcap.com/v2/ticker/${crypto.id}`
      );
      assert.strictEqual(
        res0.status,
        200,
        `bad response status ${res0.status}`
      );
      const res1 = res0.data;
      assert.strictEqual(res1.metadata.error, null, "bad response");
      const res2 = res1.data;
      assert.strictEqual(res2.symbol, crypto.symbol, "bad response");
      const res3: number = res2.quotes.USD.price;
      await pg.query(`update kv_pairs set value = $1 where key = $2`, [
        res3,
        `${crypto.symbol}/USD`
      ]);
    })
  );
  return 20 * 60 * 1000; // 20 min
};

export default priceCrypto;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    await pg.connect();
    await daemonWrapper(async () => await priceCrypto(pg));
    await pg.end();
  })();
}
