import { Button, Modal } from "flowbite-react";
import { C, toHex } from "lucid-cardano";
import dynamic, { Loader } from "next/dynamic";
import { useState } from "react";
import { createLockingPolicyScript, mintTx } from "../utils/cardano";
import initializeLucid from "../utils/lucid";
import { useStoreState } from "../utils/store";
import credentials from "../credentials";

export default function UseSketchModal(props: { sketchLoader: Loader<{ address: string }> }) {
    const [show, showSketchModal] = useState<boolean>(false)
    const walletStore = useStoreState(state => state.wallet)
    const P5Sketch = dynamic(props.sketchLoader,
        { ssr: false }
    );

    async function mint(data: any, fileSrc: string | RegExpMatchArray, signTx: (txCbor: any) => Promise<any>) {
        const policy =  {policyId:credentials.policyId,policyScript:C.NativeScript.from_bytes(Buffer.from(credentials.script, 'hex'))}
        
        const tx = await mintTx(policy.policyScript, {
            [policy.policyId]: {
                'test': {
                    'image': data,
                    'files': [
                        {
                            src: fileSrc,
                            mediaType: "text/html"
                        }
                    ]
                }
            }
        }, { [policy.policyId + Buffer.from('test', 'ascii').toString('hex')]: BigInt(1) }, walletStore.name);

        
        let sTx = Buffer.from(await tx.txComplete.to_bytes()).toString('hex');
        console.log('Got tx')
        console.log(sTx)
        let sig = await signTx(sTx);
        console.log('got sig')
        console.log(sig)
        if (sig && sTx) {
            try {

                const rawResponse = await fetch(`/api/submit`, {
                    method: 'POST',
                    headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({txHex: sTx, signatureHex: sig})
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
            onClose={() => showSketchModal(false)}
        >
            <Modal.Header />
            <Modal.Body className="text-center">
                {walletStore.connected && walletStore.name ?
                    <>
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Your sketch
                        </h3>
                        <div className="flex justify-center content-center flex-col ">
                            <P5Sketch address={walletStore.address} />
                        </div>
                        <p className="mb-5 font-normal text-gray-500 dark:text-gray-400">
                            *Click and hold to play*
                        </p>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                color="green"
                                onClick={() => {
                                    const canvas: any = document.getElementById('defaultCanvas0')
                                    console.log('canvas')
                                    console.log(canvas)
                                    const dataUri = canvas.toDataURL('image/jpeg', 0.2)
                                    const data = dataUri.length > 64 ? dataUri.match(/(.|[\r\n]){1,64}/g) : dataUri
                                    const file = `ar://VhLE9PJYWLZTBhXcVKpbfoG-xofAagE9KABuIi9OCCs?addr=${walletStore.address}`
                                    const fileSrc = file.length > 64 ? file.match(/(.|[\r\n]){1,64}/g) : file

                                    // const policy = createLockingPolicyScript(null, walletStore.address, false)
                                    //"policyId":"edf578cc1edc64c799812c541cef7343a5cb58cf85e109b1da91b836","policyScript":"8201828200581c77491199a0c7465bdf3b330b4d941888b0e8770093b2a99a9fd8595282051a04f45abd"}
                                    mint(data, fileSrc, signTx)
                                }}
                            >
                                Mint
                            </Button>
                            <Button
                                color="alternative"
                                onClick={() => showSketchModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                    : <>
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Connect a Cardano wallet to generate a sketch. Your address is used as a seed for pseudorandomness.
                        </h3>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                color="alternative"
                                onClick={() => showSketchModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                }
            </Modal.Body>
        </Modal>
    </>

    return { modalHtml, showSketchModal }
}
