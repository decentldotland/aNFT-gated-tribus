export async function handle(state, action) {
  const caller = action.caller;
  const input = action.input;

  // state
  const created_tribuses = state.created_tribuses;
  const sources = state.sources;
  const factory_source_code = state.TRIBUS_SRC;
  //Errors
  const ERROR_INVALID_PRIMITIVE_TYPE = "the function has been supplied by a wrong input type";
  const ERROR_INVALID_ARWEAVE_ADDRESS = "the given address is invalid";
  const ERROR_TRIBUS_ALREADY_EXISTED = "a tribus for the given aNFT has been activated by someone else";
  const ERROR_MISSING_REQUIRED_TAG = "the transaction does miss a required tag";
  const ERROR_INVALID_TAG_VALUE = "the tag has an unexpected value";
  const ERROR_NFT_NOT_MATCHING = "listing nft and tribus nft are not matching";
  const ERROR_NFT_ID_INVALID = "the given nft id is not an aNFT";

  if (input.function === "list") {
    const tribus_id = input.tribus_id;
    const { nft_id, tribus_name, tribus_description } = await _validateTribusId(
      tribus_id
    );
    // check if the NFT's source code is whitelisted
    await _validateNftSource(nft_id);
    // check for nft_id duplication registering attempt
    await _validateRegisteringAttempt(nft_id);

    created_tribuses.push({
      tribus_id: tribus_id,
      nft_id: nft_id,
      tribus_name: tribus_name,
    });

    return { state };
  }

  // ADMIN FUNCTIONS
  if (input.function === "whitelistSrc") {
    const src = input.src;
    const name = input.name;

    if (caller !== SmartWeave.contract.owner) {
      throw new ContractError(ERROR_INVALID_CALLER);
    }

    _validateArweaveAddress(src);

    if (!sources[name]) {
      sources[name] = []
    }

    sources[name].push(src)

    return { state };
  }

  // HELPER FUNCTIONS
  function _validateArweaveAddress(address) {
    if (typeof address !== "string") {
      throw new ContractError(ERROR_INVALID_PRIMITIVE_TYPE);
    }

    const validity = /[a-z0-9_-]{43}/i.test(address);

    if (!validity) {
      throw new ContractError(ERROR_INVALID_ARWEAVE_ADDRESS);
    }
  }

  function _validateRegisteringAttempt(nft_id, tribus_id) {
    const nft_existence = created_tribuses.find((tribus) => tribus["nft_id"] === nft_id);
    const tribus_existence = created_tribuses.find((tribus) => tribus["tribus_id"] === tribus_id);

    if (nft_existence || tribus_existence) {
      throw new ContractError(ERROR_TRIBUS_ALREADY_EXISTED);
    }
  }

  async function _validateNftSource(nft_id) {
    _validateArweaveAddress(nft_id);
    const tagsMap = new Map();

    const tx = await SmartWeave.unsafeClient.transactions.get(nft_id);
    const tags = tx.get("tags");

    for (let tag of tags) {
      const key = tag.get("name", { decode: true, string: true });
      const value = tag.get("value", { decode: true, string: true });
      tagsMap.set(key, value);
    }

    if (
      !tagsMap.has("Init-State") ||
      !tagsMap.has("Contract-Src") ||
      !tagsMap.has("App-Name")
    ) {
      throw new ContractError(ERROR_MISSING_REQUIRED_TAG);
    }

    const appName = tagsMap.get("App-Name");
    const src = tagsMap.get("Contract-Src");

    const sources_src = _getWhitelistedSources();

    if (appName !== "SmartWeaveContract" || !sources_src.includes(src)) {
      throw new ContractError(ERROR_INVALID_TAG_VALUE);
    }

    const nft_state = await SmartWeave.contracts.readContractState(nft_id);

    if (!nft_state || !nft_state.balances) {
      throw new ContractError(ERROR_NFT_ID_INVALID);
    }
  }

  function _getWhitelistedSources() {
    const sources_object = state.sources;
    const src_array = [];

    for (let source in sources) {
      src_array.push(sources[source]);
    }

    return src_array.flat();
  }

  async function _validateTribusId(tribus_id) {
    _validateArweaveAddress(tribus_id);
    const tagsMap = new Map();

    const tx = await SmartWeave.unsafeClient.transactions.get(tribus_id);
    const tags = tx.get("tags");

    for (let tag of tags) {
      const key = tag.get("name", { decode: true, string: true });
      const value = tag.get("value", { decode: true, string: true });
      tagsMap.set(key, value);
    }

    if (!tagsMap.has("Contract-Src") || !tagsMap.has("App-Name")) {
      throw new ContractError(ERROR_MISSING_REQUIRED_TAG);
    }

    const appName = tagsMap.get("App-Name");
    const src = tagsMap.get("Contract-Src");

    if (appName !== "SmartWeaveContract" || src !== factory_source_code) {
      throw new ContractError(ERROR_INVALID_TAG_VALUE);
    }

    const contractState = await SmartWeave.contracts.readContractState(
      tribus_id
    );

    const nftInState = contractState?.nft_id;
    const tribusName = contractState?.name;
    const tribusDescription = contractState?.description;
    const tribusFeed = contractState?.feed;

    if (!nftInState || !tribusName || !tribusDescription || !tribusFeed) {
      throw new ContractError(ERROR_NFT_NOT_MATCHING);
    }

    return {
      nft_id: nftInState,
      tribus_name: tribusName,
      tribus_description: tribusDescription,
    };
  }
}
