import bsvjs from "./lib/bsv/bsv.js";
import makeTx from "./bsvMakeTx.js";
import * as utxo from "./bsvUtxo.js";

console.log("// Using bsv.js version #" + bsvjs.version);

window.help = help
window.makeDataTx = makeDataTx
window.swipeAddress = swipeAddress
window.send = send

export function help() {
  //
}

export function makeDataTx(
  stringToWriteToBlockchain,
  ...extraStringsToWrite) {
  //
}

export function send() {
  //
}

export function swipe(sendToAddress) {
  //
}