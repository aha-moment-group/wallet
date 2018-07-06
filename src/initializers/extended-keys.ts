// tslint:disable:no-console

import Mnemonic from "bip39";
import readline from "readline-sync";

import { getBtcXPrv, getBtcXPub, getEthXPrv, getEthXPub } from "../utils";

if (require.main === module) {
  const mnemonic = readline.question("mnemonic: ");
  const seed = Mnemonic.mnemonicToSeed(mnemonic);
  let xPrv: string;
  let xPub: string;
  // bitcoin
  xPrv = getBtcXPrv(seed);
  xPub = getBtcXPub(xPrv);
  console.log("Bitcoin xprv:  " + xPrv);
  console.log("Bitcoin xpub:  " + xPub);
  // ethereum
  xPrv = getEthXPrv(seed);
  xPub = getEthXPub(xPrv);
  console.log("Ethereum xprv: " + xPrv);
  console.log("Ethereum xpub: " + xPub);
}
