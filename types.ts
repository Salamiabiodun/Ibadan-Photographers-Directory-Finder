
export interface Photographer {
  uid: string;
  fullName: string;
  email: string;
  role: 'photographer';
  isFeatured: boolean;
  portfolioImageUrl: string;
  specialty: string;
  city: 'Ibadan';
  createdAt: string;
  earnings: number;
  walletBalance: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
