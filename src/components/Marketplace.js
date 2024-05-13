import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import EventSubject from "./Observer";

export default function Marketplace() {
    const sampleData = [];

    const [data, updateData] = useState(sampleData);
    const [dataFetched, updateFetched] = useState(false);
    const [currAddress, updateAddress] = useState('0x');

    async function getAllNFTs() {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        updateAddress(addr);  

        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
        let transaction = await contract.getAllNFTs()

        const items = await Promise.all(transaction.map(async i => {
            var tokenURI = await contract.tokenURI(i.tokenId);
            tokenURI = GetIpfsUrlFromPinata(tokenURI);
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            return item;
        }))

        updateFetched(true);
        updateData(items);
    }

    const eventSubject = new EventSubject();
    const find_nfts = () => {
        const nfts = document.getElementById("all_nfts");
        try{
            const all_nfts = Array.from(nfts.children);

            all_nfts.forEach(nft => {
            nft.addEventListener('click', () => {
                let index = all_nfts.indexOf(nft) + 1;
                eventSubject.emit('buttonClick', { message: 'User with address: ' + currAddress + ' goes to ' + index + ' nft.'});
                });
            });
        } catch {
            setTimeout(find_nfts, 100);
        }
    };

    find_nfts();

    eventSubject.on('buttonClick', (data) => {
        console.log(data.message);
    });

    if(!dataFetched)
        getAllNFTs();

    return (
        <div>
            <Navbar></Navbar>
            <div className="flex flex-col place-items-center mt-20">
                <div className="md:text-xl font-bold text-white">
                    Top NFTs
                </div>
                <div id="all_nfts" className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {data.map((value, index) => {
                        return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
            </div>            
        </div>
    );

}