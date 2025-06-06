export const CONTRACT_ADDRESS = "0xc46DCa7907BfB919b1849De089cE53F2B9a5B4a3";

// Complete ABI for DIDVerifier contract
export const CONTRACT_ABI = [
  // View functions
  "function checkUserAccess(address user) view returns (bool)",
  "function getDepositBalance(address user) view returns (uint256)",
  "function getUserPosition(address user) view returns (tuple(uint256 collateralValue, uint256 borrowedValue, uint256 lastInterestUpdate, bool isLiquidatable))",
  "function getDIDInfo(address user) view returns (tuple(string did, uint256 verificationTime, uint256 creditScore, bool isActive, uint256 reputationPoints, uint256 totalBorrowed, uint256 totalRepaid))",
  "function getAssetInfo(string asset) view returns (tuple(string symbol, uint256 priceIndex, uint256 baseBorrowRate, uint256 collateralFactor, bool isActive))",
  "function getLatestPrice(uint256 index) view returns (int256)",
  "function getAllPrices() view returns (int256[])",
  "function getPriceFormatted(uint256 index) view returns (string)",
  "function getDynamicBorrowRate(string asset) view returns (uint256)",
  "function getCollateralRatio(address user) view returns (uint256)",
  "function getLiquidationPrice(address user) view returns (uint256)",
  "function isVerified(address) view returns (bool)",
  "function userDID(address) view returns (string)",
  "function deposits(address) view returns (uint256)",
  "function borrowedAmounts(address) view returns (uint256)",
  
  // Public mappings (auto-generated getters)
  "function supportedAssets(string) view returns (tuple(string symbol, uint256 priceIndex, uint256 baseBorrowRate, uint256 collateralFactor, bool isActive))",
  "function validDIDs(string) view returns (bool)",
  "function didRegistry(address) view returns (tuple(string did, uint256 verificationTime, uint256 creditScore, bool isActive, uint256 reputationPoints, uint256 totalBorrowed, uint256 totalRepaid))",
  "function userPositions(address) view returns (tuple(uint256 collateralValue, uint256 borrowedValue, uint256 lastInterestUpdate, bool isLiquidatable))",
  "function priceFeeds(uint256) view returns (address)",
  "function owner() view returns (address)",
  "function lastUpkeepTime() view returns (uint256)",
  "function upkeepInterval() view returns (uint256)",
  
  // Constants
  "function MIN_USDC_PRICE() view returns (uint256)",
  "function LIQUIDATION_THRESHOLD() view returns (uint256)",
  "function LIQUIDATION_BONUS() view returns (uint256)",
  "function INTEREST_RATE_PRECISION() view returns (uint256)",
  "function USD_PRECISION() view returns (uint256)",
  
  // State changing functions
  "function verifyDIDAndAccess(string _did)",
  "function deposit() payable",
  "function borrow(uint256 amount)",
  "function liquidate(address user)",
  
  // Admin functions
  "function addValidDID(string _did)",
  "function addAsset(string symbol, uint256 priceIndex, uint256 borrowRate, uint256 collateralFactor)",
  "function updateUpkeepInterval(uint256 newInterval)",
  "function emergencyWithdraw()",
  "function pause()",
  
  // Chainlink Automation
  "function checkUpkeep(bytes calldata) view returns (bool upkeepNeeded, bytes memory performData)",
  "function performUpkeep(bytes calldata performData)",
  
  // Events
  "event DIDVerified(address indexed user, string did, uint256 creditScore)",
  "event AccessGranted(address indexed user)",
  "event AccessDenied(address indexed user, string reason)",
  "event LiquidationExecuted(address indexed user, uint256 collateralLiquidated, uint256 debtRepaid)",
  "event InterestRateUpdated(string asset, uint256 newRate)",
  "event CreditScoreUpdated(address indexed user, uint256 newScore)",
  "event AssetAdded(string symbol, uint256 priceIndex)",
  
  // Receive function
  "receive() external payable"
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