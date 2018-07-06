import { Client as PgClient } from "pg";
import readline from "readline-sync";
import Web3, { Signature } from "web3";

import { ethCollect as config } from "../../config";
import {
  daemonWrapper,
  getEthAdd,
  getEthPrv,
  getEthXPub,
  getLogger,
  getPg,
  getWeb3
} from "../utils";

const logger = getLogger("ethCollect");

const ethCollect = async (
  pg: PgClient,
  web3: Web3,
  xPrv: string
): Promise<number> => {
  const { confirmationThreshold } = config;
  const collectAddr = getEthAdd(getEthXPub(xPrv), 0);
  const fullNodeHeight = await web3.eth.getBlockNumber();

  const unconfTxs = (await pg.query(`
    select "block_height", "tx_hash", "amount", "recipient_id"
    from "deposits"
    where "crypto" = 'ETH' and "confirmed" = false
  `)).rows;

  if (unconfTxs.length === 0) {
    logger.debug("No collect record");
    return 60 * 1000; // 1min
  }

  await Promise.all(
    unconfTxs.map(async tx => {
      const txHash = tx.tx_hash;
      const blockHeight = tx.block_height;
      const txValue = tx.amount;
      const userId = tx.recipient_id;

      if (fullNodeHeight - blockHeight + 1 >= confirmationThreshold) {
        logger.info(`
          handle this unconf tx
          unconfTxInfo:
          txHash: ${txHash}
          blockHeight: ${blockHeight}
          txValue: ${txValue}
          userId: ${userId}
        `);

        const thisAddr = getEthAdd(getEthXPub(xPrv), userId);
        const balance = await web3.eth.getBalance(thisAddr);

        // collect
        logger.info("\nStart collect");
        const prv = getEthPrv(xPrv, userId);

        const thisGasPrice = await web3.eth.getGasPrice();
        const txFee = 21000 * thisGasPrice;

        let value = web3.utils.toBN(balance);
        value = value.sub(web3.utils.toBN(txFee));

        const signTx = (await web3.eth.accounts.signTransaction(
          {
            gas: 21000,
            gasPrice: thisGasPrice,
            to: collectAddr,
            value: value.toString()
          },
          prv
        )) as Signature;

        await web3.eth
          .sendSignedTransaction(signTx.rawTransaction)
          .on("transactionHash", async hash => {
            logger.info("collectTxHash: " + hash);

            try {
              await pg.query(`begin`);
              await pg.query(
                `update deposits set confirmed = true where crypto = 'ETH' and tx_hash = $1`,
                [txHash]
              );
              await pg.query(
                `
                  update crypto_accounts
                  set "available" = "available" + $1
                  where user_id = $2 and crypto = 'ETH'
                `,
                [txValue, userId]
              );
              await pg.query(`commit`);
            } catch (err) {
              await pg.query(`rollback`);
              throw err;
            }
          });
      }
    })
  );

  logger.debug("Finish collect");
  return 60 * 1000; // 1min
};

export default ethCollect;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    const xPrv = readline.question("xPrv: ");
    await pg.connect();
    await daemonWrapper(async () => await ethCollect(pg, web3, xPrv));
    await pg.end();
  })();
}
