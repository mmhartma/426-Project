import logo from './logo.svg';
import './App.css';

import { useState, useEffect } from "react"
import { BrowserProvider, Contract } from "ethers"
import PWmD from "./artifacts/contracts/PwMD.sol/ERC721.json"

/* To get address (from project root directory):
npx hardhat ignition deploy ./ignition/modules/PwMD.js --network localhost

Take address printed, paste here
*/
let CONTRACT_ADDRESS = "CONTRACT_ADDRESS"

const getContractInfo = async() => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, PWmD.abi, signer);

    return {provider, signer, contract}

  } catch(error) {
    console.error(error)
  }
}


function App() {
  const [address, setAddress ] = useState('')

  // Find address if already connected
  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      // MetaMask is connected
      const selectedAddress = window.ethereum.selectedAddress;
    }
  }, []);

  const connect = async () => {
    try {
      if (!window.ethereum) { 
        console.error('Install MetaMask before use');
        return
      }
  
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      
      setAddress(accounts[0]); // Take the first
      

    } catch(error) {
      console.error(error)
    }
  }

  const mint = async () => {
    try {
      if (!address) {
        console.error("Connect to MetaMask before use")
        return
      }

      const { signer, provider, contract } = await getContractInfo()
  
      //TODO: make sure this costs YODA coin as specified in handout
      const tx = await contract.mint(await signer.getAddress(), { value: 0 });
      await tx.wait();

      // TODO: optional: alerts are ok, but could have more friendly prompts using tailwind alerts or something similar
      alert("Minted!");

    } catch(error) {
      console.error(error)
    }
  }

  const storePassword = async() => {
    let input = "" //TODO, grab from input. This will be the 'password' associated to the password
    let enc = new TextEncoder()
    let encoded = enc.encode(input)
    let key = "" //TODO, grab from input. This will be the 'master password'

    let iv = window.crypto.getRandomValues(new Uint8Array(32))

    //https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-cbc
    let encrypted = window.crypto.subtle.encrypt({
      name: "AES-CBC",
      iv: iv
    },
      key,
      encoded
    )

    //TODO: send off to the contract
  }
  const getPassword = async() => {
    // TODO: get encrypted, iv from getPassword contract function
    let encrypted;
    let iv;


    //NOTE: key is 'master password' here again
    let decrypted = window.crypto.subtle.decrypt({
        "name": "AES-CBC",
        iv
      },
      key,
      encrypted
    )
  }
  const updatePassword = async() => {

  }
  const deletePassword = async() => {

  }

  return (
    <div className="App">
      <button className="" onClick={connect}>
        Connect To MetaMask
      </button>
      <button className="" onClick={mint}>
        Mint
      </button>
      {/* 
      //TODO: All 4 CRUD must be implemented. The parameters for each are here:

      storePassword(tokenId, hashed_nft_password, url, username, encryptedPassword)
        - tokenId: user input is ok
        - hashed_nft_password: will be 'master password' (key) input
        - url: user input is ok
        - username: user input is ok
        - encrypted_password: will be 'encrypted' variable
        - iv: will be the 'iv' variable

      getPassword() will be the same parameters from storePassword EXCEPT:
        no encrypted_password
        no iv (its returned here)

      updatePassword() will be the same parameters from storePassword EXCEPT:
        new_pass: renamed 'encrypted_password' variable

      deletePassword() will be the same parameters from storePassword EXCEPT:
        no encrypted_password
        no iv

      */}
    </div>
  );
}

export default App;
