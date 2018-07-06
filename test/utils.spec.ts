import assert from "assert";
import Mnemonic from "bip39";

import {
  getBtcAddBip49,
  getBtcAddBip84,
  getBtcPrv,
  getBtcXPrvBip49,
  getBtcXPrvBip84,
  getBtcXPub,
  getEthAdd,
  getEthPrv,
  getEthXPrv,
  getEthXPub
} from "../src/utils";

const seed = Mnemonic.mnemonicToSeed(
  "念 疾 暴 或 熊 行 黑 垄 长 亮 绕 植 漂 伤 投"
);

describe("BTC BIP49", () => {
  const btcXPrv = getBtcXPrvBip49(seed);
  const btcXPub = getBtcXPub(btcXPrv);

  it("can generate child private key", () => {
    assert.strictEqual(
      getBtcPrv(btcXPrv, 0),
      "L4AjvRTpLusEXTAU4iDXPCim4ypssf2Gy9yYSoigKRQzUTZRXz5b"
    );
  });

  it("can generate child address", () => {
    assert.strictEqual(
      getBtcAddBip49(btcXPub, 0),
      "397NboPb4RAReyCMUoMVAG35rJCeYB3gch"
    );
  });
});

describe("BTC BIP84", () => {
  const btcXPrv = getBtcXPrvBip84(seed);
  const btcXPub = getBtcXPub(btcXPrv);

  it("can generate child private key", () => {
    assert.strictEqual(
      getBtcPrv(btcXPrv, 0),
      "KwvZs8U5knV3FVcSxghmYxFRiTD5ZBUXApiUGPKVmf7WouxLXV5u"
    );
  });

  it("can generate child address", () => {
    assert.strictEqual(
      getBtcAddBip84(btcXPub, 0),
      "bc1qu80fjlzrrf9yjdqygd0rlne936xe06xh4sjx7d"
    );
  });
});

describe("ETH BIP44", () => {
  const ethXPrv = getEthXPrv(seed);
  const ethXPub = getEthXPub(ethXPrv);

  it("can generate child private key", () => {
    assert.strictEqual(
      getEthPrv(ethXPrv, 0),
      "0x7c2781b84b14a8914adb6362b078a39ab178931cecfae95d724c6eb316497955"
    );
  });

  it("can generate child address", () => {
    assert.strictEqual(
      getEthAdd(ethXPub, 0),
      "0x133A1c52674fe482462716333a0d968093f52352"
    );
  });
});

describe("QTUM BIP44", () => {});
