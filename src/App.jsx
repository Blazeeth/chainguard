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
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isVerified 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isVerified ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
      {isVerified ? 'Verified' : 'Unverified'}
    </div>
  );

  const StatCard = ({ title, value, subtitle, icon: Icon, status, color = "purple" }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {status && <div className="mt-2">{status}</div>}
      </div>
    </div>
  );

  const PriceCard = ({ symbol, price, change, icon, gradient, healthStatus }) => (
    <div className={`rounded-xl p-4 text-white ${gradient} shadow-sm hover:shadow-md transition-all relative`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-90">{symbol}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{icon}</span>
          {healthStatus && !healthStatus.isHealthy && (
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
          )}
        </div>
      </div>
      <p className="text-xl font-bold mb-1">{price}</p>
      <p className="text-sm opacity-75">{change}</p>
      {healthStatus && !healthStatus.isHealthy && (
        <div className="absolute top-2 right-2">
          <div className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded">
            Data {healthStatus.hoursSinceUpdate}h old
          </div>
        </div>
      )}
    </div>
  );

  const FeatureCard = ({ title, value, status, icon: Icon, color = "purple" }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-1.5 rounded-lg bg-purple-50">
          <Icon className="w-4 h-4 text-purple-600" />
        </div>
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-gray-900">{value}</p>
        {status && <p className="text-xs text-gray-500">{status}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 from-slate-50 to-blue-50">
      
      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Emergency Mode: Some Chainlink price feeds are experiencing issues. Limited functionality available.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-purple-100 via-purple-100 to-purple-100 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChainGuard DeFi
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Chainlink-Powered Platform</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChainGuard
                </h1>
              </div>
            </div>
            
            {/* Custom styled connect button */}
            <div className="flex items-center">
              {account ? (
              <ConnectButton />
               ) : (
              <ConnectButton />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {account ? (
          chainId === sepolia.id ? (
            <div className="space-y-6">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Collateral Balance"
                  value={`${balance} ETH`}
                  subtitle={`$${userPosition ? (Number(userPosition.collateralValue) / 1e16).toFixed(2) : '0.00'}`}
                  icon={Wallet}
                  color="purple"
                />
                <StatCard
                  title="Identity Status"
                  value={isVerified ? "Verified" : "Unverified"}
                  subtitle={didInfo ? `Credit Score: ${didInfo.creditScore?.toString()}` : "Not verified"}
                  icon={Shield}
                  status={<StatusBadge isVerified={isVerified} />}
                  color="green"
                />
                <StatCard
                  title="Borrowed Amount"
                  value={`${borrowedAmount} ETH`}
                  subtitle={`$${userPosition ? (Number(userPosition.borrowedValue) / 1e16).toFixed(2) : '0.00'}`}
                  icon={TrendingUp}
                  color="blue"
                />
                <StatCard
                  title="Health Factor"
                  value={`${(collateralRatio / 100).toFixed(1)}%`}
                  subtitle="Liquidation safety"
                  icon={BarChart3}
                  status={
                    <span className={`text-sm font-medium ${
                      collateralRatio >= 200 ? 'text-green-600' : 
                      collateralRatio >= 150 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {collateralRatio >= 200 ? 'Healthy' : 
                       collateralRatio >= 150 ? 'Moderate' : 'High Risk'}
                    </span>
                  }
                  color="emerald"
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Price Feeds & DID */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Chainlink Price Feeds */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-bold text-gray-900">Chainlink Price Feeds</h2>
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      </div>
                      <button 
                        onClick={refreshPrices}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <PriceCard
                        symbol="USDC/USD"
                        price={prices.usdc}
                        change="+0.01%"
                        icon="$"
                        gradient="bg-gradient-to-r from-blue-500 to-green-500"
                        healthStatus={priceDataHealth.USDC}
                      />
                      <PriceCard
                        symbol="ETH/USD"
                        price={prices.eth}
                        change="+2.45%"
                        icon="Ξ"
                        gradient="bg-gradient-to-r from-purple-500 to-blue-500"
                        healthStatus={priceDataHealth.ETH}
                      />
                      <PriceCard
                        symbol="BTC/USD"
                        price={prices.btc}
                        change="+1.23%"
                        icon="₿"
                        gradient="bg-gradient-to-r from-orange-500 to-yellow-500"
                        healthStatus={priceDataHealth.BTC}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {priceUpdateTime ? `Last updated: ${priceUpdateTime.toLocaleTimeString()}` : 'Loading...'}
                    </div>
                  </div>

                  {/* DID Verification */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Lock className="w-6 h-6 text-purple-600" />
                      <h2 className="text-xl font-bold text-gray-900">DID Verification</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Decentralized Identifier (DID)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your DID (e.g., user123, demo_user)"
                          value={didInput}
                          onChange={(e) => setDidInput(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Valid test DIDs: user123, demo_user, test_verified
                          <br />
                          <span className="text-yellow-600">Note: Requires USDC price ≥ $0.99</span>
                        </p>
                      </div>

                      <button
                        onClick={verifyDID}
                        disabled={loading || !didInput}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {loading ? 'Verifying Identity...' : 'Verify DID'}
                      </button>

                      {isVerified && didInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">Identity Verified</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">DID:</span>
                              <span className="font-medium ml-2">{didInfo.did}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Credit Score:</span>
                              <span className="font-medium ml-2">{didInfo.creditScore?.toString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Reputation:</span>
                              <span className="font-medium ml-2">{didInfo.reputationPoints?.toString()} pts</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-medium ml-2 ${didInfo.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {didInfo.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lending Operations */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Wallet className="w-6 h-6 text-purple-600" />
                      <h2 className="text-xl font-bold text-gray-900">Lending Operations</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Deposit Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <ArrowDown className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Deposit Collateral</h3>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Current Balance</span>
                              <span className="font-medium">{balance} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">USD Value</span>
                              <span className="font-medium">
                                ${userPosition ? (Number(userPosition.collateralValue) / 1e16).toFixed(2) : '0.00'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Earn reputation points and improve lending terms
                            </div>
                          </div>
                        </div>

                        <input
                          type="number"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          step="0.001"
                          min="0"
                        />

                        <button
                          onClick={depositETH}
                          disabled={loading || !depositAmount || !isVerified}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <ArrowDown className="w-4 h-4" />
                          {loading ? 'Processing...' : 'Deposit ETH'}
                        </button>
                      </div>

                      {/* Borrow Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <ArrowUp className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Borrow ETH</h3>
                        </div>
                        
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Borrowed</span>
                              <span className="font-medium">{borrowedAmount} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Current Rate</span>
                              <span className="font-medium text-blue-600">
                                {dynamicRates.ETH ? `${(Number(dynamicRates.ETH) / 100).toFixed(2)}%` : '5.2%'} APY
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Rate adjusts based on ETH price: Higher price = Lower rate
                            </div>
                          </div>
                        </div>

                        <input
                          type="number"
                          placeholder="0.00"
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.001"
                          min="0"
                        />

                        <button
                          onClick={borrowETH}
                          disabled={loading || !borrowAmount || !isVerified || emergencyMode}
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <ArrowUp className="w-4 h-4" />
                          {loading ? 'Processing...' : emergencyMode ? 'Unavailable' : 'Borrow ETH'}
                        </button>
                      </div>
                    </div>

                    {!isVerified && (
                      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <p className="text-yellow-800 font-medium">
                            Please verify your decentralized identity to access lending features.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* Chainlink Features */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">Chainlink Features</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <FeatureCard
                        title="Price Feeds"
                        value={`${Object.values(priceDataHealth).filter(f => f?.isHealthy).length}/3 feeds healthy`}
                        icon={Database}
                        color="blue"
                      />
                      <FeatureCard
                        title="Automation"
                        value={upkeepInfo?.needed ? "Upkeep pending" : "System updated"}
                        icon={RefreshCw}
                        color={upkeepInfo?.needed ? "yellow" : "green"}
                      />
                      <FeatureCard
                        title="Dynamic Rates"
                        value="Market-based pricing"
                        icon={TrendingUp}
                        color="purple"
                      />
                    </div>
                  </div>
                  {/* Your Profile */}
                  {isVerified && didInfo && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-gray-900">Your Profile</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Total Borrowed</span>
                          <span className="font-medium">{ethers.formatEther(didInfo.totalBorrowed || 0)} ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Total Repaid</span>
                          <span className="font-medium">{ethers.formatEther(didInfo.totalRepaid || 0)} ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Reputation</span>
                          <span className="font-medium text-purple-600">{didInfo.reputationPoints?.toString()} points</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Member Since</span>
                          <span className="font-medium">
                            {new Date(Number(didInfo.verificationTime) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Management */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5 text-orange-600" />
                      <h3 className="font-bold text-gray-900">Risk Management</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Health Factor</span>
                        <span className={`font-bold ${
                          collateralRatio >= 200 ? 'text-green-600' : 
                          collateralRatio >= 150 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(collateralRatio / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Liquidation Price</span>
                        <span className="font-bold text-red-600">
                          {liquidationPrice === '0.0' ? 'N/A' : `${Number(liquidationPrice).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Interest Rate</span>
                        <span className="font-bold text-blue-600">
                          {dynamicRates.ETH ? `${(Number(dynamicRates.ETH) / 100).toFixed(2)}%` : '5.2%'} APY
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Liquidation Threshold</span>
                        <span className="font-bold">80%</span>
                      </div>
                    </div>
                  </div>
                  

                  {/* System Status */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <h3 className="font-bold text-gray-900">System Status</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Network</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Sepolia</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Emergency Mode</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${emergencyMode ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <span className="text-sm font-medium">{emergencyMode ? 'Active' : 'Normal'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Contract</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  
                </div>
              </div>
            </div>
          ) : (
            /* Wrong Network */
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Wrong Network</h2>
                <p className="text-gray-600 mb-6">Please switch to Sepolia testnet to continue</p>
                <button
                  onClick={() => switchChain({ chainId: sepolia.id })}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Switch to Sepolia
                </button>
              </div>
            </div>
          )
        ) : (
          /* Connect Wallet Screen */
          <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Welcome to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ChainGuard DeFi</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  The future of decentralized lending powered by Chainlink's oracle network. 
                  Secure, transparent, and fully automated.
                </p>
                
                

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-lg transition-all hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Price Feeds</h3>
                  <p className="text-gray-600 text-sm">
                    Powered by Chainlink's decentralized oracle network for accurate, tamper-proof price data
                  </p>
                </div>

                <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100  shadow-sm hover:shadow-lg transition-all hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">DID Verification</h3>
                  <p className="text-gray-600 text-sm">
                    Secure decentralized identity verification with credit scoring and reputation tracking
                  </p>
                </div>

                <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100  shadow-sm hover:shadow-lg transition-all hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Automation</h3>
                  <p className="text-gray-600 text-sm">
                    Automated interest rates and position monitoring via Chainlink Keepers
                  </p>
                </div>
              </div>
              {/* Connect Wallet Card */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 shadow-xl max-w-md mx-auto mb-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
                  <p className="text-gray-600 mb-6">
                    Get started by connecting your Web3 wallet to access all features
                  </p>
                  <div className="flex justify-center items-center">
                  <ConnectButton />
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold shadow-lg">
                      1
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
                    <p className="text-sm text-gray-600">Link your Web3 wallet securely</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold shadow-lg">
                      2
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Verify</h3>
                    <p className="text-sm text-gray-600">Complete DID verification process</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold shadow-lg">
                      3
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Deposit</h3>
                    <p className="text-sm text-gray-600">Add ETH as collateral</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold shadow-lg">
                      4
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Borrow</h3>
                    <p className="text-sm text-gray-600">Access DeFi lending with dynamic rates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-900 pr-4">{message}</p>
            <button 
              onClick={() => setMessage('')}
              className="ml-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ChainGuard DeFi
                  </h3>
                  <p className="text-gray-400 text-sm">Chainlink-Powered Platform</p>
                </div>
              </div>
              <p className="text-gray-300 mb-2 max-w-md leading-relaxed">
                The future of decentralized lending powered by Chainlink's oracle network. 
                Secure, transparent, and fully automated DeFi solutions.
              </p>
              
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Features
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-blue-400" />
                  Chainlink Price Feeds
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-green-400" />
                  DID Verification
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-yellow-400" />
                  Smart Automation
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  Dynamic Interest Rates
                </li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                Technology
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  Chainlink Oracles
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                  Ethereum Blockchain
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  Smart Contracts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-sm"></div>
                  React Frontend
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-700 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Built for Chainlink Hackathon 2025</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Sepolia Testnet</span>
                </div>
                </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                © 2025 ChainGuard DeFi. Powered by Chainlink Price Feeds & Automation. 
                
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;