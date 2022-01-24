## getting unlisted tribus

The protocol by default make the action of listing a created tribus in the **REGISTRY_CONTRACT** permissionless. In other words, not only the tribus creator can list it, but any wallet address is whitelisted to allow the listing on behalf of anyone.

```js
import { getUnlistedTribus } from "anft-gated-tribus"

async function createdFeeds() {
	const unlisted_tribuses_array = await getUnlistedTribus();

	return unlisted_tribuses_array;
}

```