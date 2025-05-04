# Password Manager, Distributed (PWmD)

Writeup: https://docs.google.com/document/d/1lC1aXTUgoB7zwYCiazCo7pRCKT__fCV9PVHPbxPWtPU/edit?usp=sharing

## To Deploy:

1. npm install

2. npx hardhat compile

3. npx hardhat node

4. Open a new console

5. In the root directory of the project: npx hardhat ignition deploy ./ignition/modules/PwMD.js --network localhost

6. Copy the address under "Deployed Address", paste as value in src/config.js for "ERC721_ADDR"

7. npm start