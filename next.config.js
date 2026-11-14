module.exports = {
  reactStrictMode: true,
  env: {
    GTM_ID: process.env.GTM_ID,
    NEXT_PUBLIC_GA_ID:
      process.env.NEXT_PUBLIC_GA_ID ?? process.env.GA4_MEASUREMENT_ID,
  },
};

