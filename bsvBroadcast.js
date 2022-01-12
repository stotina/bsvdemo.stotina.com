import { getAddress, getNetwork } from "./bsvUtxo.js";

export async function broadcastTx(txhex, network = undefined) {
  network = network?.toString() || getNetwork()?.toString();

  const url = `https://api.whatsonchain.com/v1/bsv/${network}/tx/raw`;

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ txhex }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok)
    throw new Error(
      `Failed to broadcast TX to ${url}: ` +
        ((await res.text()) || res.statusText) +
        ". Extra Information: " +
        JSON.stringify({ network, address: getAddress().toString(), tx: txhex })
    );

  return await res.json();
}
