// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { C } from "lucid-cardano"

export default async function handler(req, res) {

    const sKey = C.PrivateKey.generate_ed25519extended()
    const sKeyHash = sKey.to_public().hash()
    const stakeCred = C.StakeCredential.from_keyhash(sKeyHash)
    const addr =  C.BaseAddress.new(1, stakeCred, stakeCred).to_address().to_bech32()

    const date = new Date()
    var newDate = new Date(date.setMonth(date.getMonth()+6))

    const policy = createLockingPolicyScript(addr, newDate)

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
      }
      if (policy.lockSlot) policyScript.scripts.push({ slot: policy.lockSlot, type: "before" })
      fetch(`https://pool.pm/register/policy/${policy.policyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policyScript),
      })
      const returnVal = {
        address: addr,
        policyId: policy.policyId,
        script: Buffer.from(policy.script.to_bytes()).toString('hex'),
        paymentKeyHash: policy.paymentKeyHash,
        key: Buffer.from(sKey.as_bytes()).toString('hex')
    }
    console.log(returnVal)
    return res.status(200).json(returnVal)
}

const SlotLength = 432000
const shelleyStart = (isMainnet: boolean): number => isMainnet ? 4924800 : 4924800 + 129600 - SlotLength
const networkOffset = (isMainnet: boolean): number => isMainnet ? 1596491091 : 1599294016 + 129600 - SlotLength
const estimateDateBySlot = (slot: number, isMainnet: boolean): Date => new Date((slot - shelleyStart(isMainnet) + networkOffset(isMainnet)) * 1000)
const estimateSlotByDate = (date: Date, isMainnet: boolean): number => Math.floor(date.getTime() / 1000) + shelleyStart(isMainnet) - networkOffset(isMainnet)
const slotSinceShelley = (slot: number, isMainnet: boolean): number => slot - shelleyStart(isMainnet)
const getEpochBySlot = (slot: number, isMainnet: boolean) => Math.floor(slotSinceShelley(slot, isMainnet) / SlotLength) + (isMainnet ? 208 : 80) + 1
const getSlotInEpochBySlot = (slot: number, isMainnet: boolean) => slotSinceShelley(slot, isMainnet) % SlotLength

const DATUM_LABEL = 405;

const createLockingPolicyScript = (address: string, expirationTime: Date, mainnet: boolean = true) => {
    const lockSlot = !expirationTime ? undefined : estimateSlotByDate(expirationTime, mainnet)
    
    const nativeScripts = C.NativeScripts.new();
    const paymentKeyHash = C.BaseAddress.from_address(
        C.Address.from_bech32(address)
    )
      .payment_cred()
      .to_keyhash();

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
    return { policyId: policyId, script: finalScript, lockSlot: lockSlot, paymentKeyHash: keyHashString };
}

