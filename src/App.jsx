import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { 
  DollarSign, Send, Lock, Wallet, ArrowDown, ArrowUp, Shield, TrendingUp, 
  Zap, CheckCircle, XCircle, AlertCircle, Globe, Activity, Sparkles, 
  BarChart3, Clock, Users, Award, RefreshCw, AlertTriangle, Eye,
  Coins, CreditCard, Target, Settings, TrendingDown, Heart,
  Database, Signal, Gauge, Timer, Layers, Code
} from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { CONTRACT_ADDRESS, CONTRACT_ABI, SUPPORTED_ASSETS } from './contractConfig';
import './App.css';

function App() {
  // Core state
  const [contract, setContract] = useState(null);
  const [didInput, setDidInput] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [balance, setBalance] = useState('0');
  const [borrowedAmount, setBorrowedAmount] = useState('0');
  const [prices, setPrices] = useState({ usdc: 'Loading...', eth: 'Loading...', btc: 'Loading...' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Enhanced state for new contract features
  const [userPosition, setUserPosition] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [collateralRatio, setCollateralRatio] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [dynamicRates, setDynamicRates] = useState({});
  const [assetInfo, setAssetInfo] = useState({});
  const [priceUpdateTime, setPriceUpdateTime] = useState(null);
  const [priceDataHealth, setPriceDataHealth] = useState({});
  const [upkeepInfo, setUpkeepInfo] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const { address: account, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const isMobile = useMediaQuery({ maxWidth: 640 });

  useEffect(() => {
    if (chainId && chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
    }
  }, [chainId, switchChain]);

  const checkPriceFeedHealth = async (contractInstance) => {
    const healthStatus = {};
    for (let i = 0; i < 3; i++) {
      try {
        const health = await contractInstance.checkPriceFeedHealth(i);
        const symbols = ['USDC', 'ETH', 'BTC'];
        healthStatus[symbols[i]] = {
          isHealthy: health[0],
          price: health[1],
          lastUpdated: new Date(Number(health[2]) * 1000),
          hoursSinceUpdate: Number(health[3])
        };
      } catch (error) {
        console.error(`Health check failed for feed ${i}:`, error);
      }
    }
    setPriceDataHealth(healthStatus);
  };

  const fetchContractData = async (contractInstance) => {
    try {
      const verified = await contractInstance.checkUserAccess(account);
      const bal = await contractInstance.getDepositBalance(account);
      const borrowed = await contractInstance.borrowedAmounts(account);
      
      setIsVerified(verified);
      setBalance(ethers.formatEther(bal));
      setBorrowedAmount(ethers.formatEther(borrowed));

      await checkPriceFeedHealth(contractInstance);
      
      const pricePromises = [
        contractInstance.getPriceFormatted(0).catch(() => 'Price unavailable'),
        contractInstance.getPriceFormatted(1).catch(() => 'Price unavailable'),
        contractInstance.getPriceFormatted(2).catch(() => 'Price unavailable')
      ];
      
      const [usdcPrice, ethPrice, btcPrice] = await Promise.all(pricePromises);
      setPrices({ usdc: usdcPrice, eth: ethPrice, btc: btcPrice });
      setPriceUpdateTime(new Date());

      const hasUnhealthyFeeds = Object.values(priceDataHealth).some(feed => !feed.isHealthy);
      setEmergencyMode(hasUnhealthyFeeds);

      if (verified) {
        const position = await contractInstance.getUserPosition(account);
        const did = await contractInstance.getDIDInfo(account);
        const colRatio = await contractInstance.getCollateralRatio(account);
        const liqPrice = await contractInstance.getLiquidationPrice(account);
        
        setUserPosition(position);
        setDidInfo(did);
        setCollateralRatio(Number(colRatio));
        setLiquidationPrice(ethers.formatEther(liqPrice));

        const rates = {};
        const assets = {};
        const assetSymbols = ['USDC', 'ETH', 'BTC'];
        
        for (const symbol of assetSymbols) {
          try {
            rates[symbol] = await contractInstance.getDynamicBorrowRate(symbol);
            assets[symbol] = await contractInstance.getAssetInfo(symbol);
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            rates[symbol] = symbol === 'ETH' ? 520 : symbol === 'BTC' ? 480 : 310;
          }
        }
        setDynamicRates(rates);
        setAssetInfo(assets);

        try {
          const upkeepNeeded = await contractInstance.checkUpkeep('0x');
          setUpkeepInfo({ needed: upkeepNeeded[0] });
        } catch (error) {
          console.error('Upkeep check failed:', error);
        }
      }
    } catch (error) {
      setMessage('Error fetching contract data - some features may be limited');
      console.error('Contract data fetch error:', error);
      setPrices({ usdc: 'Offline: $1.00', eth: 'Offline: $3,245.67', btc: 'Offline: $68,420.50' });
      setEmergencyMode(true);
    }
  };

  useEffect(() => {
    if (account && window.ethereum && chainId === sepolia.id) {
      const initContract = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setContract(contractInstance);
          await fetchContractData(contractInstance);
        } catch (error) {
          setMessage('Error initializing contract');
          console.error('Contract initialization error:', error);
        }
      };
      initContract();
    }
  }, [account, chainId]);

  useEffect(() => {
    if (!contract) return;

    const handleAccessGranted = (user) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setIsVerified(true);
        setMessage('✨ Access Granted! Identity Verified Successfully');
        fetchContractData(contract);
      }
    };

    const handleAccessDenied = (user, reason) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setIsVerified(false);
        const reasonMap = {
          'Invalid DID': 'Invalid DID provided',
          'Market unstable': 'Market conditions unstable (USDC price below threshold)',
          'Price data unavailable': 'Chainlink price feeds temporarily unavailable'
        };
        setMessage(`❌ Access Denied: ${reasonMap[reason] || reason}`);
      }
    };

    const handleDIDVerified = (user, did, creditScore) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setMessage(`🎉 DID Verified! Credit Score: ${creditScore}`);
      }
    };

    const handleLiquidation = (user, collateralLiquidated, debtRepaid) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setMessage(`⚠️ Position Liquidated! Collateral: ${ethers.formatEther(collateralLiquidated)} ETH, Debt: ${ethers.formatEther(debtRepaid)} ETH`);
        fetchContractData(contract);
      }
    };

    const handleInterestRateUpdate = (asset, newRate) => {
      setMessage(`📈 Interest rate updated for ${asset}: ${Number(newRate) / 100}%`);
      fetchContractData(contract);
    };

    const handleCreditScoreUpdate = (user, newScore) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setMessage(`📊 Credit Score Updated: ${newScore}`);
        fetchContractData(contract);
      }
    };

    const handleAssetAdded = (symbol, priceIndex) => {
      setMessage(`🆕 New Asset Added: ${symbol} (Price Feed Index: ${priceIndex})`);
      fetchContractData(contract);
    };

    contract.on('AccessGranted', handleAccessGranted);
    contract.on('AccessDenied', handleAccessDenied);
    contract.on('DIDVerified', handleDIDVerified);
    contract.on('LiquidationExecuted', handleLiquidation);
    contract.on('InterestRateUpdated', handleInterestRateUpdate);
    contract.on('CreditScoreUpdated', handleCreditScoreUpdate);
    contract.on('AssetAdded', handleAssetAdded);

    return () => {
      contract.off('AccessGranted', handleAccessGranted);
      contract.off('AccessDenied', handleAccessDenied);
      contract.off('DIDVerified', handleDIDVerified);
      contract.off('LiquidationExecuted', handleLiquidation);
      contract.off('InterestRateUpdated', handleInterestRateUpdate);
      contract.off('CreditScoreUpdated', handleCreditScoreUpdate);
      contract.off('AssetAdded', handleAssetAdded);
    };
  }, [contract, account]);

  const verifyDID = async () => {
    if (!contract || !didInput) return;
    setLoading(true);
    setMessage('🔍 Verifying your decentralized identity...');
    try {
      const tx = await contract.verifyDIDAndAccess(didInput);
      setMessage('⏳ Transaction submitted, waiting for confirmation...');
      await tx.wait();
      await fetchContractData(contract);
    } catch (error) {
      if (error.message.includes('Market unstable')) {
        setMessage('❌ Verification failed: Market conditions unstable (USDC price too low)');
      } else if (error.message.includes('Price data unavailable')) {
        setMessage('❌ Verification failed: Chainlink price feeds temporarily unavailable');
      } else {
        setMessage('❌ Verification failed. Please check your DID and try again.');
      }
      console.error('DID verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const depositETH = async () => {
    if (!contract || !depositAmount) return;
    setLoading(true);
    setMessage('💫 Processing your deposit...');
    try {
      const tx = await contract.deposit({ value: ethers.parseEther(depositAmount) });
      setMessage('⏳ Deposit transaction submitted...');
      await tx.wait();
      await fetchContractData(contract);
      setDepositAmount('');
      setMessage('✅ Deposit successful! Your funds are now earning interest.');
    } catch (error) {
      setMessage('❌ Deposit failed. Please check your balance and try again.');
      console.error('Deposit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const borrowETH = async () => {
    if (!contract || !borrowAmount) return;
    setLoading(true);
    setMessage('🚀 Processing your borrow request...');
    try {
      const tx = await contract.borrow(ethers.parseEther(borrowAmount));
      setMessage('⏳ Borrow transaction submitted...');
      await tx.wait();
      await fetchContractData(contract);
      setBorrowAmount('');
      setMessage(`✅ Borrow successful! ${borrowAmount} ETH has been transferred to your wallet.`);
    } catch (error) {
      if (error.message.includes('Cannot determine ETH price')) {
        setMessage('❌ Borrow failed: ETH price unavailable from Chainlink feeds');
      } else if (error.message.includes('Insufficient collateral')) {
        setMessage('❌ Borrow failed: Insufficient collateral for this amount');
      } else {
        setMessage('❌ Borrow failed. Check your collateral and market conditions.');
      }
      console.error('Borrow error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    if (!contract) return;
    setMessage('🔄 Refreshing live prices from Chainlink...');
    try {
      await fetchContractData(contract);
      setMessage('✅ Prices updated successfully!');
    } catch (error) {
      setMessage('❌ Failed to refresh prices - Chainlink feeds may be experiencing issues');
    }
  };

  const StatusBadge = ({ isVerified }) => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium  ${
      isVerified ? 'text-green-600' : 'text-red-800'
    }`}>
      {isVerified ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
      {isVerified ? 'Verified' : 'Unverified'}
    </div>
  );

  const PriceCard = ({ symbol, price, change, icon, gradient, subtitle, healthStatus }) => (
    <div className={`price-card ${gradient} ${!healthStatus?.isHealthy ? 'unhealthy' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="price-symbol">{symbol}</span>
          {subtitle && <div className="price-subtitle">{subtitle}</div>}
        </div>
        <div className="price-icon-container">
          <div className="price-icon">{icon}</div>
          {healthStatus && (
            <div className={`health-indicator ${healthStatus.isHealthy ? 'healthy' : 'unhealthy'}`}>
              {healthStatus.isHealthy ? (
                <Signal className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
      </div>
      <p className="price-value">{price}</p>
      <p className="price-change">{change}</p>
      {healthStatus && !healthStatus.isHealthy && (
        <div className="price-warning">
          <span className="text-xs">Data {healthStatus.hoursSinceUpdate}h old</span>
        </div>
      )}
    </div>
  );

  const RiskIndicator = ({ ratio }) => {
    const getRiskLevel = (ratio) => {
      if (ratio >= 200) return { level: 'Safe', color: 'text-green-600', bg: 'bg' };
      if (ratio >= 150) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg' };
      return { level: 'High Risk', color: 'text-red-600', bg: 'bg' };
    };
    const risk = getRiskLevel(ratio);
    const Icon = risk.color.includes('green') ? CheckCircle : risk.color.includes('yellow') ? AlertCircle : AlertTriangle;
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full ${risk.bg} ${risk.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span className="font-medium">{risk.level}</span>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="brand-text">
              <h1 className="brand-title">ChainGuard DeFi</h1>
              <p className="brand-subtitle">Chainlink-Powered Identity & Lending</p>
            </div>
            </div>
          </div>
          <div className="wallet-connection">
            <ConnectButton />
          </div>
        </div>
      </header>

     {/* Emergency Mode Banner */}
      {emergencyMode && (
        <div className="emergency-banner">
          <AlertTriangle className="w-5 h-5 yellow-400" />
          Emergency Mode: Some Chainlink price feeds are experiencing issues. Limited functionality available.
        </div>
      )}

      <main className="main-content">
        {account ? (
          chainId === sepolia.id ? (
            <div className="content-grid">
              {/* Hero Stats */}
              <div className="hero-stats">
                <div className="stat-card balance-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Collateral Balance</p>
                      <p className="text-2xl font-bold text-white-900 ">{balance} ETH</p>
                      <p className="text-sm text-white-50 opacity-90">${userPosition ? (Number(userPosition.collateralValue) / 1e16).toFixed(2) : '0.00'}</p>
                    </div>
                    <Wallet className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="stat-card status-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Identity Status</p>
                      <StatusBadge isVerified={isVerified} />
                      {didInfo && <p className="text-sm text-white-50 opacity-90">Score : {didInfo.creditScore?.toString()}</p>}
                    </div>
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="stat-card borrow-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Borrowed Amount</p>
                      <p className="text-2xl font-bold text-white-900">{borrowedAmount} ETH</p>
                      <p className="text-sm text-white-50 opacity-90">${userPosition ? (Number(userPosition.borrowedValue) / 1e16).toFixed(4) : '0.00'}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

               <div className="stat-card ratio-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Health Factor</p>
                      <p className="text-2xl font-bold text-white-900">{(collateralRatio / 100).toFixed(1)}%</p>
                      <RiskIndicator ratio={collateralRatio} />
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Price Feeds */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <DollarSign className="section-icon" />
                    <h2 className="text-xl font-bold text-white-800">Chainlink Price Feeds</h2>
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </div>
                 <div className="header-actions flex justify-between items-center w-full">
                    {upkeepInfo?.needed && (
                      <div className="flex items-center gap-1 text-blue-400 text-xs px-2 py-1 rounded-full">
                        <Timer className="w-4 h-4" />
                        <span>Upkeep Needed</span>
                        <button
                          onClick={refreshPrices}
                          disabled={loading}
                          className="p-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    )}

                    {!upkeepInfo?.needed && (
                      <button
                        onClick={refreshPrices}
                        disabled={loading}
                        className="p-2 rounded-full transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                  </div>
                <div className={`prices-grid ${isMobile ? 'mobile' : ''}`}>
                  <PriceCard
                    symbol="USDC/USD"
                    price={prices.usdc}
                    change="+0.01%"
                    icon="$"
                    gradient="usdc-gradient"
                    subtitle="Stablecoin Reference"
                    healthStatus={priceDataHealth.USDC}
                  />
                  <PriceCard
                    symbol="ETH/USD"
                    price={prices.eth}
                    change="+2.45%"
                    icon="Ξ"
                    gradient="eth-gradient"
                    subtitle="Primary Collateral"
                    healthStatus={priceDataHealth.ETH}
                  />
                  <PriceCard
                    symbol="BTC/USD"
                    price={prices.btc}
                    change="+1.23%"
                    icon="₿"
                    gradient="btc-gradient"
                    subtitle="Market Reference"
                    healthStatus={priceDataHealth.BTC}
                  />
                </div>
                <div className="price-feed-info">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {priceUpdateTime && `Last updated: ${priceUpdateTime.toLocaleTimeString()}`}
                  </div>
                </div>
              </div>

              {/* Identity Verification */}
              <div className="section-card">
                <div className="section-title">
                  <div className="flex items-center gap-2">
                    <Lock className="section-icon" />
                    <h2 className="text-xl font-bold text-white-900">DID Verification</h2>
                  </div>
                </div>
                <div className="verification-form">
                  <div className="input-group">
                    <label className="input-label">Decentralized Identifier (DID)</label>
                    <input
                      type="text"
                      placeholder="Enter your DID (e.g., user123, demo_user)"
                      value={didInput}
                      onChange={(e) => setDidInput(e.target.value)}
                      className="form-input"
                    />
                    <p className="input-hint">Valid test DIDs: user123, user456, user789, demo_user, test_verified<br /><span className="text-yellow-500">Note: Requires USDC price ≥ $0.99</span></p>
                  </div>
                  <button
                    onClick={verifyDID}
                    disabled={loading || !didInput}
                    className="btn btn-primary btn-verify"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Verifying Identity...' : 'Verify DID'}
                  </button>
                  <div className="status-display">
                    <span className="status-label">Status:</span>
                    <StatusBadge isVerified={isVerified} />
                  </div>
                  {/* Enhanced DID Info Display */}
                  {didInfo && (
                    <div className="did-info-card">
                      <h4 className="did-info-title text-lg font-bold">Identity Profile</h4>
                      <div className="did-info-grid">
                        <div className="did-info-item">
                          <span className="did-label">DID : </span>
                          <span className="did-value">{didInfo.did}</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Credit Score : </span>
                          <span className="did-value">{didInfo.creditScore?.toString()}</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Reputation Points : </span>
                          <span className="did-value">{didInfo.reputationPoints?.toString()}</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Total Borrowed : </span>
                          <span className="did-value">{ethers.formatEther(didInfo.totalBorrowed || 0)} ETH</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Total Repaid : </span>
                          <span className="did-value">{ethers.formatEther(didInfo.totalRepaid || 0)} ETH</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Account Status : </span>
                          <span className={`did-value ${didInfo.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {didInfo.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              
                </div>
              </div>

               <section className="section-card">
                <h2 className="section-title">
                  <Layers className="section-icon" /> 
                  Multi-Asset Support & Dynamic Rates
                </h2>
                
                <div className="assets-grid">
                  {Object.entries(assetInfo).map(([symbol, asset]) => (
                    <div key={symbol} className="asset-card">
                      <div className="asset-header">
                        <h4 className="asset-symbol">{symbol}</h4>
                        <div className={`asset-status ${asset.isActive ? 'active' : 'inactive'}`}>
                          {asset.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                      </div>
                      
                      <div className="asset-details">
                        <div className="asset-detail">
                          <span className="detail-label">Base Rate:</span>
                          <span className="detail-value">{(Number(asset.baseBorrowRate || 0) / 100).toFixed(2)}%</span>
                        </div>
                        <div className="asset-detail">
                          <span className="detail-label">Dynamic Rate:</span>
                          <span className="detail-value text-blue-400">
                            {dynamicRates[symbol] ? (Number(dynamicRates[symbol]) / 100).toFixed(2) : 'N/A'}%
                          </span>
                        </div>
                        <div className="asset-detail">
                          <span className="detail-label">Collateral Factor:</span>
                          <span className="detail-value">{(Number(asset.collateralFactor || 0) / 100).toFixed(0)}%</span>
                        </div>
                        <div className="asset-detail">
                          <span className="detail-label">Price Feed Index:</span>
                          <span className="detail-value">{Number(asset.priceIndex || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Enhanced Lending Operations */}
              <section className="section-card">
                <h2 className="section-title">
                  <Wallet className="section-icon" /> 
                  DeFi Lending Operations with Dynamic Rates
                </h2>
                
                <div className={`lending-grid ${isMobile ? 'mobile' : ''}`}>
                  <div className="lending-section deposit-section">
                    <h3 className="lending-title">
                      <ArrowDown className="lending-icon deposit-icon" />
                      Deposit Collateral
                    </h3>
                    
                    <div className="lending-stats">
                      <div className="lending-stat">
                        <span className="stat-label">Current Balance</span>
                        <span className="stat-value">{balance} ETH</span>
                      </div>
                      <div className="lending-stat">
                        <span className="stat-label">USD Value</span>
                        <span className="stat-value">
                          ${userPosition ? (Number(userPosition.collateralValue) / 1e16).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="lending-stat">
                        <span className="stat-label">Reputation Boost</span>
                        <span className="stat-value text-green-400">+10 points</span>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">Amount (ETH)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="form-input"
                        step="0.001"
                        min="0"
                      />
                      <div className="input-hint">
                        Each deposit increases your reputation score and improves lending terms
                      </div>
                    </div>
                    
                    <button
                      onClick={depositETH}
                      disabled={loading || !depositAmount || !isVerified}
                      className="btn btn-success btn-deposit"
                    >
                      <ArrowDown className="btn-icon" />
                      <span>{loading ? 'Processing...' : 'Deposit ETH'}</span>
                    </button>
                  </div>

                  <div className="lending-section borrow-section">
                    <h3 className="lending-title">
                      <ArrowUp className="lending-icon borrow-icon" />
                      Borrow ETH with Dynamic Rates
                    </h3>
                    
                    <div className="lending-stats">
                      <div className="lending-stat">
                        <span className="stat-label">Borrowed</span>
                        <span className="stat-value">{borrowedAmount} ETH</span>
                      </div>
                      <div className="lending-stat">
                        <span className="stat-label">Dynamic Rate</span>
                        <span className="stat-value text-blue-400">
                          {dynamicRates.ETH ? `${(Number(dynamicRates.ETH) / 100).toFixed(2)}%` : '5.2%'} APY
                        </span>
                      </div>
                      <div className="lending-stat">
                        <span className="stat-label">Base Rate</span>
                        <span className="stat-value">
                          {assetInfo.ETH ? `${(Number(assetInfo.ETH.baseBorrowRate) / 100).toFixed(2)}%` : '5.2%'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">Amount (ETH)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        className="form-input"
                        step="0.001"
                        min="0"
                      />
                      <div className="input-hint">
                        Rate adjusts based on ETH price: Higher price = Lower rate
                      </div>
                    </div>
                    
                    <button
                      onClick={borrowETH}
                      disabled={loading || !borrowAmount || !isVerified || emergencyMode}
                      className="btn btn-info btn-borrow"
                    >
                      <ArrowUp className="btn-icon" />
                      <span>{loading ? 'Processing...' : emergencyMode ? 'Unavailable' : 'Borrow ETH'}</span>
                    </button>
                  </div>
                </div>
                {/* Advanced Risk Management Panel */}
                {isVerified && userPosition && (
                  <div className="risk-panel">
                    <h4 className="risk-title">
                      <Target className="w-5 h-5 mr-2" />
                      Advanced Risk Management
                    </h4>
                    
                    <div className="risk-metrics-grid">
                      <div className="risk-metric-card">
                        <div className="risk-metric-header">
                          <Gauge className="w-4 h-4 text-blue-400" />
                          <span className="risk-metric-title">Health Factor</span>
                        </div>
                        <div className="risk-metric-value">
                          <span className={`text-2xl font-bold ${collateralRatio < 120 ? 'text-red-400' : collateralRatio < 150 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {(collateralRatio / 100).toFixed(2)}
                          </span>
                          <RiskIndicator ratio={collateralRatio} />
                        </div>
                      </div>
                      
                      <div className="risk-metric-card">
                        <div className="risk-metric-header">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="risk-metric-title">Liquidation Price</span>
                        </div>
                        <div className="risk-metric-value">
                          <span className="text-2xl font-bold text-red-400">
                            ${liquidationPrice === '0.0' ? 'N/A' : Number(liquidationPrice).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400">ETH Price</span>
                        </div>
                      </div>
                      
                      <div className="risk-metric-card">
                        <div className="risk-metric-header">
                          <Shield className="w-4 h-4 text-yellow-400" />
                          <span className="risk-metric-title">Liquidation Threshold</span>
                        </div>
                        <div className="risk-metric-value">
                          <span className="text-2xl font-bold text-yellow-400">80%</span>
                          <span className="text-sm text-gray-400">Safety Limit</span>
                        </div>
                      </div>
                      
                      <div className="risk-metric-card">
                        <div className="risk-metric-header">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span className="risk-metric-title">Liquidation Bonus</span>
                        </div>
                        <div className="risk-metric-value">
                          <span className="text-2xl font-bold text-purple-400">5%</span>
                          <span className="text-sm text-gray-400">Liquidator Reward</span>
                        </div>
                      </div>
                    </div>
                    
                    {userPosition.isLiquidatable && (
                      <div className="liquidation-warning">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-semibold">
                          Critical Warning: Position at immediate risk of liquidation!
                        </span>
                        <button className="btn btn-sm btn-warning ml-4">
                          Add Collateral
                        </button>
                      </div>
                    )}
                    
                    {/* Interest Calculation Display */}
                    {borrowedAmount !== '0' && (
                      <div className="interest-display">
                        <h5 className="text-sm font-semibold text-gray-300 mb-2">Interest Calculation</h5>
                        <div className="interest-details">
                          <div className="interest-item">
                            <span>Last Update:</span>
                            <span>{userPosition.lastInterestUpdate ? new Date(Number(userPosition.lastInterestUpdate) * 1000).toLocaleString() : 'N/A'}</span>
                          </div>
                          <div className="interest-item">
                            <span>Accrued Interest:</span>
                            <span className="text-yellow-400">
                              {((Number(borrowedAmount) * (dynamicRates.ETH ? Number(dynamicRates.ETH) / 10000 : 0.052)) / 365).toFixed(6)} ETH/day
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isVerified && (
                  <div className="warning-message">
                    <AlertCircle className="warning-icon" />
                    <p className="warning-text">
                      Please verify your decentralized identity to access enhanced lending and borrowing features with dynamic rates.
                    </p>
                  </div>
                )}
              </section>

              {/* Enhanced Chainlink Automation Status */}
              <section className="section-card">
                <h2 className="section-title">
                  <RefreshCw className="section-icon" /> 
                  Chainlink Automation & Upkeep Status
                </h2>
                
                <div className="automation-status">
                  <div className="automation-card">
                    <div className="automation-header">
                      <Timer className="w-6 h-6 text-blue-400" />
                      <h4 className="automation-title">Upkeep Status</h4>
                    </div>
                    <div className="automation-content">
                      <div className="status-indicator">
                        <span className={`status-dot ${upkeepInfo?.needed ? 'status-warning' : 'status-success'}`}></span>
                        <span className="status-text">
                          {upkeepInfo?.needed ? 'Upkeep Needed' : 'System Updated'}
                        </span>
                      </div>
                      <div className="automation-details">
                        <div className="automation-detail">
                          <span className="detail-label">Upkeep Interval:</span>
                          <span className="detail-value">1 Hour</span>
                        </div>
                        <div className="automation-detail">
                          <span className="detail-label">Last Execution:</span>
                          <span className="detail-value">
                            {priceUpdateTime ? priceUpdateTime.toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="automation-card">
                    <div className="automation-header">
                      <Activity className="w-6 h-6 text-green-400" />
                      <h4 className="automation-title">Automated Tasks</h4>
                    </div>
                    <div className="automation-content">
                      <div className="automated-tasks">
                        <div className="task-item">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Interest Rate Updates</span>
                        </div>
                        <div className="task-item">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Position Monitoring</span>
                        </div>
                        <div className="task-item">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Market Data Refresh</span>
                        </div>
                        <div className="task-item">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Liquidation Detection</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Enhanced Chainlink Features Showcase */}
              <section className="section-card chainlink-features">
                <h2 className="section-title">
                  <Zap className="section-icon" /> 
                  Advanced Chainlink Integrations
                </h2>
                
                <div className="features-grid">
                  <div className="feature-card advanced">
                    <div className="feature-icon">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Enhanced Price Feeds</h4>
                    <p className="feature-description">
                      Real-time price data with staleness detection, health monitoring, and emergency fallbacks
                    </p>
                    <div className="feature-stats">
                      <div className="feature-stat">
                        <span className="stat-label">Feeds Active:</span>
                        <span className="stat-value">
                          {Object.values(priceDataHealth).filter(f => f?.isHealthy).length}/3
                        </span>
                      </div>
                      <div className="feature-stat">
                        <span className="stat-label">Update Frequency:</span>
                        <span className="stat-value">Live</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="feature-card advanced">
                    <div className="feature-icon">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Smart Automation</h4>
                    <p className="feature-description">
                      Automated interest rate adjustments and position monitoring via Chainlink Keepers
                    </p>
                    <div className="feature-stats">
                      <div className="feature-stat">
                        <span className="stat-label">Upkeep Status:</span>
                        <span className={`stat-value ${upkeepInfo?.needed ? 'text-yellow-400' : 'text-green-400'}`}>
                          {upkeepInfo?.needed ? 'Pending' : 'Active'}
                        </span>
                      </div>
                      <div className="feature-stat">
                        <span className="stat-label">Interval:</span>
                        <span className="stat-value">1 Hour</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="feature-card advanced">
                    <div className="feature-icon">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Market Stability Guards</h4>
                    <p className="feature-description">
                      Enhanced security with USDC stability checks and emergency mode activation
                    </p>
                    <div className="feature-stats">
                      <div className="feature-stat">
                        <span className="stat-label">USDC Threshold:</span>
                        <span className="stat-value">$0.99</span>
                      </div>
                      <div className="feature-stat">
                        <span className="stat-label">Emergency Mode:</span>
                        <span className={`stat-value ${emergencyMode ? 'text-red-400' : 'text-green-400'}`}>
                          {emergencyMode ? 'Active' : 'Normal'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="feature-card advanced">
                    <div className="feature-icon">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Dynamic Rate Engine</h4>
                    <p className="feature-description">
                      Interest rates automatically adjust based on real-time market conditions and asset prices
                    </p>
                    <div className="feature-stats">
                      <div className="feature-stat">
                        <span className="stat-label">ETH Rate:</span>
                        <span className="stat-value text-blue-400">
                          {dynamicRates.ETH ? `${(Number(dynamicRates.ETH) / 100).toFixed(2)}%` : '5.2%'}
                        </span>
                      </div>
                      <div className="feature-stat">
                        <span className="stat-label">Rate Adjustments:</span>
                        <span className="stat-value">Real-time</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Implementation Details */}
                <div className="technical-details">
                  <h4 className="technical-title">
                    <Settings className="w-5 h-5 mr-2" />
                    Technical Implementation
                  </h4>
                  <div className="implementation-grid">
                    <div className="implementation-item">
                      <Code className="w-4 h-4 text-purple-400" />
                      <span>Try-Catch Error Handling for Price Feeds</span>
                    </div>
                    <div className="implementation-item">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span>Configurable Staleness Thresholds</span>
                    </div>
                    <div className="implementation-item">
                      <Signal className="w-4 h-4 text-green-400" />
                      <span>Health Monitoring for Each Feed</span>
                    </div>
                    <div className="implementation-item">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span>Emergency Mode & Fallback Systems</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Advanced Analytics Dashboard */}
              <section className="section-card">
                <h2 className="section-title">
                  <BarChart3 className="section-icon" /> 
                  Advanced Analytics & Insights
                </h2>
                
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h4 className="analytics-title">
                      <Users className="w-5 h-5 mr-2" />
                      User Metrics
                    </h4>
                    {didInfo && (
                      <div className="metrics-display">
                        <div className="metric-item">
                          <span className="metric-label">Verification Time:</span>
                          <span className="metric-value">
                            {new Date(Number(didInfo.verificationTime) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Days Active:</span>
                          <span className="metric-value">
                            {Math.floor((Date.now() - Number(didInfo.verificationTime) * 1000) / (1000 * 60 * 60 * 24))}
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Reputation Growth:</span>
                          <span className="metric-value text-green-400">
                            +{Math.max(0, Number(didInfo.reputationPoints) - 100)} points
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="analytics-card">
                    <h4 className="analytics-title">
                      <Coins className="w-5 h-5 mr-2" />
                      Lending Performance
                    </h4>
                    {didInfo && (
                      <div className="metrics-display">
                        <div className="metric-item">
                          <span className="metric-label">Total Borrowed:</span>
                          <span className="metric-value">
                            {ethers.formatEther(didInfo.totalBorrowed || 0)} ETH
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Total Repaid:</span>
                          <span className="metric-value">
                            {ethers.formatEther(didInfo.totalRepaid || 0)} ETH
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Repayment Ratio:</span>
                          <span className="metric-value text-blue-400">
                            {didInfo.totalBorrowed > 0 
                              ? `${((Number(didInfo.totalRepaid) / Number(didInfo.totalBorrowed)) * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="analytics-card">
                    <h4 className="analytics-title">
                      <Heart className="w-5 h-5 mr-2" />
                      System Health
                    </h4>
                    <div className="metrics-display">
                      <div className="metric-item">
                        <span className="metric-label">Price Feeds Health:</span>
                        <span className={`metric-value ${Object.values(priceDataHealth).every(f => f?.isHealthy) ? 'text-green-400' : 'text-yellow-400'}`}>
                          {Object.values(priceDataHealth).filter(f => f?.isHealthy).length}/3 Healthy
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Emergency Status:</span>
                        <span className={`metric-value ${emergencyMode ? 'text-red-400' : 'text-green-400'}`}>
                          {emergencyMode ? 'Emergency Mode' : 'Normal Operation'}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Automation Status:</span>
                        <span className={`metric-value ${upkeepInfo?.needed ? 'text-yellow-400' : 'text-green-400'}`}>
                          {upkeepInfo?.needed ? 'Upkeep Pending' : 'Automated'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            {process.env.NODE_ENV === 'development' && (
              <section className="section-card debug-panel">
                <h2 className="section-title">
                  <Eye className="section-icon" /> 
                  Debug Information
                </h2>
                <div className="debug-content">
                  <details className="debug-section">
                    <summary className="debug-summary">Price Feed Health Details</summary>
                    <pre className="debug-data">
                      {JSON.stringify(priceDataHealth, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value,
                        2
                      )}
                    </pre>
                  </details>
                  <details className="debug-section">
                    <summary className="debug-summary">User Position Data</summary>
                    <pre className="debug-data">
                      {JSON.stringify(userPosition, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value,
                        2
                      )}
                    </pre>
                  </details>
                  <details className="debug-section">
                    <summary className="debug-summary">Dynamic Rates</summary>
                    <pre className="debug-data">
                      {JSON.stringify(dynamicRates, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value,
                        2
                      )}
                    </pre>
                  </details>
                  <details className="debug-section">
                    <summary className="debug-summary">Asset Information</summary>
                    <pre className="debug-data">
                      {JSON.stringify(assetInfo, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value,
                        2
                      )}
                    </pre>
                  </details>
                </div>
              </section>
            )}

              {message && (
                <div className={`fixed bottom-10 right-4 p-4 rounded-xl shadow-lg border ${
                  message.includes('✅') || message.includes('✨') || message.includes('🎉') 
                    ? 'bg-green-100 border-green-200 text-green-800' 
                    : message.includes('⚠️') || message.includes('📈') || message.includes('📊')
                    ? 'bg-yellow-100 border-yellow-200 text-yellow-800'
                    : 'bg-red-100 border-red-200 text-red-800'
                } animate-fade-in`}>
                  <p className="text-sm font-medium">{message}</p>
                  <button onClick={() => setMessage('')} className="ml-2 text-gray-500 hover:text-gray-700">&times;</button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-md text-center">
              <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Wrong Network</h2>
              <p className="text-gray-600 mb-4">Please switch to Sepolia testnet to continue</p>
              <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Switch to Sepolia
              </button>
            </div>
          )
        ) : (
         <div className="connect-wallet">
            <div className="connect-content">
              <div className="connect-icon">
                <Wallet className="w-16 h-16" />
              </div>
              <h2 className="connect-title">Connect Your Wallet</h2>
              <p className="connect-text">
                Connect your wallet to access our Chainlink-powered decentralized identity 
                verification and DeFi lending platform.
              </p>
              <ConnectButton />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-text">
            <Activity className="inline w-4 h-4 mr-2" />
            Built for Chainlink Hackathon • Powered by Chainlink Price Feeds & Automation
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;