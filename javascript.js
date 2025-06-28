// pages/index.js
import { useState } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";

const defaultSourceCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public myNumber;

    function set(uint256 _newNumber) public {
        myNumber = _newNumber;
    }

    function get() public view returns (uint256) {
        return myNumber;
    }
}`;

export default function Home() {
  const [sourceCode, setSourceCode] = useState(defaultSourceCode);
  const [contractName, setContractName] = useState("SimpleStorage");
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError("");
    setContractAddress("");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceCode, contractName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      
      setContractAddress(data.contractAddress);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Gasless Contract Deployer</title>
        <meta name="description" content="Deploy Solidity contracts without gas" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Gasless Contract Deployer 🚀
        </h1>
        <p className={styles.description}>
          Paste your Solidity code, and we'll deploy it to the Sepolia Testnet for you.
        </p>

        <div className={styles.form}>
            <label htmlFor="contractName">Contract Name</label>
            <input
                id="contractName"
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="e.g., SimpleStorage"
                className={styles.input}
            />

            <label htmlFor="sourceCode">Solidity Code</label>
            <textarea
                id="sourceCode"
                className={styles.textarea}
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
            />

            <button
                onClick={handleDeploy}
                disabled={isDeploying || !contractName}
                className={styles.button}
            >
                {isDeploying ? "Deploying..." : "Deploy"}
            </button>
        </div>

        {contractAddress && (
            <div className={styles.result}>
                <p>✅ Contract deployed successfully!</p>
                <p>Address: <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">{contractAddress}</a></p>
            </div>
        )}

        {error && (
            <div className={`${styles.result} ${styles.error}`}>
                <p>❌ Deployment Failed</p>
                <pre>{error}</pre>
            </div>
        )}
      </main>
    </div>
  );
}