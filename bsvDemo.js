import bsvjs from "./lib/bsv/bsv.js";
import { makeTx } from "./bsvMakeTx.js";
import * as utxo from "./bsvUtxo.js";

console.log("// Using bsv.js version #" + bsvjs.version);

window.help = help;
window.makeDataTx = makeDataTx;
window.makeSwipeTx = makeSwipeTx;
window.makeSendFundsTx = makeSendFundsTx;

export function help() {
  const lines = [
    ">> HELP:",
    "- makeDataTx: Function for writing strings to the blockchain. Example: makeDataTx('my data')",
    "- makeSendFundsTx: Function for sending bitcoin to an address. Example: makeSendFundsTx(address, satoshis)",
    "- makeSwipeTx: Function for taking all funds and sending them to an address. Example: makeSwipeTx(address)",
    "- makeTx: Function for making custom transaction. Example: makeTx([{ satoshis, address }, { data: bufferArray }])",
    "* * *",
    `- utxo.possibleInputSources: Possible BSV Networks (${utxo.possibleInputSources})`,
    "- utxo.getPrivKey: Gets the private key used for the specific network",
    "- utxo.getKeyPair: Gets the key pair used for the specific network",
    "- utxo.getAddress: Gets the address used for the specific network",
    "- utxo.getNetwork: Gets the currently used network",
    "- utxo.setNetwork: Sets the network to use (should be one of utxo.possibleInputSources)",
    "- utxo.getUtxos: Gets the Unspent Outputs for your key on the specific network",
  ];

  for (const line of lines) {
    console.info(line);
  }
}

export async function makeDataTx(stringsToWriteToBlockchain, broadcast = true) {
  if (typeof stringsToWriteToBlockchain === "string")
    return makeDataTx([stringsToWriteToBlockchain], broadcast);

  const data = stringsToWriteToBlockchain.map((str) => {
    return Buffer.from(str);
  });
  const tx = await makeTx([{ data }], broadcast);
  logTx(tx);
  return tx;
}

export async function makeSendFundsTx(address, satoshis, broadcast = true) {
  const tx = await makeTx([{ satoshis, address }], broadcast);
  logTx(tx);
  return tx;
}

export async function makeSwipeTx(sendToAddress, broadcast = true) {
  const tx = await makeTx([], broadcast, true, sendToAddress);
  logTx(tx);
  return tx;
}

function logTx(tx) {
  const network = utxo.getNetwork();

  if (network === "main") {
    const url = "https://whatsonchain.com/tx/" + tx.id();
    console.html(`TXID: <a href="${url}">${tx.id()}</a>`, "aqua");
  } else if (network === "test") {
    const url = "https://test.whatsonchain.com/tx/" + tx.id();
    console.html(`TXID: <a href="${url}">${tx.id()}</a>`, "aqua");
  } else {
    console.info("TXID: " + tx.id());
  }
  console.info("TX:");
  console.info(tx.toHex());
}
