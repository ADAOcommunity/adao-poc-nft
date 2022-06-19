import { Footer } from "flowbite-react";
import { BsTwitter, BsGithub, BsInstagram, BsDiscord } from 'react-icons/bs';
import Logo from "./Logo";

export default function Foot() {
    return (
        <Footer className="flex flex-col">
            <div id="Contact" className="grid w-3/4 justify-between sm:flex sm:justify-between md:flex md:grid-cols-1">
                    <Logo className="w-28 h-28 my-8 md:my-4" />
                <div className="grid grid-cols-2 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6">
                    <div>
                        <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">
                            About
                        </h2>
                        <Footer.LinkGroup className="flex-col">
                            {/* POC link */}
                            <Footer.Link
                                className="mb-4"
                                href="https://theadao.io"
                            >
                                About
                            </Footer.Link>
                            <Footer.Link
                                className="mb-4"
                                href="#Mint"
                            >
                                Mint
                            </Footer.Link>
                            <Footer.Link
                                className="mb-4"
                                href="https://theadao.io"
                            >
                                ADAO
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                    <div>
                        <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">
                            Follow us
                        </h2>
                        <Footer.LinkGroup className="flex-col">
                            <Footer.Link
                                className="mb-4"
                                href="#"
                            >
                                Twitter
                            </Footer.Link>
                            <Footer.Link
                                className="mb-4"
                                href="#"
                            >
                                Github
                            </Footer.Link>
                            <Footer.Link
                                className="mb-4"
                                href="#"
                            >
                                Discord
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>                    
                </div>
            </div>
            <hr className="my-6 w-full border-gray-200 p-1 dark:border-gray-700 sm:mx-auto lg:my-8" />
            <div className="w-full sm:flex sm:items-center sm:justify-between">
                <Footer.Copyright
                    href="#"
                    by="ADAO"
                    year={new Date().getFullYear() }
                />
                <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
                    <Footer.Icon
                        href="#"
                        className="text-gray-400 hover:text-gray-900"
                        icon={BsTwitter}
                    />
                    <Footer.Icon
                        href="#"
                        className="text-gray-400 hover:text-gray-900"
                        icon={BsGithub}
                    />
                    <Footer.Icon
                        href="#"
                        className="text-gray-400 hover:text-gray-900"
                        icon={BsDiscord}
                    />
                    <Footer.Icon
                        href="#"
                        className="text-gray-400 hover:text-gray-900"
                        icon={BsInstagram}
                    />
                </div>
            </div>
        </Footer>
    )
}