export { db } from "./db";
export { env } from "./env";

export const priceCrypto = [
  { symbol: "BTC", id: 1 },
  { symbol: "ETH", id: 1027 }
];

export const priceFiat = [
  "USD",
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TWD",
  "ZAR"
];

export const btcDeposit = {
  confirmationThreshold: 2,
  step: 8
};

export const btcFee = {
  confTarget: 6,
  txSizeKb: 0.4
};

export const btcWithdraw = {
  step: 8
};

export const getBtc = {
  password: "bitcoind password",
  username: "bitcoind username"
};


export const carrotCollect = {
  confirmationThreshold: 10,
  contractAddr: "0x1cE2591bE2a7f00dDd4cE15247B935CCabe5aF76",
  decimals: 18,
  tokenName: "CARROT"
};

export const carrotDeposit = {
  collectThreshold: 10,
  contractAddr: "0x1cE2591bE2a7f00dDd4cE15247B935CCabe5aF76",
  decimals: 18,
  step: 30,
  tokenName: "CARROT"
};

export const carrotWithdraw = {
  contractAddr: "0x1cE2591bE2a7f00dDd4cE15247B935CCabe5aF76",
  decimals: 18,
  tokenName: "CARROT"
};

export const cfcCollect = {
  confirmationThreshold: 10,
  contractAddr: "0x64c289C22Fd7EC36a766cc7C0b6b60C73BAF9B48",
  decimals: 8,
  tokenName: "CFC"
};

export const cfcDeposit = {
  collectThreshold: 10,
  contractAddr: "0x64c289C22Fd7EC36a766cc7C0b6b60C73BAF9B48",
  decimals: 8,
  step: 30,
  tokenName: "CFC"
};

export const cfcWithdraw = {
  contractAddr: "0x64c289C22Fd7EC36a766cc7C0b6b60C73BAF9B48",
  decimals: 8,
  tokenName: "CFC"
};

export const ethCollect = {
  confirmationThreshold: 10
};

export const ethDeposit = {
  collectThreshold: 10000000000000000, // 0.01 ether
  step: 30
};

export const ethWithdraw = {
  step: 1
};
