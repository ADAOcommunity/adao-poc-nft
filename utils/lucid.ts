import { Blockfrost, WalletProvider, Lucid, Network } from 'lucid-cardano';

const initializeLucid = async (walletName: string) => {
    let networkEndpoint = process.env.NETWORK === '0' ? 'https://cardano-testnet.blockfrost.io/api/v0' : 'https://cardano-mainnet.blockfrost.io/api/v0' //process.env.BLOCKFROST_URL ? process.env.BLOCKFROST_URL : ''
    let blockfrostApiKey = process.env.NETWORK === '0' ? process.env.BLOCKFROST_TESTNET : process.env.BLOCKFROST_MAINNET  //process.env.BLOCKFROST_API_KEY ? process.env.BLOCKFROST_API_KEY : ''
    let network: Network = process.env.NETWORK === '0' ? 'Testnet' : 'Mainnet'
    await Lucid.initialize(
        new Blockfrost(networkEndpoint, blockfrostApiKey),
        network
    )
    if (walletName) await Lucid.selectWallet(walletName as WalletProvider)
    return Lucid
}

export default initializeLucid