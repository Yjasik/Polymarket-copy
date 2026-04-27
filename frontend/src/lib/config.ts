
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS ||
  '0xc6CAdeFE6B9F55Fdce475a1e118270FA7F787001'
) as `0x${string}`;

export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  LOCALHOST: 31337,
} as const;

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.SEPOLIA;

export const SITE_CONFIG = {
  name: 'PredictMarket',
  description: 'Decentralized prediction market — trade on the outcome of real‑world events.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  twitterHandle: '@predictmarket',
};

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export const WALLET_CONNECT_PROJECT_ID = 
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export const SEPOLIA_RPC_URL = 
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
  'https://ethereum-sepolia-rpc.publicnode.com';