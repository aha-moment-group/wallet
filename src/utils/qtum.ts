import assert from "assert";

export const getQtumXPrv = (seed: Buffer) => {
  // "m/44'/2301'/0'/0"
};

export const getQtumXPub = (xprv: string) => {
  assert.ok(xprv.startsWith("xprv"));
};

export const getQtumPrv = (xprv: string, index: number) => {
  assert.ok(xprv.startsWith("xprv") && index >= 0);
};

export const getQtumAdd = (xpub: string, index: number) => {
  assert.ok(xpub.startsWith("xpub") && index >= 0);
};
