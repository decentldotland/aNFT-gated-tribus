
<p align="center">
  <a href="https://decent.land">
    <img src="./src/img/logo25.png" height="124">
  </a>
  <h3 align="center"><code>@decentdotland/aNFT-gated-tribus</code></h3>
  <p align="center">a protocol for NFT-gated communities</p>
</p>


## Synopsis
This protocol allow the existence of communities on Arweave network, gated by aNFTs. Having a portion of the NFT's balance, whitelist the entry in the tribus.

## Getting Started

### Prerequisites

- Arweave wallet

The [Arweave wallet](https://arconnect.io) is required to interact with the protocol (mint NFTs, transact, interact, etc.). Reading state does not require a wallet.

### Installation

```sh
npm install -g anft-gated-tribus

```

## Contracts
The protocol consists of a registry contract, and instances of Tribus smart contracts.

### Registry Contract
This [contract](./protocol-contracts/registry) is used as registration and validation layer for the created tribuses. It ensures the inheritance of the created tribus from the main [source-code](./protocol-contracts/tribus/tribus.js) and seals each NFT ID per a single Tribus - hierarchical model.

### Tribus Contract
All of the deployed tribuses are instances of the main [Tribus contract](./protocol-contracts/tribus). Therefore, all the separated social feeds have the same computational logic and limitations.

### Contracts API
This [contract](./protocol-contracts/contracts-api) is used as an onchain-permanent API, or a proxy for the deployed tribuses to read data like accpeted MIME types and setting thumbnails for tribuses.

## Usage

### Load The Created Tribuses IDs

```js
import { getTribuses } from "anft-gated-tribus"

async function createdFeeds() {
	const tribuses_ids = await getTribuses();

	return tribuses_ids;
}

```

More examples can be found [here](./docs/examples).

## Supported NFTs Source Codes
| Network   |  Source Codes  | 
| :-----------: | :-----------: | 
| [Koii](https://koi.rocks/)    | 2             |

## Contributing

If you have a suggestion that would make this protocol or the API better, please fork the repository and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/xyz`)
3. Commit your Changes (`git commit -m 'feat: abc-xyz'`)
4. Push to the Branch (`git push origin feature/xyz`)
5. Open a Pull Request

Contributions are **greatly appreciated** !
## License
This protocol is licensed under the [MIT license](./LICENSE).
