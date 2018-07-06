import assert from "assert";
import axios from "axios";
import { Client as PgClient } from "pg";

import { priceFiat as config } from "../../config";
import { daemonWrapper, getPg } from "../utils";

const price = async (pg: PgClient): Promise<number> => {
  await Promise.all(
    config.filter(fiat => fiat !== "USD").map(async fiat => {
      const res0 = await axios.get(
        `https://free.currencyconverterapi.com/api/v5/convert?q=USD_${fiat}&compact=ultra`
      );
      assert.strictEqual(
        res0.status,
        200,
        `bad response status ${res0.status}`
      );
      const res1 = res0.data[`USD_${fiat}`];
      assert.strictEqual(typeof res1, "number", "bad response");
      await pg.query(`update kv_pairs set value = $1 where key = $2`, [
        res1,
        `USD_${fiat}`
      ]);
    })
  );
  return 10 * 60 * 1000; // 10 min
};

export default price;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    await pg.connect();
    await daemonWrapper(async () => await price(pg));
    await pg.end();
  })();
}
