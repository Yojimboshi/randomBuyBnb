// src\automatedSellOrders.js
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { coinListA, coinListB, coinListC, coinListD, coinListE, coinListF } = require('./utils/coinConfig');
const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;
const binanceBaseUrl = 'https://api.binance.com';
const logFilePath = '../log/sellOrders.log';

const excludeSymbols = ['ALT', 'SOLO', 'JEX', 'NFT', 'USDT'];

// Utility Functions
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

function roundUpToNearestFifty(num) {
    return Math.ceil(num / 50) * 50;
}


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
            parseFloat(balance.free) > 0 &&
            !balance.asset.startsWith('LD') &&
            !excludeSymbols.includes(balance.asset)
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

async function makeSellOrder(symbol, quoteOrderQty) {
    const timestamp = Date.now();
    const adjustedQuoteOrderQty = Number(quoteOrderQty).toFixed(2);
    const data = {
        symbol: symbol,
        side: 'SELL',
        type: 'MARKET',
        quoteOrderQty: adjustedQuoteOrderQty.toString(),
        timestamp: timestamp.toString(),
    };

    const queryString = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
    const signedQueryString = `${queryString}&signature=${signature}`;
    const url = `${binanceBaseUrl}/api/v3/order`;

    try {
        const response = await axios.post(url + '?' + signedQueryString, {}, {
            headers: { 'X-MBX-APIKEY': API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Optionally log the successful sell order details to a file
        logToFile(`Sell order executed for ${symbol}: QuoteOrderQty ${adjustedQuoteOrderQty} - Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
        console.error(`Sell order failed for ${symbol}:`, error.response ? error.response.data : error);
        // Optionally log the failed sell order attempt to a file
        logToFile(`Sell order failed for ${symbol}: QuoteOrderQty ${adjustedQuoteOrderQty} - Error: ${error.message}`);
    }
}


async function executeSellOrdersWithList(coinLists, totalSellValue) {
    const sellableAssets = await fetchSpotWalletBalancesAndValues(coinLists);

    let remainingSellValue = totalSellValue;
    const sellOrders = [];

    while (remainingSellValue > 0 && sellableAssets.length > 0) {
        const assetIndex = Math.floor(Math.random() * sellableAssets.length);
        const asset = sellableAssets[assetIndex];

        let sellValue;

        // If asset's usdValue is less than $10, sell it all
        if (asset.usdValue < 50) {
            sellValue = asset.usdValue; // Sell the entire asset
        }
        else {
            const maxSellValueForAsset = Math.min(asset.usdValue, remainingSellValue);
            // Calculate a random sell value, then round up to nearest fifty
            let randomSellValue = Math.random() * maxSellValueForAsset;
            sellValue = roundUpToNearestFifty(randomSellValue);

            // Ensure sellValue does not exceed remainingSellValue
            if (sellValue > remainingSellValue) {
                sellValue = roundUpToNearestFifty(remainingSellValue);
            }
        }

        sellOrders.push({
            symbol: `${asset.asset}USDT`,
            quoteOrderQty: sellValue.toFixed(2)
        });

        remainingSellValue -= sellValue;
        sellableAssets.splice(assetIndex, 1);

        console.log(`Remaining Sell Value after selling ${asset.asset}: $${remainingSellValue.toFixed(2)}`);
    }

    // Execute sell orders
    for (const order of sellOrders) {
        await makeSellOrder(order.symbol, order.quoteOrderQty);
    }
}


async function main() {
    // Example call, adjust as needed
    // await executeSellOrdersWithList([coinListA, coinListB], 100).then(() => console.log('Sell orders for lists A and B executed.'));
    await executeSellOrdersWithList([coinListC, coinListD], 300).then(() => console.log('Sell orders for lists C and D executed.'));
    await executeSellOrdersWithList([coinListE, coinListF], 300).then(() => console.log('Sell orders for lists E and F executed.'));
}

main();
