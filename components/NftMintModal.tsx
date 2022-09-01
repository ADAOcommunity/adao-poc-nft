import { Button, Modal } from "flowbite-react";
import { C, toHex } from "lucid-cardano";
import { useState } from "react";
import { mintTx } from "../utils/cardano";
import initializeLucid from "../utils/lucid";
import { useStoreState } from "../utils/store";
import mintinfo from "../mint";
import UseAnimations from 'react-useanimations';
import alertTriangle from 'react-useanimations/lib/alertTriangle'
import loading from 'react-useanimations/lib/loading'
import success from 'react-useanimations/lib/checkmark'


type ActionState = "loading" | "success" | "error" | undefined
export default function UseNftModal(props: { nftName: string, collectionName: string, metadata: object }) {
    const [show, nftModalVisible] = useState<boolean>(false)
    const [state, setState] = useState<ActionState>(undefined)
    const [msg, setMsg] = useState("")

    const showNftModal = (state: boolean = true) => {
        if (state) {
            setMsg("")
            setState(undefined)
            setMsg("")
        } else {
            setMsg("")
            setState(undefined)
        }
        nftModalVisible(state)
    }

    const doAction = async (action: () => Promise<any>) => {
        setMsg("")
        setState("loading")
        setMsg("Waiting...")
        try {
            const res = await action()
            setMsg("")
            setState('success')
            setMsg(`Submitted: ${res}`)
        } catch (err: any) {
            setMsg("")
            setState('error')
            setMsg(`Error: ${err.info || err.message || err ? typeof err === "object" ? JSON.stringify(err) : '' : ''}`)
        }
    }

    const walletStore = useStoreState(state => state.wallet)

    async function mint(signTx: (txCbor: any) => Promise<any>) {
        const policy = { policyId: mintinfo.policyId, policyScript: C.NativeScript.from_bytes(Buffer.from(mintinfo.script, 'hex')) }

        let nftIndex = 0
        try {
            const indexRes = await (await fetch(`/api/collectionindex/${props.collectionName}`)).json()

            if (indexRes.error) throw indexRes.error
            if (!indexRes.nftIndex) throw 'Could not retrieve next NFT index for this collection.'

            nftIndex = indexRes.nftIndex

        } catch (exc) {
            throw exc
        }

        let meta = JSON.parse(JSON.stringify(props.metadata))

        meta['name'] = meta['name'] + ` ${nftIndex}`

        const tx = await mintTx(policy.policyScript, {
            [policy.policyId]: {
                [props.nftName + nftIndex.toString()]: meta
            }
        }, { [policy.policyId + Buffer.from(props.nftName + nftIndex.toString(), 'ascii').toString('hex')]: BigInt(1) }, walletStore.name);

        let sTx = Buffer.from(await tx.txComplete.to_bytes()).toString('hex');
        let sig = await signTx(sTx);
        if (sig && sTx) {
            try {
                const response = await fetch(`/api/submit/${props.collectionName}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ txHex: sTx, signatureHex: sig })
                })
                const jsonRes = await response.json()
                if (jsonRes.txhash) return jsonRes.txhash
                else throw jsonRes.error
            } catch (exc) {
                throw exc
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
                        {state && msg ?
                            <>
                                <UseAnimations
                                    className="mx-auto"
                                    strokeColor="currentColor"
                                    size={128}
                                    animation={
                                        state === 'error' ?
                                            alertTriangle : state === 'success' ?
                                                success : loading
                                    }
                                />
                                <h3 className="text-lg font-bold mx-auto">{msg}</h3>
                            </>
                            :
                            <>
                                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                                    Mint your Cardano NFT
                                </h3>
                                <div className="flex justify-end gap-4 pt-4">
                                    <Button
                                        color="green"
                                        onClick={() => {
                                            doAction(() => mint(signTx))
                                        }}
                                    >
                                        Mint
                                    </Button>
                                    <Button
                                        color="alternative"
                                        onClick={() => {
                                            setMsg("")
                                            setState(undefined)
                                            showNftModal(false)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        }
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
