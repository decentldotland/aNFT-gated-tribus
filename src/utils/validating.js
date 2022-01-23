import { getGatedNfts, getTribuses } from "../api.js";
import { _validateAddress, readRegistryContract } from "./arweave/arweave.js";
import { readContract } from "smartweave";

export async function isRegisteredNft(nft_id) {
  try {
    _validateAddress(nft_id);
    const nfts = await getGatedNfts();

    if (!nfts.includes(nft_id)) {
      return false;
    }

    return true;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
    return;
  }
}

export async function isTribus(tribus_id) {
  try {
    _validateAddress(tribus_id);
    const tribuses = (await readRegistryContract()).created_tribuses;

    if (tribuses.includes(tribus_id)) {
      return true;
    }

    return false;
  } catch (error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function isTribusMember({tribus_id, caller_address} = {}) {
  try {

    _validateAddress(caller_address);

    if (! (await isTribus(tribus_id))) {
      throw new Error(`invalid Tribus id: ${tribus_id}`)
    }

    const nft_of_tribus = (await readContract(arweave, tribus_id)).nft_id;
    const nft_state = await readContract(arweave)
  } catch(error) {
    console.log(`${error.name} : ${error.description}`);
  }
}

export async function validateContentStructure(content_object) {
  const isObject = data_type(content_object) === "[object Object]";
  const hasContent =
    content_object.content &&
    data_type(content_object.content) === "[object String]";
  const hasMediaArray =
    content_object.media &&
    data_type(content_object.media) === "[object Array]";
  const hasOnlyContentAndMedia = Object.keys(content_object).length === 2;
  const isEmptyPost =
    content_object?.content?.length + content_object?.media?.length === 0;

  if (
    isObject &&
    hasContent &&
    hasMediaArray &&
    hasOnlyContentAndMedia &&
    !isEmptyPost
  ) {
    return true;
  }

  return false;
}


// HELPER FUNCTIONS
export function data_type(data) {
  return Object.prototype.toString.call(data);
}