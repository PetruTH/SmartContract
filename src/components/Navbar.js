import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import EventSubject from "./Observer";

function Navbar() {

const [connected, toggleConnect] = useState(false);
const location = useLocation();
const [currAddress, updateAddress] = useState('0x');

async function getAddress() {
  const ethers = require("ethers");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const addr = await signer.getAddress();
  updateAddress(addr);

}

  async function connect(){
    const ethers = require("ethers");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    updateAddress(addr);
    updateButton();
    console.log(signer.getAddress());
    window.location.reload();
  }
  

function updateButton() {
  const ethereumButton = document.querySelector('.enableEthereumButton');
  ethereumButton.textContent = "Connected";
  ethereumButton.classList.remove("hover:bg-blue-70");
  ethereumButton.classList.remove("bg-blue-500");
  ethereumButton.classList.add("hover:bg-green-70");
  ethereumButton.classList.add("bg-green-500");
}


  useEffect(() => {
    if(window.ethereum == undefined)
      return;
    let val = window.ethereum.isConnected();
    if(val)
    {
      getAddress();
      toggleConnect(val);
      updateButton();
    }

    window.ethereum.on('accountsChanged', function(accounts){
      window.location.replace(location.pathname)
    })
  });

  const eventSubject = new EventSubject();

  const find_tabs = () => {
      const tabs = Array.from(document.getElementsByClassName('hover:border-b-2 hover:pb-0 p-2'));
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          eventSubject.emit('buttonClick', { message: 'User with address: ' + currAddress + ' goes to ' + tab.id + ' page.'});
      });
    });
    
  };

  find_tabs()

  eventSubject.on('buttonClick', (data) => {
      console.log(data.message);
  });

    return (
      <div className="">
        <nav className="w-screen">
          <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/" id>
            <div className='inline-block font-bold text-xl ml-2'>
              NFT Marketplace
            </div>
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              {location.pathname === "/" ? 
              <li className='border-b-2 hover:pb-0 p-2' id="marketplace"> 
                <Link to="/">Marketplace</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2' id="marketplace">
                <Link to="/">Marketplace</Link>
              </li>              
              }
              {location.pathname === "/sellNFT" ? 
              <li className='border-b-2 hover:pb-0 p-2' id="sell nft">
                <Link to="/sellNFT">List My NFT</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2' id="sell nft">
                <Link to="/sellNFT">List My NFT</Link>
              </li>              
              }              
              {location.pathname === "/profile" ? 
              <li className='border-b-2 hover:pb-0 p-2' id="profile">
                <Link to="/profile">Profile</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2' id="profile">
                <Link to="/profile">Profile</Link>
              </li>              
              }  
              <li>
                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={connect}>{connected? "Connected":"Connect Wallet"}</button>
              </li>
            </ul>
          </li>
          </ul>
        </nav>
        <div className='text-white text-bold text-right mr-10 text-sm'>
          {currAddress !== "0x" ? "Connected to":"Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0,15)+'...'):""}
        </div>
      </div>
    );
  }

  export default Navbar;