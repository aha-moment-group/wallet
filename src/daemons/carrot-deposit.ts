import { Client as PgClient } from "pg";
import Web3 from "web3";

import { carrotDeposit as config } from "../../config";
import { daemonWrapper, getAbi, getPg, getWeb3 } from "../utils";
import erc20Deposit from "./erc20-deposit";

const carrotDeposit = async (pg: PgClient, web3: Web3): Promise<number> => {
  await erc20Deposit(pg, web3, config);
  return 60 * 1000; // 1min
};

export default carrotDeposit;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    await pg.connect();
    await daemonWrapper(async () => await carrotDeposit(pg, web3));
    await pg.end();
  })();
}
