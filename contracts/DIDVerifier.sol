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
    
    // Events
    event DIDVerified(address indexed user, string did, uint256 creditScore);
    event AccessGranted(address indexed user);
    event AccessDenied(address indexed user, string reason);
    event LiquidationExecuted(address indexed user, uint256 collateralLiquidated, uint256 debtRepaid);
    event InterestRateUpdated(string asset, uint256 newRate);
    event AssetAdded(string symbol, uint256 priceIndex);
    event CreditScoreUpdated(address indexed user, uint256 newScore);

    constructor(address[] memory _priceFeedAddresses) {
        require(_priceFeedAddresses.length == 3, "Must provide 3 price feeds");
        owner = msg.sender;
        lastUpkeepTime = block.timestamp;
        
        for (uint256 i = 0; i < _priceFeedAddresses.length; i++) {
            priceFeeds.push(AggregatorV3Interface(_priceFeedAddresses[i]));
        }
        
        // Initialize supported assets
        supportedAssets["ETH"] = Asset("ETH", 1, 520, 8000, true); // 5.2% base rate, 80% collateral factor
        supportedAssets["USDC"] = Asset("USDC", 0, 310, 9000, true); // 3.1% base rate, 90% collateral factor
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

    // Chainlink price feed functions
    function getLatestPrice(uint256 index) public view returns (int) {
        require(index < priceFeeds.length, "Invalid price feed index");
        (, int price, , uint256 updatedAt, ) = priceFeeds[index].latestRoundData();
        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= 1 hours, "Price data stale");
        return price;
    }

    function getAllPrices() public view returns (int[] memory) {
        int[] memory prices = new int[](priceFeeds.length);
        for (uint256 i = 0; i < priceFeeds.length; i++) {
            prices[i] = getLatestPrice(i);
        }
        return prices;
    }

    // Enhanced DID verification with credit scoring
    function verifyDIDAndAccess(string memory _did) public {
        require(bytes(_did).length > 0, "DID cannot be empty");
        
        if (!validDIDs[_did]) {
            isVerified[msg.sender] = false;
            emit AccessDenied(msg.sender, "Invalid DID");
            return;
        }
        
        // Check market stability
        int usdcPrice = getLatestPrice(0);
        if (usdcPrice < int(MIN_USDC_PRICE)) {
            isVerified[msg.sender] = false;
            emit AccessDenied(msg.sender, "Market unstable");
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
        int ethPrice = getLatestPrice(1);
        int btcPrice = getLatestPrice(2);
        
        // Base score of 750
        uint256 baseScore = 750;
        
        // Adjust based on market conditions
        if (ethPrice > 4000e8) baseScore += 50; // Strong ETH market
        if (btcPrice > 70000e8) baseScore += 50; // Strong BTC market
        
        return baseScore > 850 ? 850 : baseScore; // Cap at 850
    }

    // Dynamic interest rate calculation
    function getDynamicBorrowRate(string memory asset) public view returns (uint256) {
        Asset memory assetInfo = supportedAssets[asset];
        require(assetInfo.isActive, "Asset not supported");
        
        int price = getLatestPrice(assetInfo.priceIndex);
        uint256 baseRate = assetInfo.baseBorrowRate;
        
        // Adjust rate based on price volatility and market conditions
        if (keccak256(bytes(asset)) == keccak256(bytes("ETH"))) {
            if (price > 4000e8) return baseRate - 50; // Lower rate for high ETH price
            if (price < 2000e8) return baseRate + 100; // Higher rate for low ETH price
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
        
        // Calculate dynamic interest rate
        uint256 currentRate = getDynamicBorrowRate("ETH");
        
        borrowedAmounts[msg.sender] += amount;
        userPositions[msg.sender].borrowedValue += (amount * uint256(getLatestPrice(1))) / 1e10; // Convert to 8 decimals
        userPositions[msg.sender].lastInterestUpdate = block.timestamp;
        
        // Update DID info
        didRegistry[msg.sender].totalBorrowed += amount;
        
        payable(msg.sender).transfer(amount);
    }

    function canBorrow(address user, uint256 amount) internal view returns (bool) {
        UserPosition memory position = userPositions[user];
        uint256 newBorrowedValue = position.borrowedValue + (amount * uint256(getLatestPrice(1))) / 1e10;
        
        // Check if new borrowed amount exceeds collateral threshold
        uint256 maxBorrowable = (position.collateralValue * LIQUIDATION_THRESHOLD) / 10000;
        
        return newBorrowedValue <= maxBorrowable;
    }

    function updateUserPosition(address user) internal {
        if (deposits[user] == 0) return;
        
        uint256 ethPrice = uint256(getLatestPrice(1));
        uint256 collateralValue = (deposits[user] * ethPrice) / 1e10; // Convert to 8 decimals
        
        userPositions[user].collateralValue = collateralValue;
        userPositions[user].isLiquidatable = isPositionLiquidatable(user);
    }

    function isPositionLiquidatable(address user) internal view returns (bool) {
        UserPosition memory position = userPositions[user];
        if (position.borrowedValue == 0) return false;
        
        uint256 collateralRatio = (position.collateralValue * 10000) / position.borrowedValue;
        return collateralRatio < LIQUIDATION_THRESHOLD;
    }

    // Chainlink Automation functions
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastUpkeepTime) > upkeepInterval;
        // Could also check for positions that need liquidation
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpkeepTime) > upkeepInterval) {
            lastUpkeepTime = block.timestamp;
            // Update interest rates based on current market conditions
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
        uint256 collateralToLiquidate = (deposits[user] * 5000) / 10000; // 50% of collateral
        uint256 debtToRepay = position.borrowedValue;
        
        // Transfer collateral to liquidator (with bonus)
        uint256 liquidatorReward = collateralToLiquidate + (collateralToLiquidate * LIQUIDATION_BONUS) / 10000;
        
        deposits[user] -= collateralToLiquidate;
        borrowedAmounts[user] = 0;
        position.borrowedValue = 0;
        position.collateralValue -= (collateralToLiquidate * uint256(getLatestPrice(1))) / 1e10;
        
        // Update credit score negatively
        if (didRegistry[user].creditScore > 100) {
            didRegistry[user].creditScore -= 100;
        }
        
        emit LiquidationExecuted(user, collateralToLiquidate, debtToRepay);
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
        int price = getLatestPrice(index);
        return string(abi.encodePacked("$", uint2str(uint(price) / 100000000), ".", uint2str((uint(price) % 100000000) / 1000000)));
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

    // Admin functions
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