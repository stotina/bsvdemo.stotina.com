import bsvjs from "./lib/bsv/bsv.js";
import * as utxo from "./bsvUtxo.js";
import { broadcastTx } from "./bsvBroadcast.js";

window.makeTx = makeTx;
window.readTx = readTx;

/**
 * Create a transaction with these outputs
 * @param {*} outputDetails Array<{ satoshis?: string; address?: string; data: Buffer[] }>
 * @param {*} broadcast
 * @returns
 */
export async function makeTx(
  outputDetails,
  broadcast = true,
  useAllInputs = false,
  customChangeAddress = undefined
) {
  const txb = new bsvjs.TxBuilder();

  for (let i = 0; i < outputDetails.length; i++) {
    const outputDetail = outputDetails[i];
    if (outputDetail.address) {
      txb.outputToAddress(
        new bsvjs.Bn(outputDetail.satoshis, 10),
        bsvjs.Address.fromString(outputDetail.address)
      );
    } else if (outputDetail.data) {
      txb.outputToScript(
        new bsvjs.Bn("0", 10),
        bsvjs.Script.fromSafeDataArray(outputDetail.data)
      );
    } else
      throw new Error(
        "Cannot Parse Output Detail : " + JSON.stringify(outputDetail)
      );
  }

  const network = utxo.getNetwork();
  const from = utxo.getPrivKey();
  const fromPub = bsvjs.PubKey.fromPrivKey(from);
  const fromKeyPair = utxo.getKeyPair();
  const fromAddr = utxo.getAddress();
  const sourceUtxos = await utxo.getUtxos();

  if (!sourceUtxos?.length) {
    throw new Error(`No Utxos found for ${network}-net address ${fromAddr}`);
  }

  for (let i = 0; i < sourceUtxos.length; i++) {
    const utxo = sourceUtxos[i];
    txb.inputFromPubKeyHash(utxo.txid, utxo.vout, utxo.out, fromPub);
  }

  let changeAddr = fromAddr;
  if (customChangeAddress) {
    if (network === "main")
      changeAddr = bsvjs.Address.fromString(customChangeAddress);
    else if (network === "test")
      changeAddr = bsvjs.Address.Testnet.fromString(customChangeAddress);
  }
  txb.setChangeAddress(changeAddr);

  txb.build({ useAllInputs });

  txb.signWithKeyPairs([fromKeyPair]);

  if (broadcast && network !== "fake") {
    const res = await broadcastTx(txb.tx.toHex());
  }

  logTx(txb.tx, network);

  return txb.tx;
}

export async function readTx(txid, network="main") {
  const tx = await utxo.getWocTx(txid, network);
  logTx(tx);
  return tx;
}

function logTx(tx) {
  const formatTxidLink = (txid) => {
    if (network === "main") {
      const url = "https://whatsonchain.com/tx/" + txid;
      return `<a target=”_blank” href="${url}">${txid}</a>`;
    } else if (network === "test") {
      const url = "https://test.whatsonchain.com/tx/" + txid;
      return `<a target=”_blank” href="${url}">${txid}</a>`;
    } else {
      return txid;
    }
  };

  const network = utxo.getNetwork();

  console.html("TXID: " + formatTxidLink(tx.id()), "aqua");
  console.info("TX: " + tx.toHex());

  console.info("Inputs: ");
  for (const txIn of tx.txIns) {
    console.html(
      ` - from '${formatTxidLink(
        txIn.txHashBuf.reverse().toString("hex")
      )}', output ${txIn.txOutNum}`
    , "aqua");
  }
  console.info("Outputs: ");
  for (const txOut of tx.txOuts) {
    const scriptHex = txOut.script.toHex() + "";
    const isData = scriptHex.startsWith("006a");
    const isP2PKH =
      scriptHex.length === 50 &&
      scriptHex.startsWith("76a914") &&
      scriptHex.endsWith("88ac");
    if (isData) {
      console.info(` - (${txOut.valueBn.toString()} satoshis) with Data: ${Buffer.from(scriptHex.substring(4), "hex").toString()}`);
    } else if (isP2PKH) {
      console.info(
        ` - (${txOut.valueBn.toString()} satoshis) to Address: ${bsvjs.Address.fromTxOutScript(
          bsvjs.Script.fromHex(scriptHex)
        )}`
      );
    } else {
      console.info(` - (${txOut.valueBn.toString()} satoshis) to Script: ${scriptHex}`);
    }
  }

}
