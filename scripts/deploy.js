const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ERC721 = await ethers.getContractFactory("ERC721");

  const name      = "MySecureNFT";
  const symbol    = "MSN";
  const mintPrice = ethers.parseEther("0.01");
  const maxSupply = 1000;

  const nft = await ERC721.deploy(name, symbol, mintPrice, maxSupply);


  await nft.waitForDeployment();

  console.log("✅ ERC721 deployed to:", nft.target);

}

main().catch(err => {
  console.error(err);
  process.exit(1);
});