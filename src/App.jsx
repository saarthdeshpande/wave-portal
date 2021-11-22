import React, { useEffect, useState } from "react";
import { ethers } from "ethers"; // helps frontend talk to contract
import './App.css';
import abi from './utils/portal.json'

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWaves, setTotalWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const contractABI = abi.abi;
  const contractAddress = "0xBFbbA13D83A9C026F9226a5C071C5a20A2cA6Fd0";

  const getAllWaves = async () => {
  const { ethereum } = window;

  try {
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      const waves = await wavePortalContract.getAllWaves();
      const wavesCleaned = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });
      setAllWaves(wavesCleaned);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error);
  }
};

  const getWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum); // provider used to talk to ethereum nodes
        const signer = provider.getSigner();
        const portalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await portalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
      } else {
        console.log("Make sure you have metamask!");
        return;
      }
    } catch(e) {
      console.log(e)
    }
  }
  const wave = async (msg) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum); // provider used to talk to ethereum nodes
        const signer = provider.getSigner();
        const portalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waveTxn = await portalContract.wave(msg, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        let count = await portalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
        setLoading(false);
      } else {
        console.log("Make sure you have metamask!");
        setLoading(false);
        return;
      }
    } catch(e) {
      setLoading(false)
      console.log(e)
    } 
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        getAllWaves();
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch(e) {
      console.log(e)
    } 
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
      getWaves();
      getAllWaves();
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getWaves();
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        getWaves();
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, [])
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Wave, don't waive!
        </div>

        <div className="bio">
          Transitioning to Web3 with buildspace is so cool.
        </div>
        <div align="center" style={{marginTop: '10px'}}>
          <a href="https://twitter.com/DeshpandeSaarth" class="fa fa-twitter"></a>
          <a href="https://linkedin.com/in/saarthdeshpande" class="fa fa-linkedin"></a>
          <a href="https://github.com/saarthdeshpande" class="fa fa-github"></a>
        </div>
        {!currentAccount && <button className="waveButton" onClick={connectWallet}>Connect Wallet</button>}
        <div align='center' style={{paddingTop: '10px'}}>
          Total Waves: {totalWaves}
        </div>
        {loading ? <div align='center' style={{paddingTop: '10px'}}>Waving..</div> : (
          <div style={{marginTop: '10px'}}>
            <form onSubmit={e => e.preventDefault()} validate="true" style={{textAlign: 'center'}}>
              <label htmlFor="message" style={{marginRight: '5px'}}>Message: </label>
              <input required onChange={e => setMessage(e.target.value)} type="text" id="message" name='message' />  <br />      
              <button className="waveButton" onClick={wave.bind(this, message)}>
                Wave at Me
              </button>
            </form>
          </div>
        )}
        <div>
          {allWaves.map((wave, index) => {
            return (
              <table key={index} className='card' style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                <tr className="container">
                  <th>Address</th>
                  <th>Message</th>
                  <th>Timestamp</th>
                </tr>
                <tr className="container">
                  <td>
                    <a href={"https://rinkeby.etherscan.io/address/" + wave.address}>
                      {wave.address}
                    </a>
                  </td>
                  <td>{wave.message}</td>
                  <td>{wave.timestamp.toString()}</td>
                </tr>
              </table>)
          })}
        </div>
      </div>
    </div>
  );
}
