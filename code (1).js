// pages/api/deploy.js
import { ethers } from "ethers";
import solc from "solc";

// This function is the main handler for the API route
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sourceCode, contractName } = req.body;

    if (!sourceCode || !contractName) {
        return res.status(400).json({ error: "Source code and contract name are required." });
    }

    // --- 1. Compile the Solidity Code ---
    const input = {
      language: "Solidity",
      sources: {
        "Contract.sol": {
          content: sourceCode,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Handle compilation errors
    if (output.errors) {
        const errorMessages = output.errors.filter(err => err.severity === 'error').map(err => err.formattedMessage).join('\n');
        if (errorMessages.length > 0) {
            return res.status(400).json({ error: `Compilation failed:\n${errorMessages}` });
        }
    }
    
    const contractFile = output.contracts["Contract.sol"];
    const contract = contractFile[contractName];

    if (!contract) {
        return res.status(400).json({ error: `Contract "${contractName}" not found in the source code.` });
    }

    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;

    // --- 2. Connect to the Blockchain ---
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // --- 3. Deploy the Contract ---
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log(`Attempting to deploy ${contractName}...`);

    const deployedContract = await factory.deploy();
    
    // Wait for the deployment transaction to be mined
    await deployedContract.waitForDeployment();

    const contractAddress = await deployedContract.getAddress();
    console.log(`Contract deployed at address: ${contractAddress}`);

    // --- 4. Send the Response ---
    res.status(200).json({
      message: "Contract deployed successfully!",
      contractAddress: contractAddress,
    });
  } catch (error) {
    console.error("Deployment Error:", error);
    // Provide a more specific error message if possible
    const errorMessage = error.reason || error.message || "An unknown error occurred.";
    res.status(500).json({ error: `Deployment failed: ${errorMessage}` });
  }
}