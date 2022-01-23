import { TRIBUS_SRC, REGISTRY_CONTRACT } from "../contracts.js";
import { createTribus } from "./states.js";
import { arweave, _validateAddress } from "./arweave.js";
import { getGatedNfts } from "../../api.js";
import { readContract } from "smartweave";
import {
  validateContentStructure,
  isRegisteredNft,
  isTribus,
  isTribusMember,
  data_type,
} from "../validating.js";

export async function tribusDeploying({
  tribus_name,
  tribus_description,
  nft_id,
} = {}) {
  createTribus.name = tribus_name;
  createTribus.description = tribus_description;
  createTribus.nft_id = nft_id;

  const tags = [
    // SmartWeave Protocol Tags
    ["App-Name", "SmartWeaveContract"],
    ["App-Version", "0.3.0"],
    ["Contract-Src", TRIBUS_SRC],
    ["Content-Type", "application/json"],
    // DecentLand ANFT_Gated Protocol
    ["Protocol-Name", "DecentLand"],
    ["Protocol-Action", "CreateTribus"],
    ["Protocol-Tribus-Type", "aNFT-Gated"],
  ];

  return {
    tags: tags,
    content_object: createTribus,
  };
}

export async function listTribus({ tribus_id } = {}) {
  try {
    _validateAddress(tribus_id);

    const tags = [
      // SmartWeave Protocol Tags
      ["App-Name", "SmartWeaveAction"],
      ["App-Version", "0.3.0"],
      ["Contract", `${REGISTRY_CONTRACT}`],
      ["Input", `{"function": "list", "tribus_id": "${tribus_id}"}`],
      ["Content-Type", "application/json"],
      // DecentLand ANFT_Gated Protocol
      ["Protocol-Name", "DecentLand"],
      ["Protocol-Action", "ListTribus"],
      ["Protocol-Tribus-Type", "aNFT-Gated"],
    ];
    // random data to seed the Arweave TX
    const content_object = {
      timestamp: Date.now(),
    };

    return {
      tags,
      content_object,
    };
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function addMember({
  nft_id,
  adding_address,
  caller_address,
  qty,
} = {}) {
  try {
    _validateAddress(caller_address);
    _validateAddress(adding_address);

    if (!(await isRegisteredNft(nft_id))) {
      throw new Error(`nft_id: ${nft_id} not registered in the protocol`);
    }

    if (typeof qty !== "number") {
      throw new Error("transfer qty must be a number");
    }

    const nft_state = await readContract(arweave, nft_id);

    if (
      !(caller_address in nft_state.balances) ||
      nft_state["balances"][caller_address] < qty
    ) {
      throw new Error("unsufficient NFT balance");
    }

    const tags = [
      // SmartWeave Protocol Tags
      ["App-Name", "SmartWeaveAction"],
      ["App-Name", "0.3.0"],
      ["Contract", nft_id],
      [
        "Input",
        `{"function": "transfer", "target": "${adding_address}", "qty": ${qty}}`,
      ],
      // DecentLand ANFT_Gated Protocol
      ["Protocol-Name", "DecentLand"],
      ["Protocol-Action", "addMember"],
    ];
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function createPost({
  tribus_id,
  content_object,
  caller_address,
} = {}) {
  try {
    if (!(await validateContentStructure(content_object))) {
      throw new Error("Invalid post body structure");
    }

    if (!(await isTribus(tribus_id))) {
      throw new Error("invalid tribus id");
    }

    if (!(await isTribusMember({ tribus_id, caller_address }))) {
      throw new Error(
        `caller: ${caller_address} is not a member in tribus: ${tribus_id}`
      );
    }

    const tags = [
      // SmartWeave Protocol Tags
      ["App-Name", "SmartWeaveAction"],
      ["App-Version", "0.3.0"],
      ["Contract", tribus_id],
      ["Input", `{"function": "post"}`],
      ["Content-Type", "application/json"],
      // DecentLand ANFT_Gated Protocol
      ["Protocol-Name", "DecentLand"],
      ["Protocol-Action", "post"],
      ["Protocol-Tribus-Type", "aNFT-Gated"],
      ["Tribus-ID", tribus_id],
    ];

    return {
      tags,
      content_object,
    };
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function createReply({
  tribus_id,
  content_object,
  caller_address,
  post_id,
} = {}) {
  try {
    _validateAddress(post_id);

    if (!(await validateContentStructure(content_object))) {
      throw new Error("Invalid post body structure");
    }

    if (!(await isTribus(tribus_id))) {
      throw new Error("invalid tribus id");
    }

    if (!(await isTribusMember({ tribus_id, caller_address }))) {
      throw new Error(
        `caller: ${caller_address} is not a member in tribus: ${tribus_id}`
      );
    }

    const tags = [
      // SmartWeave Protocol Tags
      ["App-Name", "SmartWeaveAction"],
      ["App-Version", "0.3.0"],
      ["Contract", tribus_id],
      ["Input", `{"function": "reply", "post_id": "${post_id}"}`],
      ["Content-Type", "application/json"],
      // DecentLand ANFT_Gated Protocol
      ["Protocol-Name", "DecentLand"],
      ["Protocol-Action", "reply"],
      ["reply-reference", `${post_id}`],
      ["Protocol-Tribus-Type", "aNFT-Gated"],
      ["Tribus-ID", tribus_id],
    ];

    return {
      tags,
      content_object,
    };
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function addTags({ tags_array, tx_object } = {}) {
  try {
    const isArray = data_type(tags_array) === "[object Array]" ? true : false;

    if (!isArray) {
      throw new Error("invalid tags array passed");
    }

    for (let tag of tags_array) {
      tx_object.addTag(tag[0], tag[1]);
    }

    return tx_object;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}
