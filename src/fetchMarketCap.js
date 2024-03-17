const axios = require('axios');

const apiKey = '9967cb93-9d4e-4d91-8845-0e5ec9872ce4';
const apiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

axios
    .get(apiUrl, {
        params: {
            limit: 100, // Fetch 100 cryptocurrencies at a time
            start: 101, // Start with the 101st cryptocurrency
            convert: 'USD', // Convert prices to USD, you can change it to other currencies
        },
        headers: {
            'X-CMC_PRO_API_KEY': apiKey,
        },
    })
    .then((response) => {
        const data = response.data;
        if (data.status.error_code === 0) {
            const top100Coins = data.data;

            // Extract and log only the symbols
            const symbols = top100Coins.map((coin) => coin.symbol);
            console.log(symbols);
        } else {
            console.error('Error:', data.status.error_message);
        }
    })
    .catch((error) => {
        console.error('API Request Error:', error);
    });