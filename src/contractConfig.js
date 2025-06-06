export const CONTRACT_ADDRESS = "0x957c8f2527f9f7a8ad53ae7d76dcd435108b27d3";

export const CONTRACT_ABI = 
  [
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_priceFeedAddresses",
        "type": "address[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "AccessGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "AccessDenied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "priceIndex",
        "type": "uint256"
      }
    ],
    "name": "AssetAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newScore",
        "type": "uint256"
      }
    ],
    "name": "CreditScoreUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "did",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      }
    ],
    "name": "DIDVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "asset",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newRate",
        "type": "uint256"
      }
    ],
    "name": "InterestRateUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateralLiquidated",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "debtRepaid",
        "type": "uint256"
      }
    ],
    "name": "LiquidationExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newThreshold",
        "type": "uint256"
      }
    ],
    "name": "PriceDataStaleThresholdUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "INTEREST_RATE_PRECISION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LIQUIDATION_BONUS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LIQUIDATION_THRESHOLD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_USDC_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "USD_PRECISION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "priceIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "borrowRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateralFactor",
        "type": "uint256"
      }
    ],
    "name": "addAsset",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_did",
        "type": "string"
      }
    ],
    "name": "addValidDID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "borrowedAmounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "checkPriceFeedHealth",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isHealthy",
        "type": "bool"
      },
      {
        "internalType": "int256",
        "name": "price",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "lastUpdated",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "hoursSinceUpdate",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "checkUpkeep",
    "outputs": [
      {
        "internalType": "bool",
        "name": "upkeepNeeded",
        "type": "bool"
      },
      {
        "internalType": "bytes",
        "name": "performData",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "checkUserAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "deposits",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "didRegistry",
    "outputs": [
      {
        "internalType": "string",
        "name": "did",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "verificationTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "reputationPoints",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalBorrowed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalRepaid",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPrices",
    "outputs": [
      {
        "internalType": "int256[]",
        "name": "",
        "type": "int256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "asset",
        "type": "string"
      }
    ],
    "name": "getAssetInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "priceIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseBorrowRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "collateralFactor",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct DIDVerifier.Asset",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getCollateralRatio",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getDIDInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "did",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "verificationTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creditScore",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "reputationPoints",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalBorrowed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRepaid",
            "type": "uint256"
          }
        ],
        "internalType": "struct DIDVerifier.DIDInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getDepositBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "asset",
        "type": "string"
      }
    ],
    "name": "getDynamicBorrowRate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getLatestPrice",
    "outputs": [
      {
        "internalType": "int256",
        "name": "",
        "type": "int256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getLatestPriceUnsafe",
    "outputs": [
      {
        "internalType": "int256",
        "name": "",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getLiquidationPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getPriceFormatted",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserPosition",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "collateralValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "borrowedValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastInterestUpdate",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isLiquidatable",
            "type": "bool"
          }
        ],
        "internalType": "struct DIDVerifier.UserPosition",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isVerified",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastUpkeepTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "liquidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "performUpkeep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "priceDataStaleThreshold",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "priceFeeds",
    "outputs": [
      {
        "internalType": "contract AggregatorV3Interface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newThreshold",
        "type": "uint256"
      }
    ],
    "name": "setPriceDataStaleThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "supportedAssets",
    "outputs": [
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "priceIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "baseBorrowRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateralFactor",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newInterval",
        "type": "uint256"
      }
    ],
    "name": "updateUpkeepInterval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "upkeepInterval",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userDID",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userPositions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "collateralValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "borrowedValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastInterestUpdate",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isLiquidatable",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "validDIDs",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_did",
        "type": "string"
      }
    ],
    "name": "verifyDIDAndAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// Sepolia testnet Chainlink price feed addresses (Verified)
export const PRICE_FEEDS = {
  USDC_USD: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E", // Index 0
  ETH_USD: "0x694AA1769357215DE4FAC081bf1f309aDC325306",  // Index 1
  BTC_USD: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43"   // Index 2
};

// Network configuration
export const NETWORK_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    currency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18
    },
    faucets: [
      "https://sepoliafaucet.com/",
      "https://faucets.chain.link/",
      "https://www.alchemy.com/faucets/ethereum-sepolia"
    ]
  }
};

// Asset configurations with enhanced metadata
export const SUPPORTED_ASSETS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    icon: "Ξ",
    priceIndex: 1,
    decimals: 18,
    color: "eth-gradient",
    bgColor: "from-blue-500 to-purple-600",
    textColor: "text-blue-600",
    borderColor: "border-blue-500",
    description: "Ethereum native token",
    website: "https://ethereum.org",
    coingeckoId: "ethereum"
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    icon: "$",
    priceIndex: 0,
    decimals: 6,
    color: "usdc-gradient",
    bgColor: "from-green-500 to-blue-500",
    textColor: "text-green-600",
    borderColor: "border-green-500",
    description: "USD backed stablecoin",
    website: "https://www.centre.io/usdc",
    coingeckoId: "usd-coin"
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "₿",
    priceIndex: 2,
    decimals: 8,
    color: "btc-gradient",
    bgColor: "from-orange-500 to-yellow-500",
    textColor: "text-orange-600",
    borderColor: "border-orange-500",
    description: "Digital gold",
    website: "https://bitcoin.org",
    coingeckoId: "bitcoin"
  }
};

