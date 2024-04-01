// src\limitSellOrders.js 
// Imports and Configurations
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { tierA, tierB, tierC, memeList, tierD } = require('./utils/myCoinList');
const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;
const binanceBaseUrl = 'https://api.binance.com';
const logFilePath = '../log/limitSellOrders.log';

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

async function fetchSpotWalletBalances() {
    try {
        const timestamp = Date.now();
        const data = `timestamp=${timestamp}`;
        const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
        const signedQueryString = `${data}&signature=${signature}`;

        console.log(`Attempting to fetch balances with query: ${signedQueryString}`); // Debug log

        const response = await axios.get(`${binanceBaseUrl}/api/v3/account?${signedQueryString}`, {
            headers: { 'X-MBX-APIKEY': API_KEY }
        });

        return response.data.balances;
    } catch (error) {
        console.error("Failed to fetch spot wallet balances:", error.message);
        console.log(`Request failed with status code: ${error.response.status}`); // Additional debug log
        console.log(`Response error details: ${error.response.data.msg}`); // Log detailed API error message
        return [];
    }
}


// Filter Tradable Assets
async function filterTradableAssets(balances, coinLists) {
    const tradableAssets = [];
    // Flatten all coin lists into a single array for easy lookup
    const combinedList = [...tierA, ...tierB, ...tierC, ...memeList];
    for (const balance of balances) {
        const asset = balance.asset;
        const freeBalance = parseFloat(balance.free);
        if (combinedList.includes(asset) && freeBalance > 0) {
            tradableAssets.push({ asset, freeBalance });
        }
    }
    return tradableAssets;
}


// Binance API Interaction Functions
async function makeLimitSellOrder(symbol, quantity, limitPrice) {
    const symbolInfo = await getSymbolInfo(symbol);
    if (!symbolInfo) {
        console.error(`Could not fetch symbol info for ${symbol}`);
        return;
    }

    const tickSize = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize;
    const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE').stepSize;
    const adjustedLimitPrice = adjustPriceToTickSize(limitPrice, tickSize);
    const adjustedQuantity = adjustQuantityToLotSize(quantity, lotSize);

    const timestamp = Date.now();
    const data = {
        symbol,
        side: 'SELL',
        type: 'LIMIT',
        quantity: adjustedQuantity,
        price: adjustedLimitPrice,
        timeInForce: 'GTC',
        timestamp
    };

    const queryString = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
    const signedQueryString = `${queryString}&signature=${signature}`;

    console.log('Sending sell order with data:', data);
    try {
        const response = await axios.post(`${binanceBaseUrl}/api/v3/order?${signedQueryString}`, {}, {
            headers: { 'X-MBX-APIKEY': API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log('Sell order successful:', response.data);
        logSuccessDetails(response.data);
    } catch (error) {
        console.error('Sell order failed:', error.response && error.response.data ? error.response.data : error.message);
        logToFile(`Sell order failed: Attempted to sell ${quantity} of ${symbol} - ${error.message}`);
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
async function executeLimitSellOrdersWithList(coinList, usdtAmount, premiumPercentage) {
    const balances = await fetchSpotWalletBalances();
    const tradableAssets = balances.filter(balance => coinList.includes(balance.asset) && parseFloat(balance.free) > 0);

    for (const { asset, free } of tradableAssets) {
        const symbol = `${asset}USDT`;
        const currentPrice = await getCurrentPrice(symbol);
        if (!currentPrice) {
            console.log(`Could not fetch current price for ${symbol}, skipping.`);
            continue;
        }

        const freeBalance = parseFloat(free);
        const assetValueInUSDT = freeBalance * currentPrice;

        // Determine the quantity to sell: either the full balance or the specified USDT amount
        let sellQuantity = assetValueInUSDT < usdtAmount ? freeBalance : usdtAmount / currentPrice;

        // Determine the target sell price based on the current price and premium percentage
        const premiumMultiplier = (100 + premiumPercentage) / 100;
        const targetSellPrice = currentPrice * premiumMultiplier;

        // Fetch symbol info for tick size and lot size
        const symbolInfo = await getSymbolInfo(symbol);
        if (!symbolInfo) {
            console.error(`Could not fetch symbol info for ${symbol}`);
            continue;
        }

        const tickSize = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize;
        const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE').stepSize;
        const adjustedSellPrice = adjustPriceToTickSize(targetSellPrice, tickSize);
        sellQuantity = adjustQuantityToLotSize(sellQuantity, lotSize);

        // Place the limit sell order
        await makeLimitSellOrder(symbol, sellQuantity, adjustedSellPrice);
    }
}

async function mainSell() {
    // Optionally, handle memeList or any other lists
    await executeLimitSellOrdersWithList(tierA, 400, 3)
        .then(() => console.log('tierA list limit sell orders executed.'))
        .catch((error) => console.error('Error executing tierA list sell orders:', error));

    await executeLimitSellOrdersWithList(tierB, 300, 3)
        .then(() => console.log('tierB list limit sell orders executed.'))
        .catch((error) => console.error('Error executing tierB list sell orders:', error));

    await executeLimitSellOrdersWithList(tierC, 300, 3)
        .then(() => console.log('tierC list limit sell orders executed.'))
        .catch((error) => console.error('Error executing tierC list sell orders:', error));

    await executeLimitSellOrdersWithList(tierD, 250, 4)
        .then(() => console.log('tierD list limit sell orders executed.'))
        .catch((error) => console.error('Error executing tierD list sell orders:', error));

    await executeLimitSellOrdersWithList(memeList, 250, 5)
        .then(() => console.log('Meme list limit sell orders executed.'))
        .catch((error) => console.error('Error executing meme list sell orders:', error));
}

mainSell();
