## Accepting NFT Source
This protocol support the NFTs on the Arweave network (atomic NFTs), however, NFT developers wishing to get their NFT's source code integrated in the protocol (whitelisted) must meet the following criterias:

### nft.json

The NFT state or saying `nft.json` must have a `balances` property and its value's type should be Object. Wallets balances are mapped inside the `balances` as key-value pairs of `address : balance` :

```json
{
	"some-specific-nft-state" : "dummy-data",
	"balances": {
		"ARWEAVE-WALLET-ADDRESS": 10,
		"POSSIBLE-OTHER-ADDRESS": 1
	}
}
```

### nft.js

The NFT's source code (the NFT's code/contract) should have the `transfer` function allowing balances fractionation. In other words, the NFT SWC must have the functionality of having multiple `address` in the `state.balances` object (allowing fractionation ownership).

Check a source code template [here](https://viewblock.io/arweave/address/rz40SNk40ogKIzKX7HySOhMNP7514-AsckpyGMDu2k0?tab=code)(**use it for testing & experimental purposes only**).

## How it Works

## NFT whitelisting

If an NFT source code is not already whitelisted and meets the protocol's criterias, it can be whitelisted after code reviews.

## Tribus membership

The Tribus membership is mesured by the existence of an address in the `state.balances` object of the NFT of an Tribus. Any positive amount (integer or float greater than 0) is considered as a valid membership. However, only the wallet address with the highest balance is considered as the "owner" of the Tribus and can update Tribus metadata like `name` & `description` .

## Fractionized Ownership

The tribus is an NFT wrapper with SoFi functionalities. The fractionized ownership model is adopted to allow the creation of a community around a single NFT instead of a collection. This feature boost the utilities of an Atomic NFT. It facilitates the creation of a DAO and a token-gated social feed from a single NFT.