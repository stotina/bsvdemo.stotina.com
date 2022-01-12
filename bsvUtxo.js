import bsvjs from "./lib/bsv/bsv.js";
import { PRIV_KET_MAIN, PRIV_KEY_TEST, PRIV_KEY_FAKE } from "./settings.js";

let inputSourceNetwork = "fake";

export const possibleInputSources = ["main", "test", "fake"];

window.utxo = {
  possibleInputSources,
  getPrivKey,
  getKeyPair,
  getAddress,
  getNetwork,
  setNetwork,
  getUtxos,
};

export function getPrivKey() {
  if (inputSourceNetwork === "main")
    return bsvjs.PrivKey.fromString(PRIV_KET_MAIN);
  else if (inputSourceNetwork === "test")
    return bsvjs.PrivKey.Testnet.fromString(PRIV_KEY_TEST);
  else if (inputSourceNetwork === "fake")
    return bsvjs.PrivKey.fromString(PRIV_KEY_FAKE);
  else throw new Error("Unsupported Network : " + inputSourceNetwork);
}

export function getKeyPair() {
  if (inputSourceNetwork === "test")
    return bsvjs.KeyPair.Testnet.fromPrivKey(getPrivKey());
  else return bsvjs.KeyPair.fromPrivKey(getPrivKey());
}

export function getAddress() {
  if (inputSourceNetwork === "test")
    return bsvjs.Address.Testnet.fromPrivKey(getPrivKey());
  else return bsvjs.Address.fromPrivKey(getPrivKey());
}

export function getNetwork() {
  return inputSourceNetwork;
}

export function setNetwork(sourceName) {
  if (possibleInputSources.indexOf(sourceName) < 0) {
    throw new Error(
      `Unknown Source Type "${sourceName}".` +
        ` Allowed source types are: ${possibleInputSources.join(", ")}`
    );
  }
  inputSourceNetwork = sourceName;
}

/**
 * @returns Array<{ pk: bsvjs.PrivKey; out: bsvjs.TxOut, txid: Buffer, vout: number }>
 */
export async function getUtxos() {
  const pk = getPrivKey();
  const addr = getAddress();
  const utxos = [];

  if (inputSourceNetwork === "main")
    utxos.push(...(await getWocUtxos(addr, "main")));
  else if (inputSourceNetwork === "test")
    utxos.push(...(await getWocUtxos(addr, "test")));
  else if (inputSourceNetwork === "fake")
    utxos.push(...(await getFakeUtxos(addr)));
  else throw new Error("Unsupported Network: " + inputSourceNetwork);

  return utxos.map((i) => {
    return {
      pk,
      out: bsvjs.TxOut.fromJSON(i.out.toJSON()),
      txid: i.txid,
      vout: parseInt(i.vout),
    };
  });
}

async function getFakeUtxos(addr) {
  const script = bsvjs.Script.fromPubKeyHash(addr.hashBuf);
  const out = new bsvjs.TxOut(
    new bsvjs.Bn("100000000"),
    bsvjs.VarInt.fromNumber(script.toBuffer().length),
    script
  );
  const txid = Buffer.from(
    "25c7f2c9ba4faae6e9d067205a4c7f5bf0611564bcf0400385fc4f9fc458ac6f",
    "hex"
  );
  return [{ out, txid, vout: 3 }];
}

export async function getWocUtxos(address, network = "main") {
  const url = `https://api.whatsonchain.com/v1/bsv/${network}/address/${address}/unspent`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      `Failed to GET ${url} : ${res.status} ${res.statusText}` +
        ` - ${JSON.stringify(res.body)}`
    );
  const addr =
    network === "main"
      ? bsvjs.Address.fromString(address.toString())
      : bsvjs.Address.Testnet.fromString(address.toString());
  const script = bsvjs.Script.fromPubKeyHash(addr.hashBuf);
  const scriptLen = bsvjs.VarInt.fromNumber(script.toBuffer().length);
  return res.body.map((i) => {
    const res = {
      txid: i.tx_hash,
      vout: i.tx_pos,
      value: i.value,
      height: i.height,
    };
    const out = new bsvjs.TxOut(new bsvjs.Bn(res.value), scriptLen, script);
    const txid = Buffer.from(res.txid, "hex");
    return [{ out, txid, vout: res.vout }];
  });
}
