import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

// Replace with your WalletConnect Project ID from cloud.walletconnect.com
const projectId = '8553a72dd71a6061a0923187b8d1069f';

// Configure chains and providers
const config = getDefaultConfig({
  appName: 'DID Verifier for DeFi',
  projectId,
  chains: [sepolia],
  transports: { 
    [sepolia.id]: http() 
  },
});

// Create React Query client for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Custom theme for RainbowKit
const customTheme = {
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: '#8B5CF6',
    accentColorForeground: '#FFFFFF',
    actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
    actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
    actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.1)',
    closeButton: '#9CA3AF',
    closeButtonBackground: 'rgba(255, 255, 255, 0.1)',
    connectButtonBackground: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    connectButtonBackgroundError: '#EF4444',
    connectButtonInnerBackground: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    connectButtonText: '#FFFFFF',
    connectButtonTextError: '#FFFFFF',
    connectionIndicator: '#10B981',
    downloadBottomCardBackground: 'rgba(17, 24, 39, 0.9)',
    downloadTopCardBackground: 'rgba(17, 24, 39, 0.9)',
    error: '#EF4444',
    generalBorder: 'rgba(255, 255, 255, 0.1)',
    generalBorderDim: 'rgba(255, 255, 255, 0.05)',
    menuItemBackground: 'rgba(255, 255, 255, 0.05)',
    modalBackdrop: 'rgba(0, 0, 0, 0.8)',
    modalBackground: 'rgba(17, 24, 39, 0.95)',
    modalBorder: 'rgba(255, 255, 255, 0.1)',
    modalText: '#F9FAFB',
    modalTextDim: '#9CA3AF',
    modalTextSecondary: '#D1D5DB',
    profileAction: 'rgba(255, 255, 255, 0.1)',
    profileActionHover: 'rgba(255, 255, 255, 0.2)',
    profileForeground: 'rgba(17, 24, 39, 0.95)',
    selectedOptionBorder: '#8B5CF6',
    standby: '#F59E0B',
  },
  fonts: {
    body: 'Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    menuButton: '12px',
    modal: '16px',
    modalMobile: '16px',
  },
  shadows: {
    connectButton: '0 10px 25px rgba(139, 92, 246, 0.3)',
    dialog: '0 20px 50px rgba(0, 0, 0, 0.5)',
    profileDetailsAction: '0 4px 12px rgba(0, 0, 0, 0.1)',
    selectedOption: '0 0 0 2px rgba(139, 92, 246, 0.3)',
    selectedWallet: '0 0 0 2px rgba(139, 92, 246, 0.3)',
    walletLogo: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
};

// Initialize the application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);