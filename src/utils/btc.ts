import assert from "assert";
import btc from "bitcoinjs-lib";

export const getBtcXPrvBip49 = (seed: Buffer): string => {
  return btc.HDNode.fromSeedBuffer(seed)
    .derivePath("m/49'/0'/0'/0")
    .toBase58();
};

export const getBtcXPrvBip84 = (seed: Buffer): string => {
  return btc.HDNode.fromSeedBuffer(seed)
    .derivePath("m/84'/0'/0'/0")
    .toBase58();
};

export const getBtcXPub = (xprv: string): string => {
  assert.ok(xprv.startsWith("xprv"));
  return btc.HDNode.fromBase58(xprv)
    .neutered()
    .toBase58();
};

export const getBtcPrv = (xprv: string, index: number): string => {
  assert.ok(xprv.startsWith("xprv") && index >= 0);
  return btc.HDNode.fromBase58(xprv)
    .derive(index)
    .keyPair.toWIF();
};

export const getBtcAddBip49 = (xpub: string, index: number): string => {
  assert.ok(xpub.startsWith("xpub") && index >= 0);
  const pub = btc.HDNode.fromBase58(xpub).derive(index);
  return btc.address.fromOutputScript(
    btc.script.scriptHash.output.encode(
      btc.crypto.hash160(
        btc.script.witnessPubKeyHash.output.encode(
          btc.crypto.hash160(pub.getPublicKeyBuffer())
        )
      )
    )
  );
};

export const getBtcAddBip84 = (xpub: string, index: number): string => {
  assert.ok(xpub.startsWith("xpub") && index >= 0);
  const pub = btc.HDNode.fromBase58(xpub).derive(index);
  return btc.address.fromOutputScript(
    btc.script.witnessPubKeyHash.output.encode(
      btc.crypto.hash160(pub.getPublicKeyBuffer())
    )
  );
};

export const getBtcXPrv = getBtcXPrvBip84;
export const getBtcAdd = getBtcAddBip84;
