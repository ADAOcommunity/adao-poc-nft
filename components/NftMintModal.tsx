import { Button, Modal } from "flowbite-react";
import { C, toHex } from "lucid-cardano";
import { useState } from "react";
import { mintTx } from "../utils/cardano";
import initializeLucid from "../utils/lucid";
import { useStoreState } from "../utils/store";
import mintinfo from "../mint";

export default function UseNftModal(props: { nftName: string, collectionName: string, metadata: object }) {
    const [show, showNftModal] = useState<boolean>(false)
    const walletStore = useStoreState(state => state.wallet)

    async function mint(signTx: (txCbor: any) => Promise<any>) {
        const policy = { policyId: mintinfo.policyId, policyScript: C.NativeScript.from_bytes(Buffer.from(mintinfo.script, 'hex')) }

        let nftIndex = 0
        try {
            const indexRes = await (await fetch(`/api/collectionindex/${props.collectionName}`)).json()

            if(indexRes.error) throw indexRes.error
            if(!indexRes.nftIndex) throw 'Could not retrieve next NFT index for this collection.'
            
            nftIndex = indexRes.nftIndex
            
        } catch(exc) {
            throw exc
        }

        let meta = props.metadata

        meta['name'] = meta['name'] + ` ${nftIndex}`

        const tx = await mintTx(policy.policyScript, {
            [policy.policyId]: {
                [props.nftName + nftIndex.toString()]: meta
            }
        }, { [policy.policyId + Buffer.from(props.nftName + nftIndex.toString(), 'ascii').toString('hex')]: BigInt(1) }, walletStore.name);

        let sTx = Buffer.from(await tx.txComplete.to_bytes()).toString('hex');
        console.log('Got tx')
        console.log(sTx)
        let sig = await signTx(sTx);
        console.log('got sig')
        console.log(sig)
        if (sig && sTx) {
            try {
                const rawResponse = await fetch(`/api/submit/${props.collectionName}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ txHex: sTx, signatureHex: sig })
                });
                console.log(rawResponse)
                const jsonRes = await rawResponse.json()
                console.log(jsonRes)
                return jsonRes
            } catch {
            }
        }
        throw "Transaction failed to submit";
    }

    const signTx = async (txCbor: any) => {
        await initializeLucid(walletStore.name)
        const api = await window.cardano[walletStore.name].enable();
        const transaction = C.Transaction.from_bytes(Buffer.from(txCbor, 'hex'));

        let witness: any = await api.signTx(toHex(transaction.to_bytes()), true);
        return witness;
    }

    const modalHtml = <>
        <Modal
            show={show}
            // size="md"
            popup={true}
            key={`sketch${Math.random()}`}
            size="5xl"
            onClose={() => showNftModal(false)}
        >
            <Modal.Header />
            <Modal.Body className="text-center">
                {walletStore.connected && walletStore.name ?
                    <>
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Your sketch
                        </h3>
                        <div className="flex justify-center content-center flex-col ">
                            {/* <P5Sketch address={walletStore.address} /> */}
                        </div>
                        <p className="mb-5 font-normal text-gray-500 dark:text-gray-400">
                            *Click and hold to play*
                        </p>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                color="green"
                                onClick={() => {


                                    mint(signTx)
                                }}
                            >
                                Mint
                            </Button>
                            <Button
                                color="alternative"
                                onClick={() => showNftModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                    : <>
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Connect a Cardano wallet to mint the NFT
                        </h3>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                color="alternative"
                                onClick={() => showNftModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                }
            </Modal.Body>
        </Modal>
    </>

    return { modalHtml, showNftModal }
}
