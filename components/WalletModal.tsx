import { Button, Modal } from "flowbite-react";
import { useState } from "react";
import { useStoreState } from "../utils/store";

export default function UseWalletModal(connect: (name: string, connect?: boolean) => Promise<void>) {
    const [show, showModal] = useState<boolean>(false)
    const availableWallets = useStoreState(state => state.availableWallets)
    
    const connectWallet = async (walletName: string) => {
        await connect(walletName)
        showModal(false)
    }

    const modalHtml = <>
        <Modal
            show={show}
            size="md"
            popup={true}
            onClose={() => showModal(false)}
        >
            <Modal.Header />
            <Modal.Body className="text-center">
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                    Connect a walllet
                </h3>
                <div className="flex flex-col ">
                    {availableWallets.map(wltName => <button key={wltName}
                        className="px-8 py-3 m-2 text-lg font-semibold rounded hover:scale-105 bg-gray-800 text-gray-50 dark:bg-gray-50 dark:text-gray-800"
                        //{`mx-auto w-32 px-8 py-3 text-lg font-semibold rounded hover:scale-110 hover:-rotate-3 bg-gray-800 text-gray-50 dark:bg-gray-50 dark:text-gray-800 focus:outline-none focus:ring`}
                        onClick={() => {
                            connectWallet(wltName.toLowerCase())
                        }}
                    >
                        {wltName}
                    </button>)}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        color="alternative"
                        onClick={() => showModal(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    </>

    return { modalHtml, showModal }
}
