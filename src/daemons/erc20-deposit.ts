import { Client as PgClient } from "pg";
import Web3 from "web3";

import { getAbi, getLogger } from "../utils";

const logger = getLogger("erc20Deposit");

const erc20Deposit = async (
  pg: PgClient,
  web3: Web3,
  config: {
    collectThreshold: number;
    contractAddr: string;
    decimals: number;
    step: number;
    tokenName: string;
  }
) => {
  const { collectThreshold, contractAddr, decimals, step, tokenName } = config;
  const contract = new web3.eth.Contract(getAbi(tokenName), contractAddr);

  /**
   * query blockIndex from db
   * @param blockIndex already handled block
   */
  let blockIndex: number = (await pg.query(
    `select "value" from kv_pairs where "key" = $1`,
    [tokenName + "Cursor"]
  )).rows[0].value;

  // add 1 to be the first unhandled block
  blockIndex = blockIndex + 1;

  let height = await web3.eth.getBlockNumber();

  if (height < blockIndex) {
    logger.warn(
      "Ethereum full node is lower than db | tokenName: " + tokenName
    );
    return;
  }
  height = Math.min(height, blockIndex + step - 1);

  const events = await contract.getPastEvents("Transfer", {
    fromBlock: blockIndex,
    toBlock: height
  });

  for (const e of events) {
    const eIndex = e.blockNumber;

    // catch up eIndex
    for (; blockIndex <= eIndex - 1; blockIndex++) {
      logger.debug("blockIndex: " + blockIndex + " | tokenName: " + tokenName);

      // update db block index
      await pg.query(
        ` update kv_pairs set "value" = $1 where "key" = $2`,
        [blockIndex, tokenName + "Cursor"]
      );
    }

    blockIndex = eIndex;

    logger.debug("blockIndex: " + blockIndex + " | tokenName: " + tokenName);

    // handle this event
    const txHash = e.transactionHash;
    const tokenTx = e.returnValues;
    const fromAddr = tokenTx.from;
    const recipientAddr = tokenTx.to;
    const amount = tokenTx.tokens;

    if (recipientAddr !== undefined) {
      const user = (await pg.query(
        `
          select user_id
          from crypto_accounts
          where address = $1 and crypto = $2
        `,
        [recipientAddr, tokenName]
      )).rows[0];

      if (user !== undefined) {
        if (web3.utils.toBN(amount).lt(web3.utils.toBN(collectThreshold))) {
          continue;
        }

        const checkTx = (await pg.query(
          `select * from "deposits" where "crypto" = $1 and "tx_hash" = $2`,
          [tokenName, txHash]
        )).rows[0];

        if (checkTx === undefined) {
          const bnAmount = web3.utils.toBN(amount);
          const bnDecimals = web3.utils.toBN(decimals);
          const dbDecimals = web3.utils.toBN(8);

          const amountLt = bnAmount.div(web3.utils.toBN(10).pow(bnDecimals));
          let amountRt = bnAmount.mod(web3.utils.toBN(10).pow(bnDecimals));
          if (dbDecimals.lt(bnDecimals)) {
            amountRt = amountRt.div(web3.utils.toBN(10).pow(bnDecimals.sub(dbDecimals)));
          }
          const dbAmount = amountLt.toString() + '.' + amountRt.toString();

          logger.info(`
          tokenName: ${tokenName}
          blockHash: ${e.blockHash}
          blockNumber: ${e.blockNumber}
          txHash: ${txHash}
          userId: ${user.user_id}
          recipientAddr: ${recipientAddr}
          dbAmount: ${dbAmount}
          `);

          await pg.query(
            `
              insert into "deposits" (
                "crypto", "block_hash", "block_height", "tx_hash", "sender_addr", "recipient_id", "recipient_addr", "amount",
                "confirmed"
              ) values (
                $1, $2, $3, $4, $5, $6, $7, $8,
                false
              )
            `,
            [
              tokenName,
              e.blockHash,
              e.blockNumber,
              txHash,
              fromAddr,
              user.user_id,
              recipientAddr,
              dbAmount
            ]
          );
        }
      }
    }
    // update db block index
    await pg.query(
      `update kv_pairs set "value" = $1 where "key" = $2`,
      [blockIndex, tokenName + "Cursor"]
    );
    blockIndex += 1;
  }

  // handle left block
  for (; blockIndex <= height; blockIndex++) {
    logger.debug("blockIndex: " + blockIndex + " | tokenName: " + tokenName);

    // update db block index
    await pg.query(
      `update kv_pairs set "value" = $1 where "key" = $2`,
      [blockIndex, tokenName + "Cursor"]
    );
  }
};

export default erc20Deposit;
