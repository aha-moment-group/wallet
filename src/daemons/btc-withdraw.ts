import Btc from "bitcoin-core";
import { Client as PgClient } from "pg";

import { btcWithdraw as config } from "../../config";
import { daemonWrapper, getBtc, getPg } from "../utils";

const btcWithdraw = async (pg: PgClient, btc: Btc): Promise<number> => {
  const { step } = config;
  const wds = (await pg.query(
    `select * from withdrawals where crypto = 'BTC' and tx_hash is null order by id limit $1`,
    [step]
  )).rows;
  if (wds.length === 0) {
    return 60 * 1000; // 1min
  }
  const txHash = await btc.sendMany(
    "coinfair",
    Object.assign(
      {},
      ...wds.map((d: { recipient_addr: string; amount: string }) => ({
        [d.recipient_addr]: d.amount
      }))
    )
  );
  await pg.query(
    `update withdrawals set tx_hash = $1 where id = any($2::bigint[])`,
    [txHash, wds.map(w => w.id)]
  );
  return 0;
};

export default btcWithdraw;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const btc = getBtc();
    await pg.connect();
    await daemonWrapper(async () => await btcWithdraw(pg, btc));
    await pg.end();
  })();
}
