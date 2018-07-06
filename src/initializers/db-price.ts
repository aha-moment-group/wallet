import { getPg } from "../utils";

import { priceCrypto, priceFiat } from "../../config";

if (require.main === module) {
  (async () => {
    const pg = getPg();
    await pg.connect();
    await Promise.all([
      ...priceCrypto.map(async crypto => {
        await pg.query(
          `
          insert into kv_pairs
          values ('${crypto.symbol}/USD', 'null')
          on conflict do nothing;
        `
        );
      }),
      ...priceFiat.filter(fiat => fiat !== "USD").map(async fiat => {
        await pg.query(
          `insert into kv_pairs values ('USD/${fiat}', 'null') on conflict do nothing;`
        );
      })
    ]);
    await pg.end();
  })();
}
