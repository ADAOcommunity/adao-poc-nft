# ADAO Proof of community week mint - solution

It uses limiter to process submition and nft selection in single thread, so no double mints or collisions occur. For this reason, you should **NOT** use serverless environment like Vercel to host this solution, but rather use app instance/vps.

# Usage

## 1. Install dependencies
run `yarn`

## 2. Configure database
Create a .env file with your database url. e.g.: 
`DATABASE_URL="file:./test.db"` for a sqlite database
You can specify your database provider inside the `prisma/schema.prisma` file.

Then run `yarn prisma seed` to seed the database with the NFT collections data. If you want to use custom NFT metadata, you can do so by editing the mint.ts file.

## 3. Configure blockfrost
In the `next.config.js` file, enter your blockfrost API key. You must set a value for the NETWORK: `0` for testnet or `1` for mainnet.
## 4. Configure policy and secret key
Run `yarn dev`, then go to localhost:3000/api/createKeysAndPolicy
Replace the values inside the mint variable in mint.ts by those obtained in the api response (do not paste the secret key here).
You can also set the reservation time and minting price inside this mint variable.
Copy the key and add it as environment variable inside `next.config.js`

