import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { 
  DollarSign, Send, Lock, Wallet, ArrowDown, ArrowUp, Shield, TrendingUp, 
  Zap, CheckCircle, XCircle, AlertCircle, Globe, Activity, Sparkles, 
  BarChart3, Clock, Users, Award, RefreshCw, AlertTriangle, Eye,
  Coins, CreditCard, Target, Settings, TrendingDown
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
  
  // Enhanced state for contract data
  const [userPosition, setUserPosition] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [collateralRatio, setCollateralRatio] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [dynamicRates, setDynamicRates] = useState({});
  const [assetInfo, setAssetInfo] = useState({});
  const [priceUpdateTime, setPriceUpdateTime] = useState(null);

  const { address: account, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const isMobile = useMediaQuery({ maxWidth: 640 });

  useEffect(() => {
    if (chainId && chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
    }
  }, [chainId, switchChain]);

  const fetchContractData = async (contractInstance) => {
    try {
      // Basic user data
      const verified = await contractInstance.checkUserAccess(account);
      const bal = await contractInstance.getDepositBalance(account);
      const borrowed = await contractInstance.borrowedAmounts(account);
      
      // Price data with timestamp
      const usdcPrice = await contractInstance.getPriceFormatted(0);
      const ethPrice = await contractInstance.getPriceFormatted(1);
      const btcPrice = await contractInstance.getPriceFormatted(2);
      
      setIsVerified(verified);
      setBalance(ethers.formatEther(bal));
      setBorrowedAmount(ethers.formatEther(borrowed));
      setPrices({ usdc: usdcPrice, eth: ethPrice, btc: btcPrice });
      setPriceUpdateTime(new Date());

      if (verified) {
        // Fetch enhanced user data
        const position = await contractInstance.getUserPosition(account);
        const did = await contractInstance.getDIDInfo(account);
        const colRatio = await contractInstance.getCollateralRatio(account);
        const liqPrice = await contractInstance.getLiquidationPrice(account);
        
        setUserPosition(position);
        setDidInfo(did);
        setCollateralRatio(Number(colRatio));
        setLiquidationPrice(ethers.formatEther(liqPrice));

        // Fetch dynamic rates for all assets
        const rates = {};
        const assets = {};
        for (const [symbol] of Object.entries(SUPPORTED_ASSETS)) {
          try {
            rates[symbol] = await contractInstance.getDynamicBorrowRate(symbol);
            assets[symbol] = await contractInstance.getAssetInfo(symbol);
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
          }
        }
        setDynamicRates(rates);
        setAssetInfo(assets);
      }
    } catch (error) {
      setMessage('Error fetching contract data');
      console.error('Contract data fetch error:', error);
      // Fallback prices for demo
      setPrices({ usdc: 'Offline: $1.00', eth: 'Offline: $3,245.67', btc: 'Offline: $68,420.50' });
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

  // Event listeners
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
        setMessage(`❌ Access Denied: ${reason}`);
      }
    };

    const handleDIDVerified = (user, did, creditScore) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setMessage(`🎉 DID Verified! Credit Score: ${creditScore}`);
      }
    };

    const handleLiquidation = (user) => {
      if (user.toLowerCase() === account?.toLowerCase()) {
        setMessage('⚠️ Position Liquidated! Please check your account.');
        fetchContractData(contract);
      }
    };

    const handleInterestRateUpdate = (asset, newRate) => {
      setMessage(`📈 Interest rate updated for ${asset}: ${newRate / 100}%`);
      fetchContractData(contract);
    };

    contract.on('AccessGranted', handleAccessGranted);
    contract.on('AccessDenied', handleAccessDenied);
    contract.on('DIDVerified', handleDIDVerified);
    contract.on('LiquidationExecuted', handleLiquidation);
    contract.on('InterestRateUpdated', handleInterestRateUpdate);

    return () => {
      contract.off('AccessGranted', handleAccessGranted);
      contract.off('AccessDenied', handleAccessDenied);
      contract.off('DIDVerified', handleDIDVerified);
      contract.off('LiquidationExecuted', handleLiquidation);
      contract.off('InterestRateUpdated', handleInterestRateUpdate);
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
      setMessage('❌ Verification failed. Please try again.');
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
      setMessage('❌ Borrow failed. Check your collateral and try again.');
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
      setMessage('❌ Failed to refresh prices');
    }
  };

  const StatusBadge = ({ isVerified }) => (
    <div className={`status-badge ${isVerified ? 'verified' : 'unverified'}`}>
      {isVerified ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
      {isVerified ? 'Verified' : 'Unverified'}
    </div>
  );

  const PriceCard = ({ symbol, price, change, icon, gradient, subtitle }) => (
    <div className={`price-card ${gradient}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="price-symbol">{symbol}</span>
          {subtitle && <div className="price-subtitle">{subtitle}</div>}
        </div>
        <div className="price-icon">{icon}</div>
      </div>
      <p className="price-value">{price}</p>
      <p className="price-change">{change}</p>
    </div>
  );

  const RiskIndicator = ({ ratio }) => {
    const getRiskLevel = (ratio) => {
      if (ratio >= 200) return { level: 'Safe', color: 'text-green-400', icon: CheckCircle };
      if (ratio >= 150) return { level: 'Moderate', color: 'text-yellow-400', icon: AlertCircle };
      return { level: 'High Risk', color: 'text-red-400', icon: AlertTriangle };
    };
    
    const risk = getRiskLevel(ratio);
    const Icon = risk.icon;
    
    return (
      <div className={`flex items-center gap-2 ${risk.color}`}>
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{risk.level}</span>
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
              <Shield className="w-8 h-8" />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">ChainGuard DeFi</h1>
              <p className="brand-subtitle">Chainlink-Powered Identity & Lending</p>
            </div>
          </div>
          <div className="wallet-connection">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="main-content">
        {account ? (
          chainId === sepolia.id ? (
            <div className="content-grid">
              {/* Enhanced Statistics Section */}
              <section className="hero-stats">
                <div className="stat-card balance-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Collateral Balance</p>
                      <p className="stat-value">{balance} ETH</p>
                      <p className="stat-subtitle">${userPosition ? (Number(userPosition.collateralValue) / 1e8).toFixed(2) : '0.00'}</p>
                    </div>
                    <Wallet className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card status-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Identity Status</p>
                      <StatusBadge isVerified={isVerified} />
                      {didInfo && <p className="stat-subtitle">Score: {didInfo.creditScore?.toString()}</p>}
                    </div>
                    <Shield className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card borrow-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Borrowed Amount</p>
                      <p className="stat-value">{borrowedAmount} ETH</p>
                      <p className="stat-subtitle">${userPosition ? (Number(userPosition.borrowedValue) / 1e8).toFixed(2) : '0.00'}</p>
                    </div>
                    <TrendingUp className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card ratio-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-label">Collateral Ratio</p>
                      <p className="stat-value">{(collateralRatio / 100).toFixed(1)}%</p>
                      <RiskIndicator ratio={collateralRatio} />
                    </div>
                    <BarChart3 className="stat-icon" />
                  </div>
                </div>
              </section>

              {/* Chainlink Price Feeds Section */}
              <section className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    <DollarSign className="section-icon" /> 
                    Chainlink Price Feeds
                    <Sparkles className="ml-2 w-5 h-5 text-yellow-400" />
                  </h2>
                  <button 
                    onClick={refreshPrices} 
                    className="btn-refresh"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className={`prices-grid ${isMobile ? 'mobile' : ''}`}>
                  <PriceCard 
                    symbol="USDC/USD" 
                    price={prices.usdc} 
                    change="+0.01%" 
                    icon="$" 
                    gradient="usdc-gradient"
                    subtitle="Stablecoin Reference"
                  />
                  <PriceCard 
                    symbol="ETH/USD" 
                    price={prices.eth} 
                    change="+2.45%" 
                    icon="Ξ" 
                    gradient="eth-gradient"
                    subtitle="Primary Collateral"
                  />
                  <PriceCard 
                    symbol="BTC/USD" 
                    price={prices.btc} 
                    change="+1.23%" 
                    icon="₿" 
                    gradient="btc-gradient"
                    subtitle="Market Reference"
                  />
                </div>
                
                {priceUpdateTime && (
                  <div className="price-update-info">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      Last updated: {priceUpdateTime.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </section>

              {/* Enhanced Identity Verification */}
              <section className="section-card">
                <h2 className="section-title">
                  <Lock className="section-icon" /> 
                  Decentralized Identity Verification
                </h2>
                
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
                    <div className="input-hint">
                      Valid test DIDs: user123, user456, user789, demo_user, test_verified
                    </div>
                  </div>
                  
                  <button
                    onClick={verifyDID}
                    disabled={loading || !didInput}
                    className="btn btn-primary btn-verify"
                  >
                    <Send className="btn-icon" />
                    <span>{loading ? 'Verifying Identity...' : 'Verify DID'}</span>
                  </button>
                  
                  <div className="status-display">
                    <span className="status-label">Current Status:</span>
                    <StatusBadge isVerified={isVerified} />
                  </div>

                  {/* Enhanced DID Info Display */}
                  {didInfo && (
                    <div className="did-info-card">
                      <h4 className="did-info-title">Identity Details</h4>
                      <div className="did-info-grid">
                        <div className="did-info-item">
                          <span className="did-label">DID:</span>
                          <span className="did-value">{didInfo.did}</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Credit Score:</span>
                          <span className="did-value">{didInfo.creditScore?.toString()}</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Reputation Points:</span>
                          <span className="did-value">{didInfo.reputationPoints?.toString()}</span>
                        </div>
                        <div className="did-info-item">
                          <span className="did-label">Total Borrowed:</span>
                          <span className="did-value">{ethers.formatEther(didInfo.totalBorrowed || 0)} ETH</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Enhanced Lending Operations */}
              <section className="section-card">
                <h2 className="section-title">
                  <Wallet className="section-icon" /> 
                  DeFi Lending Operations
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
                          ${userPosition ? (Number(userPosition.collateralValue) / 1e8).toFixed(2) : '0.00'}
                        </span>
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
                      Borrow ETH
                    </h3>
                    
                    <div className="lending-stats">
                      <div className="lending-stat">
                        <span className="stat-label">Borrowed</span>
                        <span className="stat-value">{borrowedAmount} ETH</span>
                      </div>
                      <div className="lending-stat">
                        <span className="stat-label">Dynamic Rate</span>
                        <span className="stat-value">
                          {dynamicRates.ETH ? `${(Number(dynamicRates.ETH) / 100).toFixed(2)}%` : '5.2%'} APY
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
                    </div>
                    
                    <button
                      onClick={borrowETH}
                      disabled={loading || !borrowAmount || !isVerified}
                      className="btn btn-info btn-borrow"
                    >
                      <ArrowUp className="btn-icon" />
                      <span>{loading ? 'Processing...' : 'Borrow ETH'}</span>
                    </button>
                  </div>
                </div>

                {/* Risk Management Panel */}
                {isVerified && userPosition && (
                  <div className="risk-panel">
                    <h4 className="risk-title">
                      <Target className="w-5 h-5 mr-2" />
                      Risk Management
                    </h4>
                    
                    <div className="risk-metrics">
                      <div className="risk-metric">
                        <span className="risk-label">Liquidation Price:</span>
                        <span className="risk-value">${liquidationPrice} ETH</span>
                      </div>
                      <div className="risk-metric">
                        <span className="risk-label">Health Factor:</span>
                        <span className={`risk-value ${collateralRatio < 120 ? 'text-red-400' : 'text-green-400'}`}>
                          {(collateralRatio / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="risk-metric">
                        <span className="risk-label">Liquidation Threshold:</span>
                        <span className="risk-value">80%</span>
                      </div>
                    </div>
                    
                    {userPosition.isLiquidatable && (
                      <div className="liquidation-warning">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-semibold">
                          Warning: Position at risk of liquidation!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!isVerified && (
                  <div className="warning-message">
                    <AlertCircle className="warning-icon" />
                    <p className="warning-text">
                      Please verify your decentralized identity to access lending and borrowing features.
                    </p>
                  </div>
                )}
              </section>

              {/* Chainlink Features Showcase */}
              <section className="section-card chainlink-features">
                <h2 className="section-title">
                  <Zap className="section-icon" /> 
                  Chainlink Integrations
                </h2>
                
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Price Feeds</h4>
                    <p className="feature-description">
                      Real-time price data for ETH, BTC, and USDC from Chainlink's decentralized oracle network
                    </p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Automation</h4>
                    <p className="feature-description">
                      Automated interest rate updates and position monitoring via Chainlink Keepers
                    </p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Market Stability</h4>
                    <p className="feature-description">
                      Identity verification includes market stability checks using USDC price feeds
                    </p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h4 className="feature-title">Dynamic Rates</h4>
                    <p className="feature-description">
                      Interest rates adjust automatically based on real-time market conditions
                    </p>
                  </div>
                </div>
              </section>

              {/* Message Display */}
              {message && (
                <div className={`message ${
                  message.includes('✅') || message.includes('✨') || message.includes('🎉') 
                    ? 'success' 
                    : message.includes('⚠️') || message.includes('📈')
                    ? 'warning'
                    : 'error'
                }`}>
                  <p className="message-text">{message}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="network-warning">
              <div className="warning-content">
                <Globe className="warning-icon-large" />
                <h2 className="warning-title">Wrong Network</h2>
                <p className="warning-text">Please switch to Sepolia testnet to continue</p>
                <button 
                  onClick={() => switchChain({ chainId: sepolia.id })}
                  className="btn btn-primary mt-4"
                >
                  Switch to Sepolia
                </button>
              </div>
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