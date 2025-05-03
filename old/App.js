let provider, signer, contract;

const CONTRACT_ADDRESS = "";
const ABI = [];
import PWmD from "./artifacts/contracts/PwMD.sol/ERC721.json"

async function connectWallet() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
		await window.ethereum.request({
			method: "eth_requestAccounts"
		})

        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        alert("Wallet connected!");
    } else {
        alert("Install MetaMask");
    }
}

async function mint() {
    if (!contract) {
        alert("Press 'Connect Wallet' First!");
        return;
    }
    const tx = await contract.mint(await signer.getAddress(), { value: 0 });
    await tx.wait();
    alert("Minted!");
}

async function storePassword() {
    const tokenId = document.getElementById("tokenId").value;
    const url = ethers.utils.formatBytes32String(document.getElementById("url").value);
    const username = ethers.utils.formatBytes32String(document.getElementById("username").value);
    const password = ethers.utils.toUtf8Bytes(document.getElementById("password").value);

    const emptyPasswordHash = ethers.constants.HashZero;

    const tx = await contract.storePassword(tokenId, emptyPasswordHash, url, username, password);
    await tx.wait();
    alert("Stored!");
}


async function getPassword() {
    const tokenId = document.getElementById("get_tokenId").value;
    const url = ethers.utils.formatBytes32String(document.getElementById("get_url").value);
    const username = ethers.utils.formatBytes32String(document.getElementById("get_username").value);

    const emptyPasswordHash = ethers.constants.HashZero;

    try {
        const result = await contract.getPassword(tokenId, emptyPasswordHash, url, username);
        document.getElementById("get_result").innerText = "Password: " + ethers.utils.toUtf8String(result);
    } catch (err) {
        console.error(err);
        document.getElementById("get_result").innerText = "Password not found or unauthorized.";
    }
}

