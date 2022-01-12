import bsvjs from "./lib/bsv/bsv.js";
import * as utxo from "./bsvUtxo.js";
import { broadcastTx } from "./bsvBroadcast.js";

window.makeTx = makeTx;

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
        Address.fromString(outputDetail.address)
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

  if (broadcast) {
    await broadcastTx(txb.tx.toHex());
  }

  return txb.tx;
}
