import Btc from "bitcoin-core";
import fs from "fs";
import net from "net";
import path from "path";
import Web3 from "web3";
import { getBtc as config } from "../../config";

export * from "./btc";
export { Daemon } from "./daemon";
export { daemonWrapper } from "./daemonWrapper";
export * from "./eth";
export { getLogger } from "./logger";
export { getPg } from "./pg";

export const getAbi = (tokenSymbol: string) =>
  JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, `./${tokenSymbol.toLowerCase()}.json`),
      "utf8"
    )
  );

export const getBtc = () =>
  new Btc({
    password: config.password,
    username: config.username
  });

export const getWeb3 = () => new Web3("/media/geth/geth.ipc", net);
