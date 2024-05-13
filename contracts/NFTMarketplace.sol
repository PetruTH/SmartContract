//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";


contract NFT_Worker {
    function getContractName() virtual public pure returns (string memory) {}

    function ownerAlert() internal pure returns (string memory) {
        return "Only owner can call this function";
    }

    function priceValidator() internal pure returns (string memory) {
        return "Hopefully sending the correct price";
    }

    function signValidator() internal pure returns (string memory) {
        return "Make sure the price isn't negative";
    }

    function ensureFundsAlert() internal pure returns (string memory){
        return "Please submit the asking price in order to complete the purchase";
    }

}


contract USD_transformer {

    AggregatorV3Interface internal priceFeed;

    constructor() {
        priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

    function get_ETH_in_USD() external view returns (int) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price / (10**8);
    }
}

contract NFTMarketplace is ERC721URIStorage, NFT_Worker {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    address payable owner;
    uint256 listPrice = 0.01 ether;
    USD_transformer private transformer;
   mapping (address => uint) pendingWithdrawals;


    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }

    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    mapping(uint256 => ListedToken) private idToListedToken;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
        transformer = new USD_transformer();
    }

    modifier onlyOwner() {
        string memory alert = ownerAlert();
        require(msg.sender == owner, alert);
        _;
    }

    function getETHfeeUSD() external view returns (int){
        return transformer.get_ETH_in_USD();
    }

    function getListPrice() external view returns (uint256) {
        return listPrice;
    }

    function getContractName() virtual public pure override returns (string memory){ 
        string memory string_to_return = "NFTMarketplace";

        return string_to_return;
    }

    function getLatestIdToListedToken() external view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) external view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    function createToken(string memory tokenURI, uint256 price) external payable returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);

        _setTokenURI(newTokenId, tokenURI);

        createListedToken(newTokenId, price);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        string memory priceVal = priceValidator();
        string memory signVal = signValidator();

        require(msg.value == listPrice, priceVal);
        require(price > 0, signVal);

        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true
        );

        _transfer(msg.sender, address(this), tokenId);
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }
    
    function getAllNFTs() external view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        uint currentId;
        for(uint i=0; i<nftCount; i++)
        {
            currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }
        return tokens;
    }
    
    function getMyNFTs() external view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;
        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender){
                itemCount += 1;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i=0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function executeSale(uint256 tokenId) external payable {
        uint price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;

        string memory ensureFund = ensureFundsAlert();
        require(msg.value == price, ensureFund);

        idToListedToken[tokenId].currentlyListed = true;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        _transfer(address(this), msg.sender, tokenId);
        approve(address(this), tokenId);

        payable(owner).transfer(listPrice);
        payable(seller).transfer(msg.value);
    }

    mapping(uint256 => string) private _tokenURIs;

}