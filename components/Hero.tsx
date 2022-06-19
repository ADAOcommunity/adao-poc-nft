export default function Hero() {
    return <section>
      <div>
        <div className="container flex flex-col items-center px-4 py-16 pb-24 mx-auto text-center lg:pb-56 md:py-32 md:px-10 lg:px-32 dark:text-gray-50">
          <h1 className="text-5xl font-bold leading-none sm:text-6xl xl:max-w-3xl dark:text-gray-50">ADAO&apos;s Proof of Community week NFTs</h1>
          <p className="mt-6 mb-8 text-lg sm:mb-12 xl:max-w-3xl dark:text-gray-50">Decenetralization together</p>
          <div className="flex flex-wrap justify-center">
            <a href="#Mint" className="px-8 py-3 m-2 text-lg font-semibold rounded hover:scale-110 hover:-rotate-3 bg-gray-800 text-gray-50 dark:bg-gray-50 dark:text-gray-800">Mint</a>
            <button type="button" className="px-8 py-3 m-2 text-lg border rounded hover:scale-110 dark:border-gray-700 dark:text-gray-50">Learn more</button>
          </div>
        </div>
      </div>
      {/* <video
        className="w-5/6 mx-auto mb-12 -mt-20 rounded-lg shadow-md lg:-mt-40 dark:bg-gray-500"
        poster="/dz-landing-video.jpg"
        onMouseOver={event => (event.target as HTMLVideoElement).play()}
        onMouseOut={event => (event.target as HTMLVideoElement).pause()}
        src="/dz-landing-video.mp4" loop muted>
      </video> */}
    </section>
  }
  