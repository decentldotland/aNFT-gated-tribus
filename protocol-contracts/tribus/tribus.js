export async function handle(state, action) {
  const caller = action.caller;
  const input = action.input;

  const name = state.name;
  const description = state.description;
  const nft_id = state.nft_id;
  
  const API_ID = "z1J-k77bSz4IrnreKKLc1ZwBCVTcn7AUc5YQNAm61QU";

  const ERROR_INVALID_STRING_LENGTH =
    "the input or not a valid string or a string with length unacceptable";
  const ERROR_INVALID_ARWEAVE_ADDRESS_TRANSACTION = "invalid Arweave address";
  const ERROR_NOT_VALID_OWNER = "not an NFT shareholder";
  const ERROR_POST_NOT_FOUND = "the given TXID is not a post in this tribus";
  const ERROR_TRIBUS_NOT_ACTIVATED =
    "Tribus has not been activated yet by the NFT owners";
  const ERROR_INVALID_POST_CONTENT_TYPE = "the post has an invalid MIME type";
  const ERROR_INVALID_TAG = "invalid TX tag has been seeded";
  const ERROR_NOT_TOP_HOLDER = "only the top holder can execute this function";
  const ERROR_CONTENT_TYPE_MISSING = "the nft_id miss the Content-Type tag";
  const ERROR_MIME_TYPE = "the NFT content-type is not supported";

  if (input.function === "post") {
    // validate NFT's fractionized ownership by the caller
    await _isTribusMember(caller, nft_id);
    // transaction's tags
    const tags = await SmartWeave.transaction.tags;

    //smartweave protocol's tags
    _checkTagValidity(tags, "App-Name", "SmartWeaveAction");
    _checkTagValidity(tags, "App-Version", "0.3.0");
    // content MIME type
    _checkTagValidity(tags, "Content-Type", "application/json");
    // DecentLand protocol tags
    _checkTagValidity(tags, "Protocol-Name", "DecentLand");
    _checkTagValidity(tags, "Protocol-Tribus-Type", "aNFT-Gated");
    _checkTagValidity(tags, "Protocol-Action", "post");
    _checkTagValidity(tags, "Tribus-ID", SmartWeave.contract.id);

    const txid = SmartWeave.transaction.id;

    state["feed"].push({
      sender: caller,
      pid: txid,
      timestamp: SmartWeave.block.timestamp,
      replies: [],
    });
    return { state };
  }

  if (input.function === "reply") {
    // post ID (equivalent to an Arweave TXID)
    const post_id = input.post_id;

    await _isTribusMember(caller, nft_id);
    _validateAddressOrTransactions(post_id);
    // retrieve the post index & throws an error if the postID is not found
    const postIndex = _getPostIndex(post_id);
    const tags = await SmartWeave.transaction.tags;
    const txid = SmartWeave.transaction.id;

    //smartweave protocol's tags
    _checkTagValidity(tags, "App-Name", "SmartWeaveAction");
    _checkTagValidity(tags, "App-Version", "0.3.0");
    // content MIME type
    _checkTagValidity(tags, "Content-Type", "application/json");
    // DecentLand protocol tags
    _checkTagValidity(tags, "Protocol-Name", "DecentLand");
    _checkTagValidity(tags, "Protocol-Tribus-Type", "aNFT-Gated");
    _checkTagValidity(tags, "Protocol-Action", "reply");
    _checkTagValidity(tags, "reply-reference", post_id);
    _checkTagValidity(tags, "Tribus-ID", SmartWeave.contract.id);

    const replyObject = {
      sender: caller,
      rid: txid,
      childOf: post_id,
      timestamp: SmartWeave.block.timestamp,
    };

    state["feed"][postIndex]["replies"].push(replyObject);

    return { state };
  }
  
  if (input.function === "update_tribus") {
  const name = input?.name;
  const description = input?.description;
  const thumbnail = input?.thumbnail;

  await _isTribusMember(caller, nft_id);

  const nft_balances_object = (
    await SmartWeave.contracts.readContractState(nft_id)
  ).balances;
  const nft_balances_array = [];

  for (let address in nft_balances_object) {
    const balance = nft_balances_object[address];
    nft_balances_array.push({ address: address, balance: balance });
  }

  const sorted_balances = nft_balances_array.sort(
    (a, b) => b.balance - a.balance
  );
  const caller_index_in_sorted = sorted_balances.findIndex(
    (user) => user.address === caller
  );

  if (caller_index_in_sorted !== 0) {
    throw new ContractError(ERROR_NOT_TOP_HOLDER);
  }

  if (name) {
    state.name = name;
  }

  if (description) {
    state.description = description;
  }
    
  if (thumbnail) {
    await _setThumbnail(nft_id);
  }

  return { state };
}

  function _validateStringTypeLen(str, minLen, maxLen) {
    if (typeof str !== "string") {
      throw new ContractError(ERROR_INVALID_PRIMITIVE_TYPE);
    }

    if (str.length < minLen || str.length > maxLen) {
      throw new ContractError(ERROR_INVALID_STRING_LENGTH);
    }
  }

  function _validateAddressOrTransactions(str) {
    _validateStringTypeLen(str, 43, 43);

    const validity = /[a-z0-9_-]{43}/i.test(str);
    if (!validity) {
      throw new ContractError(ERROR_INVALID_ARWEAVE_ADDRESS_TRANSACTION);
    }
  }

  async function _isTribusMember(address, nft_id) {
    _validateAddressOrTransactions(address);

    const nftState = await SmartWeave.contracts.readContractState(nft_id);
    const balances = nftState?.balances;

    if (!balances || !balances[address] || balances[address] <= 0) {
      throw new ContractError(ERROR_NOT_VALID_OWNER);
    }
  }

  function _checkTagValidity(tagsArray, key, value) {
    if (!tagsArray.find(tag => (tag["name"] === key && tag["value"] === value))) {
      throw new ContractError(ERROR_INVALID_TAG);
    }
  }

  function _getPostIndex(post_id) {
    const index = state["feed"].findIndex((post) => post.pid === post_id);

    if (index === -1) {
      throw new ContractError(ERROR_POST_NOT_FOUND);
    }

    return index;
  }
  
  async function _setThumbnail(nft_id) {
  const tagsMap = new Map();

  const tx_object = await SmartWeave.unsafeClient.transactions.get(nft_id);
  const tags = tx_object.get("tags");

  for (let tag of tags) {
    const name = tag.get("name", { decode: true, string: true });
    const value = tag.get("value", { decode: true, string: true });

    tagsMap.set(name, value);
  }

  if (!tagsMap.has("Content-Type")) {
    throw new ContractError(ERROR_CONTENT_TYPE_MISSING);
  }

  const nft_content_type = tagsMap.get("Content-Type");
  const api_state = await SmartWeave.contracts.readContractState(API_ID);
  const api_thumbnail = api_state.thumbnail;
  const api_supported_mimes = api_state.mime_types;

  if (!api_supported_mimes.includes(nft_content_type)) {
    throw new ContractError(ERROR_MIME_TYPE);
  }

  if (nft_content_type.startsWith("image/")) {
    state.thumbnail = nft_id;

    return { state };
  }

  state.thumbnail = api_thumbnail;

  return { state };
}

}
