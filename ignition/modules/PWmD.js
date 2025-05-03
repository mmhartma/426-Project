const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PwMD", (m) => {
  const PWmD = m.contract("ERC721", [
    "Password Manager, Distributed",
    "PWmD",
    500,
    40
  ])

  return { PWmD };
});