require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { coinListA, coinListB, coinListC, coinListD, coinListE, coinListF } = require('./src/utils/coinConfig');
const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;
const binanceBaseUrl = 'https://api.binance.com';


async function makeSellOrderWithQuoteOrderQty(symbol, quoteOrderQty) {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&side=SELL&type=MARKET&quoteOrderQty=${quoteOrderQty}&timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
    const url = `${binanceBaseUrl}/api/v3/order`;

    try {
        const response = await axios.post(url + '?' + queryString + '&signature=' + signature, {}, {
            headers: {
                'X-MBX-APIKEY': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Order successful:', response.data);
        // Process the successful response, such as logging order details
    } catch (error) {
        console.error('Order failed:', error.response && error.response.data ? error.response.data : error.message);
        // Handle errors, such as logging them
    }
}

// Example usage
// makeSellOrderWithQuoteOrderQty('PLAUSDT', 5);

async function getCurrentPrice(symbol) {
    const endpoint = `/api/v3/ticker/price?symbol=${symbol}USDT`; // Assuming USDT as quote asset
    const url = `${binanceBaseUrl}${endpoint}`;

    try {
        const response = await axios.get(url);
        return parseFloat(response.data.price);
    } catch (error) {
        console.error(`Failed to fetch current price for ${symbol}:`, error);
        return 0; // Optionally handle this scenario more gracefully
    }
}


async function fetchSpotWalletBalances() {
    const endpoint = '/api/v3/account';
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
    const url = `${binanceBaseUrl}${endpoint}?${queryString}&signature=${signature}`;

    try {
        const response = await axios.get(url, {
            headers: { 'X-MBX-APIKEY': API_KEY }
        });
        return response.data.balances.filter(balance =>
            parseFloat(balance.free) > 0
        );
    } catch (error) {
        console.error('Failed to fetch spot wallet balances:', error);
        return []; // Return an empty array on error
    }
}

async function fetchSpotWalletBalancesAndValues(coinLists) {
    const allBalances = await fetchSpotWalletBalances();
    const filteredBalances = allBalances.filter(balance => coinLists.flat().includes(balance.asset));

    const balanceValues = await Promise.all(filteredBalances.map(async (balance) => {
        const price = await getCurrentPrice(balance.asset);
        if (price <= 0) {
            console.error(`Price fetch failed for ${balance.asset}, skipping.`);
            return null;
        }
        const usdValue = price * parseFloat(balance.free);
        return { ...balance, usdValue }; // Append the USD value to each balance object
    }));

    return balanceValues.filter(entry => entry !== null);
}

fetchSpotWalletBalancesAndValues([coinListC, coinListD]).then(balancesWithValues => {
    console.log("Balances with USD Values:", balancesWithValues);
});


