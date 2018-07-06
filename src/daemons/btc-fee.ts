import Btc from "bitcoin-core";
import { Client as PgClient } from "pg";

import { btcFee as config } from "../../config";
import { daemonWrapper, getBtc, getPg } from "../utils";

const btcFee = async (pg: PgClient, btc: Btc): Promise<number> => {
  const { confTarget, txSizeKb } = config;
  const feeRate = (await btc.estimateSmartFee(confTarget)).feerate!;
  const fee = txSizeKb * feeRate;
  await Promise.all([
    btc.setTxFee(feeRate),
    (async () => {
      await pg.query(`delete from kv_pairs where key = 'btcFee'`);
      await pg.query(
        `
          insert into kv_pairs (key, value)
          values ('btcFee', $1::numeric(32, 8)::text::jsonb)
        `,
        [fee]
      );
    })()
  ]);
  return 10 * 60 * 1000; // 10min
};

export default btcFee;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const btc = getBtc();
    await pg.connect();
    await daemonWrapper(async () => await btcFee(pg, btc));
    await pg.end();
  })();
}
