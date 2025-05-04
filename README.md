# Password Manager, Distributed (PWmD)

Writeup: https://docs.google.com/document/d/1lC1aXTUgoB7zwYCiazCo7pRCKT__fCV9PVHPbxPWtPU/edit?usp=sharing

## To Deploy:

1. npx hardhat compile

2. npx hardhat node

3. Open a new console

4. In the root directory of the project: npx hardhat ignition deploy ./ignition/modules/PwMD.js --network localhost

5. Copy the address under "Deployed Address", paste in src/App.js "CONTRACT_ADDRESS"

6. npm start







report: 
This Solidity smart contract implements the ERC-721 standard so that we can create, move, and monitor the other NFTs. Also, provides the On-chain password locker. NFT holders can add, view, modify, or delete encrypted passwords tied to any website URL and username. Each password is secured by a key derived from the token’s ID, the URL and the username via keccak256. OnlyOwner guard guarantee that only token owner can manage the password. Encrypted data and initialization vectors are stored in a map to keep the cost of gas fee low. Transfer, Approval, ApprovalForALL, these are the standard events that runs automatically so marketplaces and indexers can track activity. Minting works at a set price and supply cap to keep tokens rare and tokenomics predictable. To emphasize the security, zero-address transfers and unauthorized calls are rejected. By dividing responsibilities and minizing the On-chain storage, this design opens the road for a simple, efficient decentralized identity and credential system. 

Tech Stack Summary:
-	Solidity 0.8.20 compiler
-	Hardhat framework
-	Ethereum Virtual machine 
-	Keccak256: hashing for key derivation
-	ON-chain mapping structure for encrypted data and IV storage
-	Standard ERC165/IERC721 interfaces

Key Feature:
-	ERC721 minting, balance tracking, ownership transfer
-	onlyOwner modifier for robust access control
-	On-chain storage of encrypted credentials
-	Collision-resistant key derivation via keccak256()
-	Emission of standard NFT events for off-chain indexing
