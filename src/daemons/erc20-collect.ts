import { Client as PgClient } from "pg";
import Web3, { Signature } from "web3";

import { getAbi, getEthAdd, getEthPrv, getEthXPub, getLogger } from "../utils";

const logger = getLogger("erc20Collect");

const erc20Collect = async (
  pg: PgClient,
  web3: Web3,
  xPrv: string,
  config: {
    confirmationThreshold: number;
    contractAddr: string;
    decimals: number;
    tokenName: string;
  }
) => {
  const { confirmationThreshold, contractAddr, decimals, tokenName } = config;
  const contract = new web3.eth.Contract(getAbi(tokenName), contractAddr);

  const fullNodeHeight = await web3.eth.getBlockNumber();

  // query & updage unconfirmed transactions
  const unconfTx = (await pg.query(
    `
      select "block_height", "tx_hash", "amount", "recipient_id"
      from "deposits"
      where "crypto" = $1 and "confirmed" = false
    `,
    [tokenName]
  )).rows;

  await Promise.all(
    unconfTx.map(async tx => {
      const txHash = tx.tx_hash;
      const blockHeight = tx.block_height;
      const txValue: number = tx.amount;
      const userId = tx.recipient_id;

      if (fullNodeHeight - blockHeight + 1 >= confirmationThreshold) {
        logger.info(`
          handle this unconf tx
          unconfTxInfo:
          tokenName:   ${tokenName}
          txHash:      ${txHash}
          blockHeight: ${blockHeight}
          txValue:     ${txValue}
          userId:      ${userId}
        `);

        const thisAddr = getEthAdd(getEthXPub(xPrv), userId);
        const balance = await contract.methods.balanceOf(thisAddr).call();
        const prv = getEthPrv(xPrv, userId);

        // check whether real erc20 balance is more than db record
        if (web3.utils.toBN(balance).lt(web3.utils.toBN(txValue * Math.pow(10, decimals)))) {
          logger.error(
            `erc20 balance is less than than db record | address: ${thisAddr}`
          );
          return;
        }

        let collectValue: string;
        if (decimals <= 8) {
          collectValue = web3.utils
            .toBN(txValue)
            .mul(web3.utils.toBN(Math.pow(10, decimals)))
            .toString();
        } else {
          collectValue = web3.utils
          .toBN(txValue * 1e8)
          .mul(web3.utils.toBN(Math.pow(10, decimals - 8)))
          .toString();
        }
        const collectPrv = getEthPrv(xPrv, 0);
        const collectAddr = getEthAdd(getEthXPub(xPrv), 0);

        // collect
        logger.info("\nStart collect | tokenName: " + tokenName);

        const method = contract.methods.transfer(collectAddr, collectValue);
        const txData = await method.encodeABI();
        const gasLimit = await method.estimateGas({ from: thisAddr });
        const thisGasPrice = await web3.eth.getGasPrice();

        // check if balance of collect address is enough to pay this fee
        const gasFee = web3.utils
          .toBN(gasLimit)
          .mul(web3.utils.toBN(thisGasPrice));
        const collectBalance = web3.utils.toBN(
          await web3.eth.getBalance(collectAddr)
        );
        if (collectBalance.lt(gasFee)) {
          logger.error("Collect wallet balance is not enough");
          return;
        }

        // send ether to address to pay erc20 transfer fee
        const etherSignTx = (await web3.eth.accounts.signTransaction(
          {
            gas: 21000,
            to: thisAddr,
            value: gasFee.toString()
          },
          collectPrv
        )) as Signature;

        await web3.eth
          .sendSignedTransaction(etherSignTx.rawTransaction)
          .on("transactionHash", hash => {
            logger.warn(
              "preSendEtherTxHash: " + hash + " | tokenName: " + tokenName
            );
          });

        // start erc20 transfer
        logger.info(`
          tokenName:${tokenName}
          txData:   ${txData}
          gasLimit: ${gasLimit}
          gasPrice: ${thisGasPrice}
        `);

        const signTx = (await web3.eth.accounts.signTransaction(
          {
            data: txData,
            gas: gasLimit,
            gasPrice: thisGasPrice,
            to: contract.options.address
          },
          prv
        )) as Signature;

        await web3.eth
          .sendSignedTransaction(signTx.rawTransaction)
          .on("transactionHash", async hash => {
            logger.info(
              "collectTxHash: " + hash + " | tokenName: " + tokenName
            );
            try {
              await pg.query(`begin`);
              await pg.query(
                `
                  update "deposits"
                  set "confirmed" = true
                  where "crypto" = $1 and tx_hash = $2
                `,
                [tokenName, txHash]
              );
              await pg.query(
                `
                  update crypto_accounts
                  set "available" = "available" + $1
                  where user_id = $2 and crypto = $3
                `,
                [txValue, userId, tokenName]
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
  logger.debug("Finish collect | tokenName: " + tokenName);
};

export default erc20Collect;
