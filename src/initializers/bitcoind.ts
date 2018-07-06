import Mnemonic from "bip39";
import readline from "readline-sync";

import {
  getBtc,
  getBtcAdd,
  getBtcPrv,
  getBtcXPrv,
  getBtcXPub,
  getLogger
} from "../utils";

const logger = getLogger("init-btc-bitcoind");

if (require.main === module) {
  (async () => {
    const btc = getBtc();
    const mnemonic = readline.question("mnemonic: ");
    const seed = Mnemonic.mnemonicToSeed(mnemonic);
    const xPrv = getBtcXPrv(seed);
    const xPub = getBtcXPub(xPrv);
    const lo = Number(
      readline.question("HD wallet index lower bound (inclusive): ")
    );
    const hi = Number(
      readline.question("HD wallet index upper bound (exclusive): ")
    );
    for (let i = lo; i < hi; i++) {
      // tslint:disable-next-line:no-bitwise
      if ((i & 0xff) === 0) {
        logger.info(`generating address ${i}: ${getBtcAdd(xPub, i)}`);
      }
      const prv = getBtcPrv(xPrv, i);
      await btc.importPrivKey(prv, "coinfair", false);
    }
  })();
}
