import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { updateJSONOnIPFS } from "../pinata";
import EventSubject from "./Observer";

export default function NFTPage (props) {

    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);

    const eventSubject = new EventSubject();
    let buttonFound = false; 

    const findButton = () => {
        const button = document.getElementById('buy-button');
        if (button && !buttonFound) {
            buttonFound = true;
            button.addEventListener('click', () => {
                eventSubject.emit('buttonClick', { message: 'Buy NFT button clicked for NFT with id: ' + tokenId + ' , by address: ' + currAddress });
            });
        } else {
            setTimeout(findButton, 100);
        }
    };

    if (buttonFound == false && currAddress != "0x"){
        findButton();   
    }

    eventSubject.on('buttonClick', (data) => {
        console.log(data.message);
    });

    async function estimateGas(addr){
        const options = {
            method: 'POST',
            headers: {accept: 'application/json', 'content-type': 'application/json'},
            body: JSON.stringify({
              id: 1,
              jsonrpc: '2.0',
              method: 'eth_estimateGas',
              params: [
                {
                  from: addr,
                  to: MarketplaceJSON.address
                },
                'latest'
              ]
            })
          };
          
        try {
            const response = await fetch('https://nd-422-757-666.p2pify.com/0a9d79d93fb2f4a4b1e04695da2b77a7/', options);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error(err);
        }
    }

    if(typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        var tokenURI = await contract.tokenURI(tokenId);
        const listedToken = await contract.getListedTokenForId(tokenId);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta = await axios.get(tokenURI);
        meta = meta.data;

        let item = {
            price: meta.price,
            tokenId: tokenId,
            seller: listedToken.seller,
            owner: listedToken.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
        }

        updateData(item);
        updateDataFetched(true);
        updateCurrAddress(addr);
    }

    async function buyNFT(tokenId) {
        try {
            const ethers = require("ethers");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price, 'ether')
            updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
            
            let estimated_gas;
            estimateGas().then(data => {
                    estimated_gas = parseInt(data.result);
                });

            let transaction = await contract.executeSale(tokenId, {value:salePrice});
            await transaction.wait().then(async (receipt) => {
                if (receipt && receipt.status == 1) {
                alert("NFT succesfully purchased from the marketplace using " + estimated_gas + " gas!");
                }
                else{
                    alert("Purchasing the NFT failed!")
                }
            });

            updateMessage("");
            window.location.replace("/")

        }
        catch(e) {
            alert("Upload Error"+e)
        }
    }


    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">    
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                    { currAddress != data.owner && currAddress != data.seller ?
                        <button id="buy-button" className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                        : <div className="text-emerald-700">You are the owner of this NFT</div>
                    }
                    
                    <div className="text-green text-center mt-3">{message}</div>
                    
                    </div>
                </div>
            </div>
        </div>
    )
}