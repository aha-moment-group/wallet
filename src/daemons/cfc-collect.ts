import { Client as PgClient } from "pg";
import readline from "readline-sync";
import Web3 from "web3";

import { cfcCollect as config } from "../../config";
import { daemonWrapper, getPg, getWeb3 } from "../utils";
import erc20Collect from "./erc20-collect";

const cfcCollect = async (
  pg: PgClient,
  web3: Web3,
  xPrv: string
): Promise<number> => {
  await erc20Collect(pg, web3, xPrv, config);
  return 60 * 1000; // 1min
};

export default cfcCollect;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    const xPrv = readline.question("xPrv: ");
    await pg.connect();
    await daemonWrapper(async () => await cfcCollect(pg, web3, xPrv));
    await pg.end();
  })();
}
