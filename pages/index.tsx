import Head from 'next/head'
import { cloneElement } from 'react'
import Foot from '../components/Foot'
import Hero from '../components/Hero'
import Menu from '../components/Menu'
import MintItem from '../components/MintItem'
import { collections } from '../mint'

export default function Home() {
  
  return (
    <div className="dark:bg-gray-800">
      <Head>
        <title>ADAO - Proof of Community - NFT</title>
        <meta name="description" content="The ADAO 's Proof of Community commemorative NFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Menu/>
      <main>
        <Hero/>
        <section id="Mint">
          {collections.map(col => 
            <MintItem
              author={col.author}
              collectionName={col.collectionName}
              description={col.description}
              examples={col.examples}
              left={col.left}
              name={col.name}
              key={col.name}
              metadata={col.metadata}
            />

          )}
        </section>
      </main>
      <Foot/>
    </div>
  )
}
