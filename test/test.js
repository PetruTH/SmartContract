const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  it("Contract name dummy test", async function () {
    
    const [deployer] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTMarketplace");
    const contract = await contractFactory.deploy();
    await contract.deployed();

    const tx = await contract.getContractName();
    let isTrue = tx==="NFTMarketplace";

    expect(isTrue).to.equal(true);
  });

  it("Get latest id for token where there are not any token created", async function () {
    
    const [deployer] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTMarketplace");
    const contract = await contractFactory.deploy();
    await contract.deployed();

    const tx = await contract.getLatestIdToListedToken();
    let currently_listed = tx.currentlyListed;
    let owner = tx.owner;
    let seller = tx.seller;
    
    expect(currently_listed).to.equal(false);
    expect(owner).to.equal(seller);
    expect(owner).to.equal("0x0000000000000000000000000000000000000000");
  });

  it("Right after deploy, the list of NFTs should be empty", async function () {
    
    const [deployer] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTMarketplace");
    const contract = await contractFactory.deploy();
    await contract.deployed();

    const tx = await contract.getAllNFTs();
    
    expect(tx.length).to.equal(0);
  });

  it("Create new token end-to-end testing", async function(){
    const [deployer] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("NFTMarketplace");
    const contract = await contractFactory.deploy();
    await contract.deployed();

    //hardcoded data
    const price = ethers.utils.parseUnits('12', 'ether')
    let listingPrice = await contract.getListPrice()
    listingPrice = listingPrice.toString()

    const tx = await contract.createToken("https://gateway.pinata.cloud/ipfs/QmR5PJW8ZRGb61RiqvAnmXLMbr6B6QeGa9VoNQUsgxYdqF", price, { value: listingPrice });
    
    const nfts = await contract.getAllNFTs();
    expect(nfts.length).to.equal(1);

    const last_nft_v1 = await contract.getLatestIdToListedToken();
    const last_nft_v2 = await contract.getListedTokenForId(1);

    expect(last_nft_v1.tokenId).to.equal(last_nft_v2.tokenId);
  });



});