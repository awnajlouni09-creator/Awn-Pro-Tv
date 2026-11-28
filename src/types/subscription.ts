export interface SubscriptionConfig {
  enabled: boolean;
  monthlyPriceUsd: number;
  paypalEmail: string;
  giftCodes: string[];
}

export interface ActiveSubscription {
  isActive: boolean;
  method: 'paypal' | 'gift_code' | 'admin';
  activatedAt: number;
  expiresAt: number | null;
  payerEmail?: string;
  paypalReference?: string;
  giftCodeUsed?: string;
}

export const DEFAULT_SUBSCRIPTION_CONFIG: SubscriptionConfig = {
  enabled: true,
  monthlyPriceUsd: 2,
  paypalEmail: 'awnajlouni09@gmail.com',
  giftCodes: ['911']
};
