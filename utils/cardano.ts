
import { Assets, C, Network, Tx, WalletProvider } from "lucid-cardano";
import { NativeScript } from "lucid-cardano/custom_modules/cardano-multiplatform-lib-browser";
import mint from "../mint";

export interface AssetInfoBF {
    asset:                string
    policy_id:            string
    asset_name:           string
    fingerprint:          string
    quantity:             string
    initial_mint_tx_hash: string
    mint_or_burn_count:   number
    onchain_metadata:     OnchainMetadata
    metadata:             BFMetadata
}

export interface BFMetadata {
    name:        string
    description: string
    ticker:      string
    url:         string
    logo:        string
    decimals:    number
}

export interface OnchainMetadata {
    name:  string
    image: string
}

const SlotLength = 432000
const shelleyStart = (isMainnet: boolean): number => isMainnet ? 4924800 : 4924800 + 129600 - SlotLength
const networkOffset = (isMainnet: boolean): number => isMainnet ? 1596491091 : 1599294016 + 129600 - SlotLength
const estimateDateBySlot = (slot: number, isMainnet: boolean): Date => new Date((slot - shelleyStart(isMainnet) + networkOffset(isMainnet)) * 1000)
const estimateSlotByDate = (date: Date, isMainnet: boolean): number => Math.floor(date.getTime() / 1000) + shelleyStart(isMainnet) - networkOffset(isMainnet)
const slotSinceShelley = (slot: number, isMainnet: boolean): number => slot - shelleyStart(isMainnet)
const getEpochBySlot = (slot: number, isMainnet: boolean) => Math.floor(slotSinceShelley(slot, isMainnet) / SlotLength) + (isMainnet ? 208 : 80) + 1
const getSlotInEpochBySlot = (slot: number, isMainnet: boolean) => slotSinceShelley(slot, isMainnet) % SlotLength

export type Policy = { 
    policyId: string, script: NativeScript, lockSlot: number, paymentKeyHash: string 
}

const DATUM_LABEL = 405;

const createLockingPolicyScript = (expirationTime: Date, walletAddress: string, mainnet: boolean = true) => {
    const lockSlot = !expirationTime ? undefined : estimateSlotByDate(expirationTime, mainnet)
    
    const paymentKeyHash = C.BaseAddress.from_address(
        C.Address.from_bech32(walletAddress)
    )
      .payment_cred()
      .to_keyhash();

    const nativeScripts = C.NativeScripts.new();
    const script = C.ScriptPubkey.new(paymentKeyHash);
    const nativeScript = C.NativeScript.new_script_pubkey(script);
    if(lockSlot) {
      const lockScript = C.NativeScript.new_timelock_expiry(
        C.TimelockExpiry.new(C.BigNum.from_str(lockSlot.toString()))
      );
      nativeScripts.add(lockScript);
    }
    nativeScripts.add(nativeScript);
    const finalScript = C.NativeScript.new_script_all(
      C.ScriptAll.new(nativeScripts)
    );
    const policyId = Buffer.from(
      C.ScriptHash.from_bytes(
        finalScript.hash(C.ScriptHashNamespace.NativeScript).to_bytes()
      ).to_bytes(),
    ).toString("hex");
    const keyHashString = Buffer.from(
      paymentKeyHash.to_bytes(),
    ).toString("hex");
    const policy = { policyId: policyId, script: finalScript, lockSlot: lockSlot, paymentKeyHash: keyHashString }
    registerPolicy(policy)
    return policy;
}

function registerPolicy(policy: { policyId: string; script: NativeScript; lockSlot: number; paymentKeyHash: string; }) {
    const policyScript: {
        type: string;
        scripts: any[];
    } = {
        type: "all",
        scripts: [
            {
                keyHash: policy.paymentKeyHash,
                type: "sig",
            }
        ],
    };
    if (policy.lockSlot)
        policyScript.scripts.push({ slot: policy.lockSlot, type: "before" });
    fetch(`https://pool.pm/register/policy/${policy.policyId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(policyScript),
    })
}

const getAssetsInfo: (unit: string) => Promise<AssetInfoBF> = async (unit: string) => {
  let networkEndpoint = process.env.NETWORK === '0' ? 'https://cardano-testnet.blockfrost.io/api/v0' : 'https://cardano-mainnet.blockfrost.io/api/v0' //process.env.BLOCKFROST_URL ? process.env.BLOCKFROST_URL : ''
  let blockfrostApiKey = process.env.NETWORK === '0' ? process.env.BLOCKFROST_TESTNET: process.env.BLOCKFROST_MAINNET  //process.env.BLOCKFROST_API_KEY ? process.env.BLOCKFROST_API_KEY : ''
  return (await (await fetch(`${networkEndpoint}/assets/${unit}`, { headers: {
      project_id: blockfrostApiKey
  }})).json() as AssetInfoBF)
}


const mintTx = async (policyScript: NativeScript, metadata: any, mintAssets: Assets, walletName: string) => {
  let networkEndpoint = process.env.NETWORK === '0' ? 'https://cardano-testnet.blockfrost.io/api/v0' : 'https://cardano-mainnet.blockfrost.io/api/v0' //process.env.BLOCKFROST_URL ? process.env.BLOCKFROST_URL : ''
  let blockfrostApiKey = process.env.NETWORK === '0' ? process.env.BLOCKFROST_TESTNET: process.env.BLOCKFROST_MAINNET  //process.env.BLOCKFROST_API_KEY ? process.env.BLOCKFROST_API_KEY : ''
  let network : Network = process.env.NETWORK === '0' ? 'Testnet' : 'Mainnet'
  const { Lucid, Blockfrost } = await import('lucid-cardano')
    await Lucid.initialize(
        new Blockfrost(networkEndpoint, blockfrostApiKey),
        network
    )
    await Lucid.selectWallet(walletName as WalletProvider)
    const walletAddr = await Lucid.wallet.address()
    let assets = {...mintAssets}; assets['lovelace']=BigInt(1600000);
    const tx = await Tx.new()
              .attachMetadataWithConversion(721, metadata)
              .attachMintingPolicy({
                  type: "Native",
                  script: Buffer.from(policyScript.to_bytes()).toString('hex')
              })
              .mintAssets(mintAssets)
              .addSigner(walletAddr)
              .validTo(Date.now()+parseInt(mint.reservationTime)*60000)
              .payToAddress(mint.address, {['lovelace']: BigInt(Number(mint.nftAdaPrice) * 1000000)})
              .payToAddress(walletAddr, assets)
              .complete()

    return tx;
    // return await signedTx.submit();
}

export { estimateDateBySlot, estimateSlotByDate, getEpochBySlot, getSlotInEpochBySlot, createLockingPolicyScript, mintTx, getAssetsInfo, DATUM_LABEL, SlotLength }
