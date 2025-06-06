// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract DIDVerifier is AutomationCompatibleInterface {
    AggregatorV3Interface[] public priceFeeds;
    
    // Enhanced DID structure
    struct DIDInfo {
        string did;
        uint256 verificationTime;
        uint256 creditScore;
        bool isActive;
        uint256 reputationPoints;
        uint256 totalBorrowed;
        uint256 totalRepaid;
    }
    
    // Multi-asset support
    struct Asset {
        string symbol;
        uint256 priceIndex;
        uint256 baseBorrowRate; // in basis points (100 = 1%)
        uint256 collateralFactor; // in basis points (8000 = 80%)
        bool isActive;
    }
    
    // User position tracking
    struct UserPosition {
        uint256 collateralValue; // in USD (8 decimals)
        uint256 borrowedValue;   // in USD (8 decimals)
        uint256 lastInterestUpdate;
        bool isLiquidatable;
    }
    
    mapping(string => bool) public validDIDs;
    mapping(address => DIDInfo) public didRegistry;
    mapping(address => bool) public isVerified;
    mapping(address => string) public userDID;
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrowedAmounts;
    mapping(address => UserPosition) public userPositions;
    mapping(string => Asset) public supportedAssets;
    
    address public owner;
    uint256 public constant MIN_USDC_PRICE = 99000000; // $0.99 in 8 decimals
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80%
    uint256 public constant LIQUIDATION_BONUS = 500; // 5%
    uint256 public constant INTEREST_RATE_PRECISION = 10000;
    uint256 public constant USD_PRECISION = 1e8;
    
    uint256 public lastUpkeepTime;
    uint256 public upkeepInterval = 3600; // 1 hour
    
    // SOLUTION: Make staleness threshold configurable for testnet
    uint256 public priceDataStaleThreshold = 86400; // 24 hours for testnet (was 1 hour)
    
    // Events
    event DIDVerified(address indexed user, string did, uint256 creditScore);
    event AccessGranted(address indexed user);
    event AccessDenied(address indexed user, string reason);
    event LiquidationExecuted(address indexed user, uint256 collateralLiquidated, uint256 debtRepaid);
    event InterestRateUpdated(string asset, uint256 newRate);
    event AssetAdded(string symbol, uint256 priceIndex);
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    event PriceDataStaleThresholdUpdated(uint256 newThreshold);

    constructor(address[] memory _priceFeedAddresses) {
        require(_priceFeedAddresses.length == 3, "Must provide 3 price feeds");
        owner = msg.sender;
        lastUpkeepTime = block.timestamp;
        
        for (uint256 i = 0; i < _priceFeedAddresses.length; i++) {
            priceFeeds.push(AggregatorV3Interface(_priceFeedAddresses[i]));
        }
        
        // Initialize supported assets
        supportedAssets["USDC"] = Asset("USDC", 0, 310, 9000, true); // 3.1% base rate, 90% collateral factor
        supportedAssets["ETH"] = Asset("ETH", 1, 520, 8000, true); // 5.2% base rate, 80% collateral factor
        supportedAssets["BTC"] = Asset("BTC", 2, 480, 7500, true); // 4.8% base rate, 75% collateral factor
        
        // Initialize valid DIDs
        validDIDs["user123"] = true;
        validDIDs["user456"] = true;
        validDIDs["user789"] = true;
        validDIDs["demo_user"] = true;
        validDIDs["test_verified"] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyVerified() {
        require(isVerified[msg.sender], "Must be verified to access this function");
        _;
    }

    // SOLUTION: Enhanced price feed functions with better error handling
    function getLatestPrice(uint256 index) public view returns (int) {
        require(index < priceFeeds.length, "Invalid price feed index");
        
        try priceFeeds[index].latestRoundData() returns (
            uint80, // roundId
            int price,
            uint256, // startedAt
            uint256 updatedAt,
            uint80 // answeredInRound
        ) {
            require(price > 0, "Invalid price");
            require(block.timestamp - updatedAt <= priceDataStaleThreshold, "Price data stale");
            return price;
        } catch {
            revert("Failed to get price data");
        }
    }
    
    // SOLUTION: Add function to get price without staleness check (for emergencies)
    function getLatestPriceUnsafe(uint256 index) public view returns (int, uint256) {
        require(index < priceFeeds.length, "Invalid price feed index");
        (, int price, , uint256 updatedAt, ) = priceFeeds[index].latestRoundData();
        return (price, updatedAt);
    }

    function getAllPrices() public view returns (int[] memory) {
        int[] memory prices = new int[](priceFeeds.length);
        for (uint256 i = 0; i < priceFeeds.length; i++) {
            prices[i] = getLatestPrice(i);
        }
        return prices;
    }
    
    // SOLUTION: Add function to check price feed health
    function checkPriceFeedHealth(uint256 index) public view returns (
        bool isHealthy,
        int price,
        uint256 lastUpdated,
        uint256 hoursSinceUpdate
    ) {
        require(index < priceFeeds.length, "Invalid price feed index");
        
        (, int latestPrice, , uint256 updatedAt, ) = priceFeeds[index].latestRoundData();
        uint256 timeSinceUpdate = block.timestamp - updatedAt;
        
        return (
            timeSinceUpdate <= priceDataStaleThreshold && latestPrice > 0,
            latestPrice,
            updatedAt,
            timeSinceUpdate / 3600
        );
    }

    // Enhanced DID verification with credit scoring
    function verifyDIDAndAccess(string memory _did) public {
        require(bytes(_did).length > 0, "DID cannot be empty");
        
        if (!validDIDs[_did]) {
            isVerified[msg.sender] = false;
            emit AccessDenied(msg.sender, "Invalid DID");
            return;
        }
        
        // SOLUTION: Use try-catch for price checking to handle stale data gracefully
        try this.getLatestPrice(0) returns (int usdcPrice) {
            if (usdcPrice < int(MIN_USDC_PRICE)) {
                isVerified[msg.sender] = false;
                emit AccessDenied(msg.sender, "Market unstable");
                return;
            }
        } catch {
            // If USDC price is unavailable, use fallback logic
            emit AccessDenied(msg.sender, "Price data unavailable");
            return;
        }
        
        // Calculate initial credit score based on market conditions
        uint256 creditScore = calculateInitialCreditScore();
        
        // Update DID registry
        didRegistry[msg.sender] = DIDInfo({
            did: _did,
            verificationTime: block.timestamp,
            creditScore: creditScore,
            isActive: true,
            reputationPoints: 100, // Starting reputation
            totalBorrowed: 0,
            totalRepaid: 0
        });
        
        isVerified[msg.sender] = true;
        userDID[msg.sender] = _did;
        
        emit DIDVerified(msg.sender, _did, creditScore);
        emit AccessGranted(msg.sender);
    }

    function calculateInitialCreditScore() internal view returns (uint256) {
        // Base score of 750
        uint256 baseScore = 750;
        
        // SOLUTION: Use try-catch for price-based adjustments
        try this.getLatestPrice(1) returns (int ethPrice) {
            if (ethPrice > 4000e8) baseScore += 50; // Strong ETH market
        } catch {
            // Continue with base score if ETH price unavailable
        }
        
        try this.getLatestPrice(2) returns (int btcPrice) {
            if (btcPrice > 70000e8) baseScore += 50; // Strong BTC market
        } catch {
            // Continue with base score if BTC price unavailable
        }
        
        return baseScore > 850 ? 850 : baseScore; // Cap at 850
    }

    // Dynamic interest rate calculation with error handling
    function getDynamicBorrowRate(string memory asset) public view returns (uint256) {
        Asset memory assetInfo = supportedAssets[asset];
        require(assetInfo.isActive, "Asset not supported");
        
        uint256 baseRate = assetInfo.baseBorrowRate;
        
        // SOLUTION: Use try-catch for price-based rate adjustments
        try this.getLatestPrice(assetInfo.priceIndex) returns (int price) {
            // Adjust rate based on price volatility and market conditions
            if (keccak256(bytes(asset)) == keccak256(bytes("ETH"))) {
                if (price > 4000e8) return baseRate - 50; // Lower rate for high ETH price
                if (price < 2000e8) return baseRate + 100; // Higher rate for low ETH price
            }
        } catch {
            // Return base rate if price unavailable
        }
        
        return baseRate;
    }

    // Enhanced deposit function
    function deposit() external payable onlyVerified {
        require(msg.value > 0, "Must send ETH");
        
        deposits[msg.sender] += msg.value;
        
        // Update user position
        updateUserPosition(msg.sender);
        
        // Update reputation
        didRegistry[msg.sender].reputationPoints += 10;
    }

    // Enhanced borrow function with dynamic rates
    function borrow(uint256 amount) external onlyVerified {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient pool funds");
        
        // Update user position first
        updateUserPosition(msg.sender);
        
        // Check if user can borrow this amount
        require(canBorrow(msg.sender, amount), "Insufficient collateral or exceeds limit");
        
        borrowedAmounts[msg.sender] += amount;
        
        // SOLUTION: Use try-catch for price conversion
        try this.getLatestPrice(1) returns (int ethPrice) {
            userPositions[msg.sender].borrowedValue += (amount * uint256(ethPrice)) / 1e10;
        } catch {
            // Use a fallback price or revert
            revert("Cannot determine ETH price for borrowing");
        }
        
        userPositions[msg.sender].lastInterestUpdate = block.timestamp;
        
        // Update DID info
        didRegistry[msg.sender].totalBorrowed += amount;
        
        payable(msg.sender).transfer(amount);
    }

    function canBorrow(address user, uint256 amount) internal view returns (bool) {
        UserPosition memory position = userPositions[user];
        
        // SOLUTION: Use try-catch for price-dependent calculations
        try this.getLatestPrice(1) returns (int ethPrice) {
            uint256 newBorrowedValue = position.borrowedValue + (amount * uint256(ethPrice)) / 1e10;
            uint256 maxBorrowable = (position.collateralValue * LIQUIDATION_THRESHOLD) / 10000;
            return newBorrowedValue <= maxBorrowable;
        } catch {
            return false; // Reject borrowing if price unavailable
        }
    }

    function updateUserPosition(address user) internal {
        if (deposits[user] == 0) return;
        
        // SOLUTION: Use try-catch for position updates
        try this.getLatestPrice(1) returns (int ethPrice) {
            uint256 collateralValue = (deposits[user] * uint256(ethPrice)) / 1e10;
            userPositions[user].collateralValue = collateralValue;
            userPositions[user].isLiquidatable = isPositionLiquidatable(user);
        } catch {
            // Position update failed due to price unavailability
        }
    }

    function isPositionLiquidatable(address user) internal view returns (bool) {
        UserPosition memory position = userPositions[user];
        if (position.borrowedValue == 0) return false;
        
        uint256 collateralRatio = (position.collateralValue * 10000) / position.borrowedValue;
        return collateralRatio < LIQUIDATION_THRESHOLD;
    }

    // Chainlink Automation functions
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastUpkeepTime) > upkeepInterval;
        performData = "";
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpkeepTime) > upkeepInterval) {
            lastUpkeepTime = block.timestamp;
            updateInterestRates();
        }
    }

    function updateInterestRates() internal {
        // Update ETH rate
        uint256 newEthRate = getDynamicBorrowRate("ETH");
        supportedAssets["ETH"].baseBorrowRate = newEthRate;
        emit InterestRateUpdated("ETH", newEthRate);
        
        // Update other assets similarly
        uint256 newUsdcRate = getDynamicBorrowRate("USDC");
        supportedAssets["USDC"].baseBorrowRate = newUsdcRate;
        emit InterestRateUpdated("USDC", newUsdcRate);
    }

    // Liquidation function
    function liquidate(address user) external {
        require(isPositionLiquidatable(user), "Position not liquidatable");
        
        UserPosition storage position = userPositions[user];
        uint256 collateralToLiquidate = (deposits[user] * 5000) / 10000;
        uint256 debtToRepaid = position.borrowedValue;
        
        uint256 liquidatorReward = collateralToLiquidate + (collateralToLiquidate * LIQUIDATION_BONUS) / 10000;
        
        deposits[user] -= collateralToLiquidate;
        borrowedAmounts[user] = 0;
        position.borrowedValue = 0;
        
        // SOLUTION: Use try-catch for price-dependent calculations
        try this.getLatestPrice(1) returns (int ethPrice) {
            position.collateralValue -= (collateralToLiquidate * uint256(ethPrice)) / 1e10;
        } catch {
            // Handle liquidation without precise price conversion
            position.collateralValue = 0;
        }
        
        if (didRegistry[user].creditScore > 100) {
            didRegistry[user].creditScore -= 100;
        }
        
        require(liquidatorReward > 0, "Invalid liquidation reward");
        emit LiquidationExecuted(user, collateralToLiquidate, debtToRepaid);
    }

    // View functions
    function checkUserAccess(address user) public view returns (bool) {
        return isVerified[user];
    }

    function getDepositBalance(address user) public view returns (uint256) {
        return deposits[user];
    }

    function getUserPosition(address user) public view returns (UserPosition memory) {
        return userPositions[user];
    }

    function getDIDInfo(address user) public view returns (DIDInfo memory) {
        return didRegistry[user];
    }

    function getAssetInfo(string memory asset) public view returns (Asset memory) {
        return supportedAssets[asset];
    }

    function getPriceFormatted(uint256 index) public view returns (string memory) {
        try this.getLatestPrice(index) returns (int price) {
            return string(abi.encodePacked("$", uint2str(uint(price) / 100000000), ".", uint2str((uint(price) % 100000000) / 1000000)));
        } catch {
            return "Price unavailable";
        }
    }

    function getCollateralRatio(address user) public view returns (uint256) {
        UserPosition memory position = userPositions[user];
        if (position.borrowedValue == 0) return 0;
        return (position.collateralValue * 10000) / position.borrowedValue;
    }

    function getLiquidationPrice(address user) public view returns (uint256) {
        if (borrowedAmounts[user] == 0) return 0;
        uint256 ethAmount = deposits[user];
        uint256 borrowedUsd = userPositions[user].borrowedValue;
        return (borrowedUsd * 10000 * 1e10) / (ethAmount * LIQUIDATION_THRESHOLD);
    }

    // SOLUTION: Admin functions to manage price data staleness
    function setPriceDataStaleThreshold(uint256 newThreshold) public onlyOwner {
        priceDataStaleThreshold = newThreshold;
        emit PriceDataStaleThresholdUpdated(newThreshold);
    }

    function addValidDID(string memory _did) public onlyOwner {
        validDIDs[_did] = true;
    }

    function addAsset(string memory symbol, uint256 priceIndex, uint256 borrowRate, uint256 collateralFactor) public onlyOwner {
        supportedAssets[symbol] = Asset(symbol, priceIndex, borrowRate, collateralFactor, true);
        emit AssetAdded(symbol, priceIndex);
    }

    function updateUpkeepInterval(uint256 newInterval) public onlyOwner {
        upkeepInterval = newInterval;
    }

    // Utility functions
    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function pause() external onlyOwner {
        // Implement pause functionality
    }

    receive() external payable {}
}