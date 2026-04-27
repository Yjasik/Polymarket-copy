export type MarketOutcome = 'Undecided' | 'Yes' | 'No' | 'Cancelled';

export interface Market {
  id: bigint;
  question: string;
  description: string;
  imageUri: string;
  endTime: bigint;              
  outcome: MarketOutcome;
  totalYes: bigint;
  totalNo: bigint;
  totalPool: bigint;
  resolved: boolean;
  refunded: boolean;
  category?: string;
  createdAt?: string;
  volume24h?: bigint;
  lastTradePrice?: number;      
  
  yesPrice?: number;
  noPrice?: number;
  volumeFormatted?: string;
  timeRemaining?: string;
}

export interface Bet {
  id?: string;
  marketId: bigint;
  outcome: boolean; // true = Yes, false = No
  amount: bigint;
  transactionHash?: string;
  createdAt?: string;
}

export interface UserStats {
  totalBets: number;
  totalVolume: bigint;
  wonBets: number;
  profitLoss: bigint;
}