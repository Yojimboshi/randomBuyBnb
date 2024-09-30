// src\limitBuyOrders.js
// Imports and Configurations
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { tierA, tierB, tierC, tierD, memeList, unwantedList } = require('./utils/myCoinList');
const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;
const binanceBaseUrl = 'https://api.binance.com';
const logFilePath = '../log/limitBuyOrders.log';
const quoteCoin = 'FDUSD'
const fallbackQuoteCoin = 'USDT';

// Utility Functions
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

function roundUpToNearestTen(num) {
    return Math.ceil(num / 10) * 10;
}

async function getCurrentPrice(symbol) {
    try {
        const response = await axios.get(`${binanceBaseUrl}/api/v3/ticker/price?symbol=${symbol}`);
        return parseFloat(response.data.price);
    } catch (error) {
        console.error('Failed to fetch current price:', error.message);
        return null; // Handle null in caller function
    }
}

async function getSymbolInfo(symbol) {
    try {
        const response = await axios.get(`${binanceBaseUrl}/api/v3/exchangeInfo?symbol=${symbol}`);
        return response.data.symbols[0];
    } catch (error) {
        console.error('Failed to fetch symbol info:', error.message);
        return null;
    }
}

function adjustPriceToTickSize(price, tickSize) {
    const tickSizeDecimals = countDecimals(tickSize);
    // Calculate the multiplier for adjusting the price accurately
    const priceMultiplier = Math.pow(10, tickSizeDecimals);
    // Adjust the price based on the tick size
    const adjustedPrice = Math.round(price * priceMultiplier / (tickSize * priceMultiplier)) * tickSize;
    return adjustedPrice.toFixed(tickSizeDecimals);
}



function countDecimals(value) {
    if (Math.floor(value) === value) return 0;
    return value.toString().split(".")[1]?.length || 0;
}


function adjustQuantityToLotSize(quantity, stepSize) {
    const stepSizeDecimals = countDecimals(stepSize);
    const multiplier = Math.pow(10, stepSizeDecimals);
    const adjustedQuantity = Math.floor((quantity * multiplier) / (stepSize * multiplier)) * stepSize;
    return Number(adjustedQuantity.toFixed(stepSizeDecimals));
}


// Binance API Interaction Functions
async function makeLimitBuyOrder(symbol, usdtAmount, limitPrice) {
    const symbolInfo = await getSymbolInfo(symbol);
    if (!symbolInfo) {
        console.error(`Could not fetch symbol info for ${symbol}`);
        return false;
    }

    const tickSize = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize;
    const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE').stepSize;
    const adjustedLimitPrice = adjustPriceToTickSize(limitPrice, tickSize);

    const quantity = usdtAmount / adjustedLimitPrice;
    const adjustedQuantity = adjustQuantityToLotSize(quantity, lotSize);

    const timestamp = Date.now();
    const data = {
        symbol,
        side: 'BUY',
        type: 'LIMIT',
        quantity: adjustedQuantity,
        price: adjustedLimitPrice,
        timeInForce: 'GTC',
        timestamp
    };

    const queryString = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
    const signedQueryString = `${queryString}&signature=${signature}`;

    console.log('Sending order with data:', data);
    try {
        const response = await axios.post(`${binanceBaseUrl}/api/v3/order?${signedQueryString}`, {}, {
            headers: { 'X-MBX-APIKEY': API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log('Order successful:', response.data);
        logSuccessDetails(response.data);
        return true;
    } catch (error) {
        console.error('Order failed:', error.response && error.response.data ? error.response.data : error.message);
        logToFile(`Order failed: Attempted to buy with ${usdtAmount} USDT on ${symbol} - ${error.message}`);
        return false;
    }
}

function logSuccessDetails(data) {
    const { symbol, orderId, transactTime, price, origQty, status,
        timeInForce, type, side } = data;
    const successLog = {
        symbol,
        orderId,
        transactTime: new Date(transactTime).toISOString(), // Convert timestamp to ISO format
        price: parseFloat(price).toFixed(8),
        origQty: parseFloat(origQty).toFixed(8),
        status,
        timeInForce,
        type,
        side
    };
    logToFile(`Order successful details: ${JSON.stringify(successLog, null, 2)}`);
}

// Main Execution Function
async function executeLimitBuyOrdersWithList(coinList, usdtAmount, discountPercentage) {
    const filteredCoinList = coinList.filter(coin => !unwantedList.includes(coin));
    for (const coin of filteredCoinList) {
        let coinPair = coin + quoteCoin;
        let currentPrice = await getCurrentPrice(coinPair);
        
        if (!currentPrice) {
            console.log(`Could not fetch current price for ${coin} with ${quoteCoin}, retrying with ${fallbackQuoteCoin}.`);
            coinPair = coin + fallbackQuoteCoin;
            currentPrice = await getCurrentPrice(coinPair);
            
            if (!currentPrice) {
                console.log(`Could not fetch current price for ${coin} with ${fallbackQuoteCoin}, skipping.`);
                continue;
            }
        }

        const limitPrice = currentPrice * (1 - discountPercentage / 100);
        let success = await makeLimitBuyOrder(coinPair, usdtAmount, limitPrice);
        
        if (!success && coinPair.endsWith(quoteCoin)) {
            console.log(`Order failed for ${coinPair}, retrying with fallback quote coin.`);
            coinPair = coin + fallbackQuoteCoin;
            currentPrice = await getCurrentPrice(coinPair);
            
            if (!currentPrice) {
                console.log(`Could not fetch current price for ${coin} with ${fallbackQuoteCoin}, skipping.`);
                continue;
            }

            const limitPrice = currentPrice * (1 - discountPercentage / 100);
            success = await makeLimitBuyOrder(coinPair, usdtAmount, limitPrice);
        }
    }
}



async function main() {

    await executeLimitBuyOrdersWithList(tierD, 250, 10)
        .then(() => console.log('Tier D limit orders executed.'))
        .catch((error) => console.error('Error executing Tier D orders:', error));

    await executeLimitBuyOrdersWithList(memeList, 250, 8)
        .then(() => console.log('Meme list limit orders executed.'))
        .catch((error) => console.error('Error executing Meme list orders:', error));

    await executeLimitBuyOrdersWithList(tierC, 300, 8)
        .then(() => console.log('Tier C limit orders executed.'))
        .catch((error) => console.error('Error executing Tier C orders:', error));

    await executeLimitBuyOrdersWithList(tierB, 300, 7)
        .then(() => console.log('Tier B limit orders executed.'))
        .catch((error) => console.error('Error executing Tier B orders:', error));

    await executeLimitBuyOrdersWithList(['BNB', 'SOL'], 500, 5)
        .then(() => console.log('Tier A limit orders executed.'))
        .catch((error) => console.error('Error executing Tier A orders:', error));

    await executeLimitBuyOrdersWithList(['ETH'], 500, 3)
        .then(() => console.log('Tier A limit orders executed.'))
        .catch((error) => console.error('Error executing Tier A orders:', error));

    await executeLimitBuyOrdersWithList(['BTC'], 500, 3)
        .then(() => console.log('Tier A limit orders executed.'))
        .catch((error) => console.error('Error executing Tier A orders:', error));


}

main();
