import Head from 'next/head'
import Foot from '../components/Foot'
import Hero from '../components/Hero'
import Menu from '../components/Menu'
import MintItem from '../components/MintItem'

export default function Home() {
  
  return (
    <div className="dark:bg-gray-800">
      <Head>
        <title>DZ - NFT</title>
        <meta name="description" content="DZ - fun with audio, visuals and algorithms" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Menu/>
      <main>
        <Hero/>
        <section id="Mint">
          <MintItem left={true}/>
        </section>
      </main>
      <Foot/>
    </div>
  )
}
