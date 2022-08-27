const blockfrostRequest = async ({
    body = null,
    endpoint = '',
    headers = {},
    method = 'GET'
}) => {
    let networkEndpoint = process.env.NETWORK === '0' ? 'https://cardano-testnet.blockfrost.io/api/v0' : 'https://cardano-mainnet.blockfrost.io/api/v0' //process.env.BLOCKFROST_URL ? process.env.BLOCKFROST_URL : ''
    let blockfrostApiKey = process.env.NETWORK === '0' ? process.env.BLOCKFROST_TESTNET: process.env.BLOCKFROST_MAINNET  //process.env.BLOCKFROST_API_KEY ? process.env.BLOCKFROST_API_KEY : ''

    try {
        return await (
            await fetch(`${networkEndpoint}${endpoint}`, {
                headers: {
                    project_id: blockfrostApiKey,
                    ...headers,
                },
                method: method,
                body,
            })
        ).json();
    } catch (error) {
        console.log(error);
        return null;
    }
}

export default blockfrostRequest