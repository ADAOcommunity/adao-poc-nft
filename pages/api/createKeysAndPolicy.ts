// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { C } from "lucid-cardano"
import { Ed25519KeyHash } from "lucid-cardano/custom_modules/cardano-multiplatform-lib-nodejs";

export default async function handler(req, res) {

    const sKey = C.PrivateKey.generate_ed25519extended()
    const sKeyHash = sKey.to_public().hash()
    const stakeCred = C.StakeCredential.from_keyhash(sKeyHash)
    const addr =  C.BaseAddress.new(0, stakeCred, stakeCred).to_address().to_bech32()


    const pol = createPolicy(sKeyHash)

    return res.status(200).json({
        address: addr,
        policyId: pol.policyId,
        script: Buffer.from(pol.script.to_bytes()).toString('hex'),
        paymentKeyHash: sKeyHash.to_hex(),
        key: Buffer.from(sKey.as_bytes()).toString('hex')
    })
}

const createPolicy = (keyhash: Ed25519KeyHash) => {
    const nativeScripts = C.NativeScripts.new();
    const script = C.ScriptPubkey.new(keyhash);
    const nativeScript = C.NativeScript.new_script_pubkey(script);
    nativeScripts.add(nativeScript);
    const finalScript = C.NativeScript.new_script_all(
        C.ScriptAll.new(nativeScripts)
    );
    const policyId = Buffer.from(
        C.ScriptHash.from_bytes(
            finalScript.hash(C.ScriptHashNamespace.NativeScript).to_bytes()
        ).to_bytes(),
    ).toString("hex");

    return { policyId: policyId, script: finalScript, paymentKeyHash: keyhash.to_hex() }
}