import { arweave, readRegistryContract, readApiContract } from "./utils/arweave/arweave.js";
import { tribusInteractions, gqlTemplate } from "./utils/gql.js";
import {
  tribusDeploying,
  listTribus,
  addMember,
  addTags,
  createPost,
  createReply,
} from "./utils/arweave/transactions.js";

// REGISTRY_CONTRACT WRAPPERS
export async function getTribuses() {
  try {
    const tribuses = (await readRegistryContract()).created_tribuses;

    return tribuses;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
    process.exit(1);
  }
}

export async function getGatedNfts() {
  try {
    const tribuses = await getTribuses();
    const nfts = tribuses.map((tribus) => tribus.nft_id);

    return nfts;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
    process.exit(1);
  }
}

// CONTRACTS_API WRAPPERS
export async function getCurrentThumbnail() {
  try {
    const thumbnail = (await readApiContract()).thumbnail;

    return thumbnail;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function getSupportedMime() {
  try {
    const mimes = (await readApiContract()).mime_types;

    return mimes;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

// UTILS FUNCTIONS
export async function getUnlistedTribus() {
  try {
    const listedTribus = [];
    // retrieve TXs of tribus deploying (TRIBUS_SRC instance)
    const tribusCreations = await gqlTemplate(tribusInteractions.create);
    // retrieve TXs of Tribus listing attempts on REGISTRY_CONTRACT
    const tribusListing = await gqlTemplate(tribusInteractions.list);
    // map to TX IDs only. That's equal to Tribuses IDs
    const createdTribusIds = tribusCreations.map(
      (interaction) => interaction.id
    );
    // map to array of tags for each listing TX
    const listingsTags = tribusListing.map((interaction) => interaction.tags);
    // retrieve the tribus_id of each interaction by finding the tag corresponding
    // to the REGISTRY_CONTRACT's "Input" tag
    for (let tagsArray of listingsTags) {
      const inputIndex = tagsArray.findIndex((tag) => tag.name === "Input");

      if (inputIndex !== -1) {
        const tribus_id = JSON.parse(tagsArray[inputIndex]["value"]).tribus_id;
        listedTribus.push(tribus_id);
      }
    }

    const unlistedTribusIds = listedTribus.filter(
      (id) => !createdTribusIds.includes(id)
    );
    return unlistedTribusIds;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
    process.exit(1);
  }
}
