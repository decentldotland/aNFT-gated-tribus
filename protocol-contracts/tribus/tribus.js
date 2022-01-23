export async function handle(state, action) {
  const caller = action.caller;
  const input = action.input;

  const name = state.name;
  const description = state.description;
  const nft_id = state.nft_id;

  const ERROR_INVALID_STRING_LENGTH =
    "the input or not a valid string or a string with length unacceptable";
  const ERROR_INVALID_ARWEAVE_ADDRESS_TRANSACTION = "invalid Arweave address";
  const ERROR_NOT_VALID_OWNER = "not an NFT shareholder";
  const ERROR_POST_NOT_FOUND = "the given TXID is not a post in this tribus";
  const ERROR_TRIBUS_NOT_ACTIVATED =
    "Tribus has not been activated yet by the NFT owners";
  const ERROR_INVALID_POST_CONTENT_TYPE = "the post has an invalid MIME type";
  const ERROR_INVALID_TAG = "invalid TX tag has been seeded";

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
    _checkTagValidity(tags, "Tribus-ID", state.nft_id);

    const replyObject = {
      sender: caller,
      rid: txid,
      childOf: post_id,
      timestamp: SmartWeave.block.timestamp,
    };

    state["feed"][postIndex]["replies"].push(replyObject);

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
}
