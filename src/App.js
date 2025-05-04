import React, { useState, useEffect } from "react";
import "./App.css";
import { ethers, BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import ERC721_ABI from "./abis/ERC721.json";
import { RPC_URL, ERC721_ADDR as CONTRACT_ADDRESS } from "./config";

// Hardhat Local network Chain ID (hex)
const HARDHAT_CHAIN_ID = "0x7A69"; // 31337

function App() {
  // ─── State variables ────────────────────────────────────────────────────────
  const [account, setAccount] = useState("");
  const [name, setName]       = useState("");
  const [symbol, setSymbol]   = useState("");
  const [tokenId, setTokenId] = useState("");
  const [masterKey, setMasterKey]       = useState("");
  const [url, setUrl]                   = useState("");
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [retrievedPassword, setRetrievedPassword] = useState("");

  // ─── On mount: read contract name & symbol ─────────────────────────────────
  useEffect(() => {
    const provider = new JsonRpcProvider(RPC_URL);
    const contract = new Contract(
      CONTRACT_ADDRESS,
      ERC721_ABI.abi,
      provider
    );

    contract.name()
      .then(setName)
      .catch(() => setName("N/A"));

    contract.symbol()
      .then(setSymbol)
      .catch(() => setSymbol("N/A"));
  }, []);

  // ─── Ensure MetaMask is on Hardhat Local network ───────────────────────────
  const ensureHardhatLocal = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current !== HARDHAT_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: HARDHAT_CHAIN_ID,
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  };

  // ─── Create a write-enabled contract instance ──────────────────────────────
  const getWriteContract = async () => {
    await ensureHardhatLocal();
    const provider = new BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();
    return new Contract(
      CONTRACT_ADDRESS,
      ERC721_ABI.abi,
      signer
    );
  };

  // ─── Import AES-CBC key for crypto.subtle ───────────────────────────────────
  const importCryptoKey = async (raw) =>
    window.crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );

  // ─── Connect wallet ─────────────────────────────────────────────────────────
  const connectWallet = async () => {
    try {
      await ensureHardhatLocal();
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(addr);
    } catch (e) {
      console.error("Wallet connection failed:", e);
      alert("Failed to connect wallet.");
    }
  };

  // ─── Mint an NFT ────────────────────────────────────────────────────────────
  const mintNFT = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract  = await getWriteContract();
      const mintPrice = ethers.parseEther("0.01");
      const tx        = await contract.mint(account, { value: mintPrice });
      await tx.wait();
      alert("Mint successful!");
    } catch (e) {
      console.error("Mint failed:", e);
      alert("Mint transaction failed.");
    }
  };

  // ─── Store password (on-chain) ──────────────────────────────────────────────
  const storePassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token   = parseInt(tokenId);
      const keyHash = ethers.id(masterKey);
      const url32   = ethers.encodeBytes32String(url);
      const user32  = ethers.encodeBytes32String(username);

      // encrypt plaintext
      const plainBytes = new TextEncoder().encode(password);
      const ivBytes    = window.crypto.getRandomValues(new Uint8Array(16));
      const aesKey     = await importCryptoKey(new TextEncoder().encode(masterKey));
      const encrypted  = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: ivBytes },
        aesKey,
        plainBytes
      );
      const encryptedHex = ethers.hexlify(new Uint8Array(encrypted));
      const ivHex        = ethers.hexlify(ivBytes);

      const tx = await contract.storePassword(
        token, keyHash, url32, user32, encryptedHex, ivHex
      );
      await tx.wait();
      alert("Password stored successfully!");
    } catch (e) {
      console.error("Store failed:", e);
      alert("Failed to store password.");
    }
  };

  // ─── Retrieve & decrypt password ───────────────────────────────────────────
  const getPassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token    = parseInt(tokenId);
      const keyHash  = ethers.id(masterKey);
      const url32    = ethers.encodeBytes32String(url);
      const user32   = ethers.encodeBytes32String(username);

      const [encHex, ivHex] = await contract.getPassword(token, keyHash, url32, user32);
      const encBytes        = ethers.getBytes(encHex);
      const ivBytes         = ethers.getBytes(ivHex);

      const aesKey = await importCryptoKey(new TextEncoder().encode(masterKey));
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-CBC", iv: ivBytes },
        aesKey,
        encBytes
      );
      setRetrievedPassword(new TextDecoder().decode(decrypted));
    } catch (e) {
      console.error("Retrieve failed:", e);
      alert("Failed to retrieve password.");
    }
  };

  // ─── Update password ───────────────────────────────────────────────────────
  const updatePassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token   = parseInt(tokenId);
      const keyHash = ethers.id(masterKey);
      const url32   = ethers.encodeBytes32String(url);
      const user32  = ethers.encodeBytes32String(username);

      const newBytes = new TextEncoder().encode(newPassword);
      const ivBytes  = window.crypto.getRandomValues(new Uint8Array(16));
      const aesKey   = await importCryptoKey(new TextEncoder().encode(masterKey));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: ivBytes },
        aesKey,
        newBytes
      );
      const encryptedHex = ethers.hexlify(new Uint8Array(encrypted));
      const ivHex        = ethers.hexlify(ivBytes);

      const tx = await contract.updatePassword(
        token, keyHash, url32, user32, encryptedHex, ivHex
      );
      await tx.wait();
      alert("Password updated successfully!");
    } catch (e) {
      console.error("Update failed:", e);
      alert("Failed to update password.");
    }
  };

  // ─── Delete password ───────────────────────────────────────────────────────
  const deletePassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token   = parseInt(tokenId);
      const keyHash = ethers.id(masterKey);
      const url32   = ethers.encodeBytes32String(url);
      const user32  = ethers.encodeBytes32String(username);

      const tx = await contract.deletePassword(token, keyHash, url32, user32);
      await tx.wait();
      setRetrievedPassword("");
      alert("Password deleted successfully!");
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete password.");
    }
  };

  // ─── Render UI ────────────────────────────────────────────────────────────
  return (
    <div className="App">
      <h1>ERC721 Demo (Hardhat Local)</h1>
      <p><strong>Account:</strong> {account || "Not connected"}</p>
      <p><strong>Name:</strong>    {name    || "-"}</p>
      <p><strong>Symbol:</strong>  {symbol  || "-"}</p>
      <button onClick={connectWallet}>Connect Wallet</button>
      <button onClick={mintNFT}>Mint NFT</button>
      <hr />
      <h2>Store Password</h2>
      <input placeholder="Token ID"    value={tokenId}    onChange={e => setTokenId(e.target.value)} />
      <input placeholder="Master Key"  type="password"    value={masterKey}  onChange={e => setMasterKey(e.target.value)} />
      <input placeholder="URL"         value={url}        onChange={e => setUrl(e.target.value)} />
      <input placeholder="Username"    value={username}   onChange={e => setUsername(e.target.value)} />
      <input placeholder="Password"    type="password"    value={password}    onChange={e => setPassword(e.target.value)} />
      <button onClick={storePassword}>Store</button>
      <h2>Retrieve Password</h2>
      <button onClick={getPassword}>Get</button>
      <p><strong>Decrypted:</strong> {retrievedPassword || "-"}</p>
      <h2>Update Password</h2>
      <input placeholder="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      <button onClick={updatePassword}>Update</button>
      <h2>Delete Password</h2>
      <button onClick={deletePassword}>Delete</button>
    </div>
  );
}

export default App;
