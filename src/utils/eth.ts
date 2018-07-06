import assert from "assert";
import ethUtil from "ethereumjs-util";
import ethHdkey from "ethereumjs-wallet/hdkey";

export const getEthXPrv = (seed: Buffer): string => {
  return ethHdkey
    .fromMasterSeed(seed)
    .derivePath("m/44'/60'/0'/0")
    .privateExtendedKey();
};

export const getEthXPub = (xprv: string): string => {
  assert.ok(xprv.startsWith("xprv"));
  return ethHdkey.fromExtendedKey(xprv).publicExtendedKey();
};

export const getEthPrv = (xprv: string, index: number): string => {
  assert.ok(xprv.startsWith("xprv") && index >= 0);
  return ethHdkey
    .fromExtendedKey(xprv)
    .deriveChild(index)
    .getWallet()
    .getPrivateKeyString();
};

export const getEthAdd = (xpub: string, index: number): string => {
  assert.ok(xpub.startsWith("xpub") && index >= 0);
  const add = ethHdkey
    .fromExtendedKey(xpub)
    .deriveChild(index)
    .getWallet()
    .getAddressString();
  return ethUtil.toChecksumAddress(add);
};
