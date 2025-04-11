// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC165 {
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}

interface IERC721 is IERC165 {
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(
        address from, 
        address to, 
        uint256 tokenId, 
        bytes calldata data
    ) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from, 
        uint256 tokenId, 
        bytes calldata data
    ) external returns (bytes4);
}

contract ERC721 {
    string public name;
    string public symbol;
    uint256 public mint_price;
    uint256 public max_supply;
    uint256 private _nextTokenId;

    mapping(uint256 => address) internal _ownerOf; // Mapping owner address to token count
    mapping(address => uint256[]) private tokenOwnerstoIds;
    mapping(address => uint256) internal _balanceOf; // Mapping from token ID to approved address
    mapping(uint256 => address) internal _approvals; // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    // Hashed by [token][url][username]
    mapping(uint256 => mapping(bytes32 => mapping(bytes32 => bytes32))) private _passwords;
    mapping(uint256 => bytes32) _nft_passwords;

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint256 MINT_PRICE, 
        uint256 MAX_SUPPLY
    ) {
        name = _name;
        symbol = _symbol;
        mint_price = MINT_PRICE;
        max_supply = MAX_SUPPLY;
    }

    event Transfer(
        address indexed from, 
        address indexed to, 
        uint256 indexed id
    );
    event Approval(
        address indexed owner, 
        address indexed spender, 
        uint256 indexed id
    );
    event ApprovalForAll(
        address indexed owner, 
        address indexed operator, 
        bool approved
    );

    function _mint(address to, uint256 id) internal {
        require(to != address(0), "mint to zero address");
        require(_ownerOf[id] == address(0), "already minted");
        _balanceOf[to]++;
        _ownerOf[id] = to;
        emit Transfer(address(0), to, id);
    }

    function mint(address to) public payable {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        tokenOwnerstoIds[to].push(tokenId);

        // initial password will be the token id hashed
        _nft_passwords[tokenId] = bytes32(keccak256(abi.encodePacked(tokenId)));
    }

    function _isApprovedOrOwner(
        address owner, 
        address spender, 
        uint256 id
    ) internal view returns (bool) {
        return (
            spender == owner || 
            isApprovedForAll[owner][spender] || 
            spender == _approvals[id]
        );
    }

    function transferFrom(
        address from, 
        address to, 
        uint256 id
    ) public {
        require(from == _ownerOf[id], "from != owner");
        require(to != address(0), "transfer to zero address");
        require(_isApprovedOrOwner(from, msg.sender, id), "not authorized");
        
        _balanceOf[from]--;
        _balanceOf[to]++;
        _ownerOf[id] = to;
        delete _approvals[id];

        // reset the nft password to the initial password
        _nft_passwords[id] = keccak256(abi.encodePacked(id));

        emit Transfer(from, to, id);
    }

    function ownerOf(uint256 id) external view returns (address owner) {
        owner = _ownerOf[id];
        require(owner != address(0), "token doesn't exist");
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "owner = zero address");
        return _balanceOf[owner];
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function approve(address spender, uint256 id) external {
        address owner = _ownerOf[id];
        require(
            msg.sender == owner || 
            isApprovedForAll[owner][msg.sender], 
            "not authorized"
        );
        _approvals[id] = spender;
        emit Approval(owner, spender, id);
    }

    modifier onlyOwner(uint256 id, bytes32 hashed_nft_password) {
        require(_ownerOf[id] == msg.sender, "Only owner can use this");
        require(_nft_passwords[id] == hashed_nft_password, "Invalid master password");
        _;
    }

    // Create
    function storePassword(
        uint256 tokenId, 
        bytes32 hashed_nft_password,

        bytes32 url,
        bytes32 username,
        bytes32 hashed_password
    ) onlyOwner(tokenId, hashed_nft_password) public {
        _passwords[tokenId][url][username] = hashed_password;
    }

    // Read
    function getPassword(
        uint256 tokenId, 
        bytes32 hashed_nft_password, 
        bytes32 url, 
        bytes32 username
    ) onlyOwner(tokenId, hashed_nft_password) public view returns (bytes32) {
        require(_passwords[tokenId][url][username] != bytes32(0), "Password does not exist");

        return _passwords[tokenId][url][username];
    }

    // Update
    function updatePassword(
        uint256 tokenId, 
        bytes32 hashed_nft_password, 
        bytes32 url, 
        bytes32 username, 
        bytes32 hashed_new_password
    ) onlyOwner(tokenId, hashed_nft_password) public {
        _passwords[tokenId][url][username] = hashed_new_password;
    }
 
    // Delete
    function deletePassword(
        uint256 tokenId, 
        bytes32 hashed_nft_password, 
        bytes32 url, 
        bytes32 username
    ) onlyOwner(tokenId, hashed_nft_password) public {
        delete _passwords[tokenId][url][username];
    }

    function changeMasterPassword(
        uint256 tokenId, 
        bytes32 hashed_nft_password, 
        bytes32 newHash
    ) onlyOwner(tokenId, hashed_nft_password) public {
        _nft_passwords[tokenId] = newHash;
    }
}
