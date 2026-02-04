export type PaymentCredentials = {
  // Stripe / Paystack / Flutterwave
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;

  // Mpesa (Daraja)
  consumerKey?: string;
  consumerSecret?: string;
  passkey?: string;
  shortcode?: string;

  // OAuth / generic providers
  clientId?: string;
  clientSecret?: string;

  // Anything extra
  [key: string]: string | undefined;
};
