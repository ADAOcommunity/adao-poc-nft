import { Dropdown } from "flowbite-react";
import { useEffect, useState } from "react";
import initializeLucid from "../utils/lucid";
import { useStoreActions, useStoreState } from "../utils/store";
import UseWalletModal from "./WalletModal";

export default function WalletConnect() {
    const walletStore = useStoreState(state => state.wallet)
    const setWallet = useStoreActions(actions => actions.setWallet)
    const availableWallets = useStoreState(state => state.availableWallets)
    const setAvailableWallets = useStoreActions(actions => actions.setAvailableWallets)
    const connectWallet = async (name: string, connect: boolean = true) => {
        if (connect) {
            if (
                window.cardano &&
                (await window.cardano[name].enable())
            ) {
                walletConnected(name)
            }
        } else {
            walletConnected('', false)
        }
    }
    const { modalHtml, showModal } = UseWalletModal(connectWallet)

    const walletConnected = async (wallet: string, connect: boolean = true) => {
        const addr = connect ? await (await initializeLucid(wallet)).wallet.address() : ''
        const walletStoreObj = connect ? { connected: true, name: wallet, address: addr } : { connected: false, name: '', address: '' }
        setWallet(walletStoreObj)
    }
    const loadWalletSession = async () => {
        if (walletStore.connected &&
            walletStore.name &&
            window.cardano &&
            (await window.cardano[walletStore.name].enable())
        ) {
            walletConnected(walletStore.name)
        }
    }

    useEffect(() => {
        let wallets = []
        if (window.cardano) {
            if (window.cardano.nami) wallets.push('Nami')
            if (window.cardano.eternl) wallets.push('Eternl')
            if (window.cardano.flint) wallets.push('Flint')
            loadWalletSession()
        }
        if (availableWallets !== wallets) setAvailableWallets(wallets)
    }, [])

    return (
    <div>
        {modalHtml}
        {!walletStore.connected ?
            // <Button className="mr-4" onClick={() => {
            //     showModal(true)
            //     // connectWallet('nami')
            // }}>
            <button type="button" onClick={() => {
                    showModal(true)
                // connectWallet('nami')
                }} className="px-8 py-2 m-2 text-lg font-semibold rounded hover:scale-95 bg-gray-800 text-gray-50 dark:bg-gray-50 dark:text-gray-800">
                Connect a wallet
            </button>
            :
            <div className="mr-4 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5">
                <Dropdown
                    arrowIcon={false}
                    inline={true}
                    label={<WalletIcon />}
                >
                    <Dropdown.Header>
                        <span className="block text-sm">
                            Address
                        </span>
                        <span className="block truncate text-sm font-medium">
                            {walletStore.address}
                        </span>
                    </Dropdown.Header>
                    {availableWallets.map(wltName => <Dropdown.Item key={wltName} onClick={() => {
                        connectWallet(wltName.toLowerCase())
                    }}>
                        {wltName}
                    </Dropdown.Item>)}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => {
                        connectWallet('', false)
                    }}>
                        Disconnect
                    </Dropdown.Item>
                </Dropdown>
            </div>}
    </div>)
}

function WalletIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
    )
}