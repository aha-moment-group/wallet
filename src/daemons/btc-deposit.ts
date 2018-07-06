import Btc from "bitcoin-core";
import { Client as PgClient } from "pg";

import { btcDeposit as config } from "../../config";
import { daemonWrapper, getBtc, getPg } from "../utils";

const btcDeposit = async (pg: PgClient, btc: Btc): Promise<number> => {
  const { confirmationThreshold, step } = config;
  const cursor: number = (await pg.query(
    `select "value" from kv_pairs where "key" = 'btcCursor'`
  )).rows[0].value;
  const txs = await btc.listTransactions("coinfair", step, cursor);
  if (txs.length === 0) {
    return 10 * 60 * 1000; // 10min
  }
  for (const tx of txs) {
    const confirmed = tx.confirmations >= confirmationThreshold;
    let txPg = (await pg.query(
      `select * from deposits where crypto = 'BTC' and tx_hash = $1`,
      [tx.txid]
    )).rows[0];
    if (txPg === undefined) {
      let userId = (await pg.query(
        `select id from users where "addressBTC142" = $1`,
        [tx.address]
      )).rows[0];
      if (userId === undefined) {
        throw new Error(`recipient address ${tx.address} does not exist in db`);
      }
      userId = userId.id;
      txPg = await pg.query(
        `
          insert into deposits (crypto, block_hash, tx_hash, recipient_addr, recipient_id, amount)
          values ('BTC', $1, $2, $3, $4, $5)
          returning *
        `,
        [tx.blockhash, tx.txid, tx.address, userId, tx.amount]
      );
      txPg = txPg.rows[0];
    }
    if (!confirmed && txPg.confirmed) {
      throw new Error(`tx ${tx.txid} attacked`);
    } else if (confirmed && !txPg.confirmed) {
      try {
        await pg.query(`begin`);
        await pg.query(
          `update deposits set confirmed = true where crypto = 'BTC' and tx_hash = $1`,
          [tx.txid]
        );
        await pg.query(
          `update crypto_accounts set available = available + $1 where crypto = 'BTC' and user_id = $2`,
          [tx.amount, txPg.recipient_id]
        );
        await pg.query(`commit`);
      } catch (err) {
        await pg.query(`rollback`);
        throw err;
      }
    }
  }
  let cnt = 0;
  while (cnt < txs.length && txs[cnt].confirmations >= confirmationThreshold) {
    cnt++;
  }
  await pg.query(
    `update kv_pairs set "value" = $1 where "key" = 'btcCursor'`,
    [cursor + cnt]
  );
  return 0;
};

export default btcDeposit;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const btc = getBtc();
    await pg.connect();
    await daemonWrapper(async () => await btcDeposit(pg, btc));
    await pg.end();
  })();
}
