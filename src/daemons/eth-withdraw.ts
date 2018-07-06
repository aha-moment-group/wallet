import { Client as PgClient } from "pg";
import readline from "readline-sync";
import Web3, { Signature } from "web3";

import { ethWithdraw as config } from "../../config";
import {
  daemonWrapper,
  getEthAdd,
  getEthPrv,
  getEthXPub,
  getLogger,
  getPg,
  getWeb3
} from "../utils";

const logger = getLogger("ethWithdraw");

const ethWithdraw = async (
  pg: PgClient,
  web3: Web3,
  xPrv: string
): Promise<number> => {
  const { step } = config;
  const prv = getEthPrv(xPrv, 0);
  const wd = (await pg.query(
    `select * from withdrawals where crypto = 'ETH' and tx_hash is null limit 1`
  )).rows[0];

  if (wd === undefined) {
    logger.debug("no record");
    return 60 * 1000; // 1min
  }

  const thisGasPrice = await web3.eth.getGasPrice();
  const txFee = 21000 * thisGasPrice;

  const value = web3.utils.toBN(web3.utils.toWei(wd.amount, "ether"));
  // value = value.sub(web3.utils.toBN(txFee));

  const collectAddr = getEthAdd(getEthXPub(xPrv), 0);
  const balance = await web3.eth.getBalance(collectAddr);

  if (web3.utils.toBN(balance).lte(value)) {
    logger.error("wallet balance is not enough");
    return 60 * 1000; // 1min
  }

  const signTx = (await web3.eth.accounts.signTransaction(
    {
      gas: 21000,
      gasPrice: thisGasPrice,
      to: wd.recipient_addr,
      value: value.toString()
    },
    prv
  )) as Signature;

  logger.info(`
    signTx gasPrice: ${thisGasPrice}
    txFee:           ${txFee}
    rawTransaction:  ${signTx.rawTransaction}
  `);

  const tx = await web3.eth
    .sendSignedTransaction(signTx.rawTransaction)
    .on("transactionHash", async hash => {
      logger.info("withDrawTxHash: " + hash);
      await pg.query(`update withdrawals set tx_hash = $1, fee = $2 where id = $3`, [
        hash,
        web3.utils.fromWei(txFee, 'ether'),
        wd.id
      ]);
      logger.info("Finish update db");
    });
  return 0;
};

export default ethWithdraw;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    const xPrv = readline.question("xPrv: ");
    await pg.connect();
    await daemonWrapper(async () => await ethWithdraw(pg, web3, xPrv));
    await pg.end();
  })();
}
