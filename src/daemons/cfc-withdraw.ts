import { Client as PgClient } from "pg";
import readline from "readline-sync";
import Web3 from "web3";

import { cfcWithdraw as config } from "../../config";
import {
  daemonWrapper,
  getEthAdd,
  getEthPrv,
  getEthXPub,
  getPg,
  getWeb3
} from "../utils";
import erc20Withdraw from "./erc20-withdraw";

const cfcWithdraw = async (
  pg: PgClient,
  web3: Web3,
  xPrv: string
): Promise<number> => {
  await erc20Withdraw(pg, web3, xPrv, config);
  return 60 * 1000; // 1min
};

export default cfcWithdraw;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    const xPrv = readline.question("xPrv: ");
    // const prv = getEthPrv(xPrv, 0);
    // const pubAddr = getEthAdd(getEthXPub(xPrv), 0);
    await pg.connect();
    await daemonWrapper(async () => await cfcWithdraw(pg, web3, xPrv));
    await pg.end();
  })();
}