// Contract constants (matching smart contract)
export const CONTRACT_CONSTANTS = {
  MIN_USDC_PRICE: 99000000, // $0.99 in 8 decimals
  LIQUIDATION_THRESHOLD: 8000, // 80%
  LIQUIDATION_BONUS: 500, // 5%
  INTEREST_RATE_PRECISION: 10000,
  USD_PRECISION: 100000000, // 1e8
  UPKEEP_INTERVAL: 3600 // 1 hour
};

// Contract deployment parameters
export const DEPLOYMENT_CONFIG = {
  priceFeedAddresses: [
    PRICE_FEEDS.USDC_USD, // Index 0
    PRICE_FEEDS.ETH_USD,  // Index 1
    PRICE_FEEDS.BTC_USD   // Index 2
  ],
  network: "sepolia",
  gasLimit: 5000000,
  gasPrice: "20000000000", // 20 gwei
  confirmations: 5
};

// DID examples for testing
export const EXAMPLE_DIDS = [
  {
    did: "user123",
    description: "Basic test user",
    expectedCreditScore: 750
  },
  {
    did: "user456",
    description: "Premium test user",
    expectedCreditScore: 800
  },
  {
    did: "user789",
    description: "Standard test user",
    expectedCreditScore: 750
  },
  {
    did: "demo_user",
    description: "Demo account",
    expectedCreditScore: 750
  },
  {
    did: "test_verified",
    description: "Verified test account",
    expectedCreditScore: 750
  }
];

// Transaction configurations
export const TX_CONFIG = {
  deposit: {
    gasLimit: 200000,
    gasPrice: "20000000000"
  },
  borrow: {
    gasLimit: 300000,
    gasPrice: "20000000000"
  },
  verify: {
    gasLimit: 250000,
    gasPrice: "20000000000"
  },
  liquidate: {
    gasLimit: 400000,
    gasPrice: "25000000000"
  }
};

// UI Configuration
export const UI_CONFIG = {
  refreshInterval: 30000, // 30 seconds
  priceUpdateInterval: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  defaultSlippage: 0.5, // 0.5%
  notifications: {
    duration: 5000, // 5 seconds
    position: "top-right"
  }
};

// Utility functions
export const formatPrice = (price, decimals = 2) => {
  if (!price || price === 'Loading...' || price === 'Error') return price;
  
  let numPrice;
  if (typeof price === 'string') {
    numPrice = parseFloat(price.replace(/[$,]/g, ''));
  } else {
    numPrice = parseFloat(price);
  }
  
  if (isNaN(numPrice)) return 'Invalid';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numPrice);
};

export const formatEther = (wei, decimals = 4) => {
  if (!wei || wei === '0') return '0.00';
  
  const ether = parseFloat(wei) / Math.pow(10, 18);
  return ether.toFixed(decimals);
};

export const formatWei = (ether) => {
  if (!ether || ether === '0') return '0';
  return (parseFloat(ether) * Math.pow(10, 18)).toString();
};

export const formatPercentage = (basisPoints, decimals = 2) => {
  if (!basisPoints) return '0.00%';
  return (basisPoints / 100).toFixed(decimals) + '%';
};

export const formatNumber = (num, decimals = 2) => {
  if (!num) return '0.00';
  return parseFloat(num).toFixed(decimals);
};

export const truncateAddress = (address, startLength = 6, endLength = 4) => {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

export const calculateHealthFactor = (collateralValue, borrowedValue, liquidationThreshold = 8000) => {
  if (!borrowedValue || borrowedValue === '0') return Infinity;
  
  const collateral = parseFloat(collateralValue);
  const borrowed = parseFloat(borrowedValue);
  const threshold = liquidationThreshold / 10000;
  
  return (collateral * threshold) / borrowed;
};

export const formatHealthFactor = (healthFactor) => {
  if (healthFactor === Infinity) return '∞';
  if (healthFactor > 10) return '>10.00';
  return healthFactor.toFixed(2);
};

export const getHealthFactorColor = (healthFactor) => {
  if (healthFactor === Infinity) return 'text-green-600';
  if (healthFactor > 2) return 'text-green-600';
  if (healthFactor > 1.5) return 'text-yellow-600';
  if (healthFactor > 1.2) return 'text-orange-600';
  return 'text-red-600';
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  WRONG_NETWORK: 'Please switch to Sepolia testnet',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INVALID_AMOUNT: 'Please enter a valid amount',
  DID_NOT_VERIFIED: 'Please verify your DID first',
  TRANSACTION_FAILED: 'Transaction failed',
  PRICE_FEED_ERROR: 'Unable to fetch price data',
  CONTRACT_NOT_FOUND: 'Contract not found',
  INSUFFICIENT_ALLOWANCE: 'Insufficient token allowance'
};

// Success messages
export const SUCCESS_MESSAGES = {
  DID_VERIFIED: 'DID verified successfully',
  DEPOSIT_SUCCESS: 'Deposit completed successfully',
  BORROW_SUCCESS: 'Borrow completed successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  WALLET_CONNECTED: 'Wallet connected successfully'
};

// Export default config object
export default {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  PRICE_FEEDS,
  NETWORK_CONFIG,
  SUPPORTED_ASSETS,
  CONTRACT_CONSTANTS,
  DEPLOYMENT_CONFIG,
  EXAMPLE_DIDS,
  TX_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};