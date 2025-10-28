export interface BuyerProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'buyer';
  portfolioImageUrl: string;
  Interest: string;
  city: 'Lagos';
  Address: string;
  createdAt: string;
  walletBalance: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}