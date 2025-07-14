const CONTRACT_ADDRESS = "0x62D274c4e290b5Fb8860E921c03816374700f903";// preview testnet
//"0x441281D517cD4cEbC7C455e6EE78AEA49436CA95";
//"0x4Ef792B34551D268Bab2D2d22B38Ba5640FFB82b";

const ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_founder1", "type": "address" },
      { "internalType": "address", "name": "_founder2", "type": "address" },
      { "internalType": "address", "name": "_cm", "type": "address" },
      { "internalType": "address", "name": "_admin1", "type": "address" },
      { "internalType": "address", "name": "_tradingWallet", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "approveEmergency",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getTotalAllocated",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getWithdrawn",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyApprovalCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "to", "type": "address" }],
    "name": "triggerEmergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalReceived",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider;
let signer;
let contract;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const userAddr = await signer.getAddress();
    document.getElementById("addr").innerText = userAddr;

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    document.getElementById("contractAddr").innerText = CONTRACT_ADDRESS; // 🔹 추가된 줄

    await refreshInfo();
    await updateMyShare();
  } else {
    alert("Please install MetaMask.");
  }
}


async function updateMyShare() {
  if (!contract || !signer) return;

  const user = await signer.getAddress();
  const totalAlloc = await contract.getTotalAllocated(user);
  const withdrawn = await contract.getWithdrawn(user);
  const withdrawable = totalAlloc.sub(withdrawn);

  document.getElementById("totalAlloc").innerText = ethers.utils.formatEther(totalAlloc);
  document.getElementById("withdrawn").innerText = ethers.utils.formatEther(withdrawn);
  document.getElementById("withdrawable").innerText = ethers.utils.formatEther(withdrawable);
}

async function withdraw() {
  if (!contract) return;
  const tx = await contract.withdraw();
  await tx.wait();
  alert("Withdrawal complete.");
  await updateMyShare();
  await refreshInfo();
}

async function approveEmergency() {
  if (!contract) return;
  const tx = await contract.approveEmergency();
  await tx.wait();
  alert("Emergency approved.");
  await refreshInfo();
}

async function triggerEmergency() {
  const to = document.getElementById("emergencyReceiver").value;
  if (!to || !ethers.utils.isAddress(to)) {
    alert("Invalid receiver address");
    return;
  }

  if (!contract) return;
  const tx = await contract.triggerEmergencyWithdraw(to);
  await tx.wait();
  alert("Emergency withdrawal executed.");
  await refreshInfo();
}

async function sendNative() {
  const to = document.getElementById("nativeTo").value;
  const amount = document.getElementById("nativeAmount").value;

  if (!to || !ethers.utils.isAddress(to)) {
    alert("Invalid recipient address");
    return;
  }

  if (!amount || isNaN(amount)) {
    alert("Invalid amount");
    return;
  }

  const tx = await signer.sendTransaction({
    to,
    value: ethers.utils.parseEther(amount)
  });

  await tx.wait();
  alert("Native token sent.");
  await refreshInfo();
}

async function refreshInfo() {
  if (!contract || !signer) return;

  const balance = await provider.getBalance(CONTRACT_ADDRESS);
  document.getElementById("contractBalance").innerText = ethers.utils.formatEther(balance);

  const count = await contract.emergencyApprovalCount();
  document.getElementById("approvalCount").innerText = count.toString();

  const myAddr = await signer.getAddress();
  const myBalance = await provider.getBalance(myAddr);
  document.getElementById("myBalance").innerText = `(${ethers.utils.formatEther(myBalance)} ETH)`;

  // 🔹 총 수익 표시
  const totalRevenue = await contract.totalReceived();
  document.getElementById("totalRevenue").innerText = ethers.utils.formatEther(totalRevenue);

  await updateMyShare();
}
