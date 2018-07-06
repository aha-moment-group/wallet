import readline from "readline-sync";

import { daemonWrapper, getBtc, getPg, getWeb3 } from "../utils";

import btcDeposit from "./btc-deposit";
import btcFee from "./btc-fee";
import btcWithdraw from "./btc-withdraw";
import carrotCollect from "./carrot-collect";
import carrotDeposit from "./carrot-deposit";
import carrotWithdraw from "./carrot-withdraw";
import cfcCollect from "./cfc-collect";
import cfcDeposit from "./cfc-deposit";
import cfcWithdraw from "./cfc-withdraw";
import ethCollect from "./eth-collect";
import ethDeposit from "./eth-deposit";
import ethWithdraw from "./eth-withdraw";
import priceCrypto from "./price-crypto";
import priceFiat from "./price-fiat";

const daemons = async () => {
  const pg = getPg();
  const btc = getBtc();
  const web3 = getWeb3();
  const ethXPrv = readline.question("ETH xPrv: ");
  await pg.connect();
  await Promise.all([
    daemonWrapper(async () => await priceCrypto(pg)),
    daemonWrapper(async () => await priceFiat(pg)),

    // btc
    daemonWrapper(async () => await btcDeposit(pg, btc)),
    daemonWrapper(async () => await btcFee(pg, btc)),
    daemonWrapper(async () => await btcWithdraw(pg, btc)),

    // eth
    daemonWrapper(async () => await ethWithdraw(pg, web3, ethXPrv)),
    daemonWrapper(async () => await ethCollect(pg, web3, ethXPrv)),
    daemonWrapper(async () => await ethDeposit(pg, web3, ethXPrv)),

    /*
    // cfc
    daemonWrapper(async () => await cfcCollect(pg, web3, ethXPrv)),
    daemonWrapper(async () => await cfcWithdraw(pg, web3, ethXPrv)),
    daemonWrapper(async () => await cfcDeposit(pg, web3))
    */

    // carrot
    daemonWrapper(async () => await carrotCollect(pg, web3, ethXPrv)),
    daemonWrapper(async () => await carrotWithdraw(pg, web3, ethXPrv)),
    daemonWrapper(async () => await carrotDeposit(pg, web3))

  ]);
  await pg.end();
};

export default daemons;

if (require.main === module) {
  daemons();
}
