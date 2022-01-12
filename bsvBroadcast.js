import { getNetwork } from "./bsvUtxo.js";

export async function broadcastTx(txhex, network = undefined) {
  network = network || getNetwork();

  const res = await fetch({
    method: "POST",
    url: `https://api.whatsonchain.com/v1/bsv/${network}/tx/raw`,
    body: { txhex },
    headers: { "Content-Type": "application/json" },
  });

  return res;
}
