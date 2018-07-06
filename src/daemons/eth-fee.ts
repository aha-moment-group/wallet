import { Client as Pgclient } from "pg";
import Web3 from "web3";
import { daemonWrapper, getPg, getWeb3 } from "../utils";

const ethFee = async (pg: Pgclient, web3: Web3): Promise<number> => {
  const gasPrice = await web3.eth.getGasPrice();
  const txFee = (21000 * gasPrice).toString();;
  const value = web3.utils.fromWei(txFee, 'ether');

  try {
    await pg.query(`begin`);
    await pg.query(`delete from kv_pairs where key = 'ethFee'`);
    await pg.query(
      `
      insert into kv_pairs
      (key, value)
      values
      ('ethFee', $1::numeric(32, 8)::text::jsonb)
    `,
      [value]
    );
    await pg.query(`commit`);
  } catch (err) {
    await pg.query(`rollback`);
    throw err;
  }

  return 5 * 60 * 1000; // 5 min
};

export default ethFee;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    await pg.connect();
    await daemonWrapper(async () => await ethFee(pg, web3));
    await pg.end();
  })();
}
