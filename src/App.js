import React, { useState, useEffect } from "react";
import "./App.css";
import {
  ethers,
  BrowserProvider,
  Contract,
  JsonRpcProvider
} from "ethers";
import ERC721_ABI from "./abis/ERC721.json";
import { RPC_URL, ERC721_ADDR as CONTRACT_ADDRESS } from "./config";

function App() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [account, setAccount] = useState("");
  const [name, setName]       = useState("");
  const [symbol, setSymbol]   = useState("");

  const [tokenId, setTokenId]               = useState("");
  const [masterKey, setMasterKey]           = useState("");
  const [url, setUrl]                       = useState("");
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [retrievedPassword, setRetrievedPassword] = useState("");

  // ─── Read‐only: fetch name & symbol on mount ────────────────────────────────
  useEffect(() => {
    const readProvider = new JsonRpcProvider(RPC_URL);
    const readContract = new Contract(
      CONTRACT_ADDRESS,
      ERC721_ABI.abi,
      readProvider
    );

    readContract
      .name()
      .then((n) => setName(n))
      .catch((e) => console.error("Fetch name failed:", e));

    readContract
      .symbol()
      .then((s) => setSymbol(s))
      .catch((e) => console.error("Fetch symbol failed:", e));
  }, []);

  // ─── Helper: write‐capable contract instance ────────────────────────────────
  const getWriteContract = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    const provider = new BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();
    return new Contract(
      CONTRACT_ADDRESS,
      ERC721_ABI.abi,
      signer
    );
  };

  // ─── Helper: import raw AES‐CBC key ─────────────────────────────────────────
  const importCryptoKey = async (raw) =>
    await window.crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );

  // ─── Connect Wallet ─────────────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install it.");
      return;
    }
    try {
      const [addr] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(addr);
    } catch (e) {
      console.error("Wallet connection failed:", e);
      alert("Failed to connect wallet.");
    }
  };

  // ─── Mint NFT ───────────────────────────────────────────────────────────────
  const mint = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const mintPrice = ethers.parseEther("0.01"); // match your deploy price
      const tx = await contract.mint(account, { value: mintPrice });
      await tx.wait();
      alert("Mint successful!");
    } catch (e) {
      console.error("Mint failed:", e);
      alert("Mint transaction failed.");
    }
  };

  // ─── Store Password (Create) ───────────────────────────────────────────────
  const storePassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token     = parseInt(tokenId);
      const keyHash   = ethers.id(masterKey);
      const url32     = ethers.formatBytes32String(url);
      const user32    = ethers.formatBytes32String(username);

      // encrypt
      const plainBytes = new TextEncoder().encode(password);
      const ivBytes    = window.crypto.getRandomValues(new Uint8Array(16));
      const aesKey     = await importCryptoKey(
        new TextEncoder().encode(masterKey)
      );
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: ivBytes },
        aesKey,
        plainBytes
      );
      const encryptedHex = ethers.hexlify(new Uint8Array(encryptedBuffer));
      const ivHex        = ethers.hexlify(ivBytes);

      const tx = await contract.storePassword(
        token,
        keyHash,
        url32,
        user32,
        encryptedHex,
        ivHex
      );
      await tx.wait();
      alert("Password stored successfully!");
    } catch (e) {
      console.error("Store failed:", e);
      alert("Failed to store password.");
    }
  };

  // ─── Retrieve Password (Read) ──────────────────────────────────────────────
  const getPassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token     = parseInt(tokenId);
      const keyHash   = ethers.id(masterKey);
      const url32     = ethers.formatBytes32String(url);
      const user32    = ethers.formatBytes32String(username);

      const [encryptedHex, ivHex] = await contract.getPassword(
        token,
        keyHash,
        url32,
        user32
      );
      const encryptedBytes = ethers.getBytes(encryptedHex);
      const ivBytes        = ethers.getBytes(ivHex);

      const aesKey = await importCryptoKey(
        new TextEncoder().encode(masterKey)
      );
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-CBC", iv: ivBytes },
        aesKey,
        encryptedBytes
      );
      const plain = new TextDecoder().decode(decryptedBuffer);
      setRetrievedPassword(plain);
    } catch (e) {
      console.error("Retrieve failed:", e);
      alert("Failed to retrieve password.");
    }
  };

  // ─── Update Password (Update) ──────────────────────────────────────────────
  const updatePassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token     = parseInt(tokenId);
      const keyHash   = ethers.id(masterKey);
      const url32     = ethers.formatBytes32String(url);
      const user32    = ethers.formatBytes32String(username);

      const newBytes  = new TextEncoder().encode(newPassword);
      const ivBytes   = window.crypto.getRandomValues(new Uint8Array(16));
      const aesKey    = await importCryptoKey(
        new TextEncoder().encode(masterKey)
      );
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: ivBytes },
        aesKey,
        newBytes
      );
      const encryptedHex = ethers.hexlify(new Uint8Array(encryptedBuffer));
      const ivHex        = ethers.hexlify(ivBytes);

      const tx = await contract.updatePassword(
        token,
        keyHash,
        url32,
        user32,
        encryptedHex,
        ivHex
      );
      await tx.wait();
      alert("Password updated successfully!");
    } catch (e) {
      console.error("Update failed:", e);
      alert("Failed to update password.");
    }
  };

  // ─── Delete Password (Delete) ──────────────────────────────────────────────
  const deletePassword = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = await getWriteContract();
      const token   = parseInt(tokenId);
      const keyHash = ethers.id(masterKey);
      const url32   = ethers.formatBytes32String(url);
      const user32  = ethers.formatBytes32String(username);

      const tx = await contract.deletePassword(
        token,
        keyHash,
        url32,
        user32
      );
      await tx.wait();
      alert("Password deleted successfully!");
      setRetrievedPassword("");
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete password.");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="App" style={{ padding: 20, color: "#fff" }}>
      <h1>ERC721 Demo</h1>
      <p><strong>Account:</strong> {account || "Not connected"}</p>
      <p><strong>Name:</strong>    {name    || "-"}</p>
      <p><strong>Symbol:</strong>  {symbol  || "-"}</p>

      <button onClick={connectWallet} style={{ margin: 5 }}>
        Connect Wallet
      </button>
      <button onClick={mint} style={{ margin: 5 }}>
        Mint NFT
      </button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Store Password</h2>
      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <input
        placeholder="Master Key"
        type="password"
        value={masterKey}
        onChange={(e) => setMasterKey(e.target.value)}
      />
      <input
        placeholder="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={storePassword} style={{ margin: 5 }}>
        Store
      </button>

      <h2>Retrieve Password</h2>
      <button onClick={getPassword} style={{ margin: 5 }}>
        Get
      </button>
      <p><strong>Decrypted:</strong> {retrievedPassword}</p>

      <h2>Update Password</h2>
      <input
        placeholder="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={updatePassword} style={{ margin: 5 }}>
        Update
      </button>

      <h2>Delete Password</h2>
      <button onClick={deletePassword} style={{ margin: 5 }}>
        Delete
      </button>
    </div>
  );
}

export default App;
