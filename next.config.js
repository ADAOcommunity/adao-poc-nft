/** @type {import('next').NextConfig} */
const nextConfig = {
  
  experimental: {
    outputStandalone: true
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.experiments = { 
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true
    }
    return config
  },
  env:{
    SERVER_PRIVATE_KEY: '40b6e956c6cba0b3319bc53770a147c942be7e9569ed6b48d1f325bae4d043537b2078575643309a1f1e73ca3e522f968aefab63c93080c48522ed8c8bc5ae79',
    NETWORK:'0',
    BLOCKFROST_MAINNET:'',
    BLOCKFROST_TESTNET:'testnetRvOtxC8BHnZXiBvdeM9b3mLbi8KQPwzA'
  }
}

module.exports = nextConfig
