# ChainGuard DeFi - Chainlink-Powered Decentralized Identity and Lending Platform

## 🏆 Chainlink Hackathon 2025 Submission

> **The future of decentralized lending powered by Chainlink's oracle network. Secure, transparent, and fully automated DeFi solutions with decentralized identity verification.**

## 📖 Table of Contents

- [Overview](#overview)
- [Chainlink Integration](#chainlink-integration)
- [Live Demo](#live-demo)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Team](#team)
- [License](#license)

## 🌟 Overview

ChainGuard DeFi is a revolutionary decentralized lending platform that combines **Chainlink Price Feeds**, **Chainlink Automation**, and **Decentralized Identity (DID) verification** to create a secure, transparent, and fully automated lending experience.

### 🎯 Problem Statement

Traditional DeFi lending platforms face several critical challenges:
- **Price Oracle Reliability**: Centralized price feeds create single points of failure
- **Identity Verification**: Lack of proper identity verification leads to higher risk
- **Manual Operations**: Static interest rates and manual liquidations reduce efficiency
- **Market Instability**: Poor risk management during volatile market conditions

### 💡 Our Solution

ChainGuard DeFi leverages Chainlink's robust infrastructure to solve these problems:

1. **Chainlink Price Feeds**: Real-time, tamper-proof price data for USDC, ETH, and BTC
2. **Chainlink Automation**: Automated interest rate updates and position monitoring
3. **DID Integration**: Decentralized identity verification with credit scoring
4. **Dynamic Risk Management**: Market-responsive borrowing rates and liquidation protection

## 🔗 Chainlink Integration

### ✅ **Core Requirement Compliance**

Our project **makes state changes on the blockchain** using multiple Chainlink services:

#### 📊 Chainlink Data Feeds
- **USDC/USD Feed**: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`
- **ETH/USD Feed**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- **BTC/USD Feed**: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`

**State Changes Made**:
- ✅ User verification based on USDC price threshold ($0.99)
- ✅ Dynamic borrowing rate calculations using ETH/BTC prices
- ✅ Collateral value updates for liquidation calculations
- ✅ Position health monitoring using real-time price data

#### 🤖 Chainlink Automation
**Upkeep Contract Functions**:
- `checkUpkeep()`: Monitors if interest rate updates are needed
- `performUpkeep()`: Automatically updates borrowing rates based on market conditions

**State Changes Made**:
- ✅ Automated interest rate adjustments every hour
- ✅ Dynamic rate calculation based on asset price movements
- ✅ Automated position monitoring for liquidation triggers

### 📍 Deployed Contracts

**Smart Contract Address**: `0x957c8f2527f9f7a8ad53ae7d76dcd435108b27d3`  
**Network**: Sepolia Testnet  
**Block Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x957c8f2527f9f7a8ad53ae7d76dcd435108b27d3)

## 🚀 Live Demo

🌐 **Live Application**: https://chainguardfi.xyz

### Demo Credentials
- **Test DIDs**: `user123`, `demo_user`, `test_verified`
- **Network**: Sepolia Testnet
- **Test ETH**: Available from [Sepolia Faucet](https://sepoliafaucet.com/)

## ✨ Features

### 🔐 Core Features

#### 1. **Decentralized Identity Verification**
- Multi-factor DID verification system
- Credit scoring based on on-chain history
- Reputation point system for improved lending terms
- Integration with Chainlink price feeds for market-based verification

#### 2. **Real-Time Price Feeds**
- Live USDC, ETH, and BTC price data from Chainlink
- Price feed health monitoring with staleness detection
- Emergency mode activation for price feed issues
- Formatted price display with update timestamps

#### 3. **Dynamic Interest Rates**
- Market-responsive borrowing rates
- ETH price-based rate adjustments (Higher ETH price = Lower rates)
- Automated rate updates via Chainlink Automation
- Risk-adjusted pricing based on collateral ratios

#### 4. **Automated Risk Management**
- Real-time health factor calculations
- Liquidation price monitoring
- Automated position updates
- Emergency withdrawal capabilities

#### 5. **Advanced User Dashboard**
- Real-time portfolio overview
- Risk metrics visualization
- Transaction history tracking
- Credit score progression

### 🛡️ Security Features

- **Price Feed Validation**: Multiple validation layers for price data integrity
- **Staleness Protection**: Configurable thresholds for price data freshness
- **Emergency Modes**: Automatic fallback mechanisms during market instability
- **Access Controls**: Owner-only administrative functions
- **Reentrancy Protection**: Secure contract interactions

## 🛠️ Technology Stack

### Blockchain Layer
- **Smart Contracts**: Solidity ^0.8.19
- **Oracle Infrastructure**: Chainlink Price Feeds & Automation
- **Network**: Ethereum Sepolia Testnet
- **Development Framework**: Hardhat/Foundry compatible

### Frontend Layer
- **Framework**: React 18 with Vite
- **Web3 Integration**: Wagmi + RainbowKit
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Hooks + Context
- **Price Fetching**: Ethers.js v6

### Infrastructure
- **Deployment**: Vercel (Frontend) + Sepolia (Contracts)
- **Price Feeds**: Chainlink Decentralized Oracles
- **Automation**: Chainlink Keepers
- **Wallet Connection**: RainbowKit with multiple wallet support

## 🏗️ Smart Contract Architecture

### Core Contract: `DIDVerifier.sol`

#### Key Components

```solidity
contract DIDVerifier is AutomationCompatibleInterface {
    // Chainlink Price Feed Integration
    AggregatorV3Interface[] public priceFeeds;
    
    // Enhanced structures
    struct DIDInfo { /* User identity data */ }
    struct Asset { /* Multi-asset support */ }
    struct UserPosition { /* Position tracking */ }
}
```

#### Critical Functions

##### 🔄 Chainlink Integration Functions
- `getLatestPrice(uint256 index)`: Fetches real-time prices with staleness checks
- `checkUpkeep()`: Automation-compatible upkeep checker
- `performUpkeep()`: Automated interest rate updates
- `checkPriceFeedHealth()`: Price feed monitoring and health status

##### 💰 Core DeFi Functions
- `verifyDIDAndAccess()`: DID verification with market condition checks
- `deposit()`: Collateral deposit with position updates
- `borrow()`: Dynamic rate borrowing with risk assessment
- `liquidate()`: Automated liquidation with Chainlink price validation

##### 📊 Advanced Features
- `getDynamicBorrowRate()`: Market-responsive interest rate calculation
- `updateUserPosition()`: Real-time position value updates
- `calculateInitialCreditScore()`: Credit scoring based on market conditions

### 🔧 Chainlink Services Integration

#### Price Feeds Implementation
```solidity
function getLatestPrice(uint256 index) public view returns (int) {
    require(index < priceFeeds.length, "Invalid price feed index");
    
    try priceFeeds[index].latestRoundData() returns (
        uint80, int price, uint256, uint256 updatedAt, uint80
    ) {
        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= priceDataStaleThreshold, "Price data stale");
        return price;
    } catch {
        revert("Failed to get price data");
    }
}
```

#### Automation Implementation
```solidity
function checkUpkeep(bytes calldata) external view override 
    returns (bool upkeepNeeded, bytes memory performData) {
    upkeepNeeded = (block.timestamp - lastUpkeepTime) > upkeepInterval;
    performData = "";
}

function performUpkeep(bytes calldata) external override {
    if ((block.timestamp - lastUpkeepTime) > upkeepInterval) {
        lastUpkeepTime = block.timestamp;
        updateInterestRates(); // Updates rates based on current market prices
    }
}
```

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── App.jsx              # Main application component
├── App.css              # Comprehensive styling system
├── contractConfig.js    # Contract ABIs and configurations
├── main.jsx            # React + Wagmi + RainbowKit setup
└── index.css           # Tailwind imports
```

### Key Frontend Features

#### 🌈 Modern UI Components
- Responsive design with mobile-first approach
- Gradient-based color scheme with accessibility support
- Real-time data updates with loading states
- Interactive price cards with health status indicators

#### 📱 Responsive Dashboard
- Grid-based layout adapting to screen sizes
- Real-time stat cards with dynamic updates
- Interactive charts and progress indicators
- Mobile-optimized navigation and controls

#### 🔌 Web3 Integration
- RainbowKit wallet connection with custom styling
- Real-time blockchain state synchronization
- Transaction status tracking and user feedback
- Error handling with user-friendly messages

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH for testing

### Quick Start

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/chainguard-defi
cd chainguard-defi
```

2. **Install Dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
```bash
# Create .env file
cp .env.example .env

# Add your configuration
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_CONTRACT_ADDRESS=0x957c8f2527f9f7a8ad53ae7d76dcd435108b27d3
```

4. **Start Development Server**
```bash
npm run dev
# or
yarn dev
```

5. **Configure MetaMask**
- Add Sepolia testnet
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Connect to the application

## 📚 Usage Guide

### Step-by-Step Tutorial

#### 1. **Connect Your Wallet**
- Click "Connect Wallet" button
- Select your preferred wallet (MetaMask recommended)
- Ensure you're on Sepolia testnet

#### 2. **Verify Your DID**
- Enter a test DID: `user123`, `demo_user`, or `test_verified`
- Click "Verify DID" and confirm the transaction
- Wait for verification confirmation

#### 3. **Deposit Collateral**
- Enter ETH amount in the deposit section
- Click "Deposit ETH" and confirm transaction
- Monitor your collateral balance update

#### 4. **Borrow ETH**
- Check your available borrowing capacity
- Enter desired borrow amount
- Confirm borrow transaction
- Receive ETH to your wallet

#### 5. **Monitor Your Position**
- Track health factor and liquidation risk
- View real-time price updates
- Monitor interest rate changes

### 🧪 Testing Scenarios

#### Test Case 1: Basic Flow
1. Connect wallet → Verify DID → Deposit 0.01 ETH → Borrow 0.002 ETH

#### Test Case 2: Market Conditions
1. Monitor price feed updates
2. Observe dynamic interest rate changes
3. Test emergency mode activation

#### Test Case 3: Risk Management
1. Create position near liquidation threshold
2. Monitor health factor changes
3. Test liquidation protection mechanisms

## 🧪 Testing

### Automated Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Wallet connection and network switching
- [ ] DID verification with valid/invalid DIDs
- [ ] Deposit and withdrawal functionality
- [ ] Borrowing with different amounts
- [ ] Price feed updates and health monitoring
- [ ] Emergency mode activation
- [ ] Mobile responsiveness

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Smart Contract Deployment
```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## 👥 Team

**Developer** : Banuja Lakmuthu
- Smart Contract Developer
  
**Contact**: 
- GitHub: [@Blazeeth](https://github.com/blazeeth)
- Email: banujalakmuthu@gmail.com
- Twitter: [@banujalakmuthu](https://x.com/banujalakmuthu)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Chainlink Team**: For providing robust oracle infrastructure
- **Ethereum Foundation**: For the solid blockchain foundation
- **RainbowKit Team**: For excellent Web3 UX components
- **Open Source Community**: For the amazing tools and libraries

---

## 🔗 Important Links

- **Live Demo**: [ChainGuard DeFi](https://chainguardfi.xyz)
- **Smart Contract**: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x957c8f2527f9f7a8ad53ae7d76dcd435108b27d3)
- **Source Code**: [GitHub Repository](https://github.com/Blazeeth/chainguard)
- **Chainlink Docs**: [Official Documentation](https://docs.chain.link/)

---

**Built with ❤️ for Chainlink Hackathon 2025**

*Enabling the future of decentralized finance through secure, transparent, and automated lending solutions.*