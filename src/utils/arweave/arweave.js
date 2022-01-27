import { SmartWeaveNodeFactory, LoggerFactory } from "redstone-smartweave";
import { readContract } from "smartweave";
import { REGISTRY_CONTRACT, CONTRACTS_API } from "../contracts.js";
import Arweave from "arweave";

export const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
  timeout: 20000,
  logging: false,
});

export const smartweave = SmartWeaveNodeFactory.memCached(arweave);

export function _validateAddress(address) {
  const validity = /[a-z0-9_-]{43}/i.test(address)

  if (! validity) {
    console.log(`address: ${address} is not valid`);
    process.exit(1)
  }
}

export async function readRegistryContract() {
  try {
    const state = await readContract(arweave, REGISTRY_CONTRACT);
    return state
  } catch(error) {
    console.log(`${error.name} : ${error.description}`);
    process.exit(1);
  }
}
