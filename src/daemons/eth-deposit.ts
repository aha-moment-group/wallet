import { Client as PgClient } from "pg";
import readline from "readline-sync";
import Web3 from "web3";

import { ethDeposit as config } from "../../config";
import {
  daemonWrapper,
  getEthAdd,
  getEthXPub,
  getLogger,
  getPg,
  getWeb3
} from "../utils";

const logger = getLogger("ethDeposit");

const ethDeposit = async (
  pg: PgClient,
  web3: Web3,
  ethXPrv: string
): Promise<number> => {
  const { step, collectThreshold } = config;
  const collectAddr = getEthAdd(getEthXPub(ethXPrv), 0);

  /**
   * query blockIndex from db
   * @param blockIndex already handled block
   */
  let blockIndex: number = (await pg.query(
    `select "value" from kv_pairs where "key"='ethCursor'`
  )).rows[0].value;

  // add 1 to be the first unhandled block
  blockIndex = blockIndex + 1;

  let height = await web3.eth.getBlockNumber();
  height = height - 1;
  const fullNodeHeight = height;

  if (height < blockIndex) {
    logger.warn("Ethereum full node is lower than db");
    return 60 * 1000; // 1min
  }
  height = Math.min(height, blockIndex + step - 1);

  // process block
  for (; blockIndex <= height; blockIndex++) {
    // query & update unconfirmed transactions
    logger.debug("blockIndex: " + blockIndex);

    // handle transactions
    const block = await web3.eth.getBlock(blockIndex, true);
    for (const tx of block.transactions) {
      const receipt = await web3.eth.getTransactionReceipt(tx.hash);
      if (receipt.status === false) {
        continue;
      }
      const user = (await pg.query(
        `select "user_id" from crypto_accounts where "address"=$1 and crypto = 'ETH'`,
        [tx.to]
      )).rows[0];
      if (user === undefined) {
        continue;
      }

      /**
       * collect address send ether to this address
       * in order to pay erc20 transfer fee
       */
      if (tx.from === collectAddr) {
        continue;
      }

      if (web3.utils.toBN(tx.value).lt(web3.utils.toBN(collectThreshold))) {
        continue;
      }

      const checkTx = (await pg.query(
        `select * from "deposits" where "crypto" = 'ETH' and "tx_hash" = $1`,
        [tx.hash]
      )).rows[0];
      if (checkTx === undefined) {
        const amount = await web3.utils.fromWei(tx.value, "ether");

        logger.info(`
          blockHash: ${block.hash}
          blockNumber: ${block.number}
          txHash: ${tx.hash}
          userId: ${user.user_id}
          recipientAddr: ${tx.to}
          amount: ${amount}
        `);

        await pg.query(
          `
          insert into "deposits" (
            "crypto", "block_hash", "block_height", "tx_hash",
            "sender_addr", "recipient_id", "recipient_addr", "amount", "confirmed"
          ) values ('ETH', $1, $2, $3, $4, $5, $6, $7, false)
        `,
          [
            block.hash,
            block.number,
            tx.hash,
            tx.from,
            user.user_id,
            tx.to,
            amount
          ]
        );
      } else {
        continue;
      }
    }
    await pg.query(
      `update kv_pairs set "value" = $1 where "key" = 'ethCursor'`,
      [blockIndex]
    );
  }
  return 60 * 1000; // 1min
};

export default ethDeposit;

if (require.main === module) {
  (async () => {
    const pg = getPg();
    const web3 = getWeb3();
    const xPrv = readline.question("xPrv: ");
    await pg.connect();
    await daemonWrapper(async () => await ethDeposit(pg, web3, xPrv));
    await pg.end();
  })();
}
