import { Client as PgClient } from "pg";
import Web3, { Signature } from "web3";
import { getAbi, getEthAdd, getEthPrv, getEthXPub, getLogger } from "../utils";

const logger = getLogger("erc20Withdraw");

const erc20Withdraw = async (
  pg: PgClient,
  web3: Web3,
  xPrv: string,
  config: { contractAddr: string; decimals: number; tokenName: string }
) => {
  const { contractAddr, decimals, tokenName } = config;
  const contract = new web3.eth.Contract(getAbi(tokenName), contractAddr);

  const collectAddr = getEthAdd(getEthXPub(xPrv), 0);
  const prv = getEthPrv(xPrv, 0);
  const wd = (await pg.query(
    `
      select * from "withdrawals"
      where "crypto" = $1 and "tx_hash" is null
      limit 1
    `,
    [tokenName]
  )).rows[0];
  if (wd === undefined) {
    logger.debug("no record | tokenName: " + tokenName);
    return 0;
  }

  logger.info("handle this record | tokenName: " + tokenName);

  /*
  let amount = web3.utils.toBN(web3.utils.toWei(wd.amount, "shannon"));
  amount = amount.div(web3.utils.toBN("1000000000"));
  */
  let amount: string;
  if (decimals <= 8) {
    amount = web3.utils
      .toBN(wd.amount * Math.pow(10, 8))
      .div(web3.utils.toBN(Math.pow(10, 8 - decimals)))
      .toString();
  } else {
    amount = web3.utils
      .toBN(wd.amount * Math.pow(10, 8))
      .mul(web3.utils.toBN(Math.pow(10, decimals - 8)))
      .toString();
  }
  const method = await contract.methods.transfer(wd.recipient_addr, amount);
  const txData = await method.encodeABI();
  const gasLimit = await method.estimateGas({ from: collectAddr });
  const thisGasPrice = await web3.eth.getGasPrice();

  // Judge if collect wallet balance is suffient to pay the fee
  const gasFee = web3.utils.toBN(gasLimit).mul(web3.utils.toBN(thisGasPrice));
  const collectBalance = web3.utils.toBN(
    await web3.eth.getBalance(collectAddr)
  );
  if (collectBalance.lt(gasFee)) {
    logger.error("Collect wallet balance is not enough");
    return;
  }

  // start erc20 withdraw
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
  const tx = await web3.eth
    .sendSignedTransaction(signTx.rawTransaction)
    .on("transactionHash", async hash => {
      logger.info("withdrawTxHash: " + hash + " | tokenName: " + tokenName);
      await pg.query(`update "withdrawals" set tx_hash = $1, fee = $2 where id = $3`, [
        hash,
        web3.utils.fromWei(gasFee, 'ether'),
        wd.id
      ]);
      logger.info("Finish update db | tokenName: " + tokenName);
    });
};

export default erc20Withdraw;
