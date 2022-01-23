import { REGISTRY_CONTRACT, TRIBUS_SRC } from "./contracts.js";
import axios from "axios";

export const tribusInteractions = {
  list: {
    query: `query {
  transactions(
    tags: [
        { name: "App-Name", values: "SmartWeaveAction"},
        { name: "App-Version", values: "0.3.0"},
        { name: "Protocol-Name", values: "DecentLand"},
        { name: "Contract", values: "${REGISTRY_CONTRACT}"},
        { name: "Content-Type", values: "application/json"},
        { name: "Protocol-Action", values: "ListTribus"},
        
        ]
    first: 1000
  ) {
    edges {
      node {
        id
        owner { address }
        tags  { name value }
        block { timestamp }

      }
    }
  }
}`,
  },
  create: {
    query: `query {
  transactions(
    tags: [
        { name: "App-Name", values: "SmartWeaveContract"},
        { name: "App-Version", values: "0.3.0"},
        { name: "Protocol-Name", values: "DecentLand"},
        { name: "Contract-Src", values: "${TRIBUS_SRC}"},
        { name: "Content-Type", values: "application/json"},
        { name: "Protocol-Action", values: "CreateTribus"},
        
        ]
    first: 1000
  ) {
    edges {
      node {
        id
        owner { address }
        tags  { name value }
        block { timestamp }

      }
    }
  }
}`,
  },
};



export async function gqlTemplate(query) {
  const response = await axios.post("https://arweave.net/graphql", query, {
    headers: { "Content-Type": "application/json" },
  });

  const transactionIds = [];

  const res_arr = response.data.data.transactions.edges;

  for (let element of res_arr) {
    const tx = element["node"];

    transactionIds.push({
      id: tx.id,
      owner: tx.owner.address,
      // pending transactions do not have block value
      timestamp: tx.block ? tx.block.timestamp : Date.now(),
      tags: tx.tags ? tx.tags : [],
    });
  }

  return transactionIds;
}
