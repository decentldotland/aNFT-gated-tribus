export async function handle(state, action) {
  const input = action.input;
  const caller = action.caller;

  const ERROR_NOT_VALID_OWNER =
    "only the contract owner can invoke this function";
  const ERROR_INVALID_VALUE_SUPPLIED =
    "invalid primitive type has been supplied";

  if (input.function === "update_thumbnail") {
    const thumbnail = input.thumbnail;

    if (!(await _isOwner())) {
      throw new ContractError(ERROR_NOT_VALID_OWNER);
    }

    state.thumbnail = thumbnail;

    return { state };
  }

  if (input.function === "add_mime_type") {
    const mime = input.mime;

    if (!(await _isOwner())) {
      throw new ContractError(ERROR_NOT_VALID_OWNER);
    }

    state.mime_types.push(mime);

    return { state };
  }

  if (input.function === "add_state_property") {
    const key = input.key;
    let value = input.value;

    if (!(await _isOwner())) {
      throw new ContractError(ERROR_NOT_VALID_OWNER);
    }
    
    state.key = value;

    return { state };
  }

  async function _isOwner() {
    const ownership = SmartWeave.contract.owner === caller ? true : false;

    return ownership;
  }
}
