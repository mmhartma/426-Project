# Password Manager, Distributed (PWmD)

Writeup: https://docs.google.com/document/d/1lC1aXTUgoB7zwYCiazCo7pRCKT__fCV9PVHPbxPWtPU/edit?usp=sharing

## To Deploy:

1. npx hardhat compile

2. npx hardhat node

3. Open a new console

4. In the root directory of the project: npx hardhat ignition deploy ./ignition/modules/PwMD.js --network localhost

5. Copy the address under "Deployed Address", paste in src/App.js "CONTRACT_ADDRESS"

6. npm start