// automatedBuyOrders.js
// Imports and Configurations
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { coinListA, coinListB, coinListC, coinListD, coinListE, coinListF } = require('../utils/coinConfig');
const { tierA, tierB, tierC, memeList } = require('../utils/myCoinList');
const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;
const binanceBaseUrl = 'https://api.binance.com';
const logFilePath = '../log/buyOrders.log';

// Utility Functions
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

function roundUpToNearestFifty(num) {
  return Math.ceil(num / 50) * 50;
}

// Binance API Interaction Functions
async function makeBuyOrder(symbol, usdtAmount) {
  const timestamp = Date.now();
  const data = { symbol, side: 'BUY', type: 'MARKET', quoteOrderQty: usdtAmount.toString(), timestamp };
  const queryString = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
  const signedQueryString = `${queryString}&signature=${signature}`;

  console.log('Sending order with data:', data);
  try {
    const response = await axios.post(`${binanceBaseUrl}/api/v3/order?${signedQueryString}`, {}, {
      headers: { 'X-MBX-APIKEY': API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('Order successful:', response.data);
    logSuccessDetails(response.data); // Handle success logging in a separate function
  } catch (error) {
    console.error('Order failed:', error.response && error.response.data ? error.response.data : error.message);
    logToFile(`Order failed: Attempted to buy with ${usdtAmount} USDT on ${symbol} - ${error.message}`);
  }
}

function logSuccessDetails(data) {
  const { symbol, executedQty, cummulativeQuoteQty, fills } = data;
  const avgPrice = fills.reduce((acc, fill) => acc + (parseFloat(fill.price) * parseFloat(fill.qty)), 0) / parseFloat(executedQty);
  const successLog = {
    symbol,
    avgPrice: avgPrice.toFixed(8),
    filledAmount: parseFloat(executedQty).toFixed(8),
    totalUsdt: parseFloat(cummulativeQuoteQty).toFixed(8)
  };
  logToFile(`Order successful details: ${JSON.stringify(successLog, null, 2)}`);
}

// Main Execution Function
async function executeBuyOrdersWithList(coinLists, totalAmount) {
  const combinedCoins = [].concat(...coinLists); // Combine the provided coin lists
  let remainingAmount = totalAmount;
  let allocations = [];

  while (combinedCoins.length > 0 && remainingAmount >= 10) {
    const coinIndex = Math.floor(Math.random() * combinedCoins.length);
    const coin = combinedCoins[coinIndex];
    let amountForCoin = roundUpToNearestFifty(Math.random() * remainingAmount);

    if (amountForCoin > remainingAmount || combinedCoins.length === 1) {
      amountForCoin = remainingAmount;
    }

    allocations.push({ coin, amountForCoin });
    remainingAmount -= amountForCoin;
    combinedCoins.splice(coinIndex, 1);
  }

  allocations.forEach(a => logToFile(`Allocated ${a.amountForCoin} USDT to ${a.coin}`));
  for (let { coin, amountForCoin } of allocations) {
    await makeBuyOrder(coin + 'USDT', amountForCoin);
  }
}

async function mainRandom() {
  await executeBuyOrdersWithList([coinListA], 500).then(() => console.log('Orders for A executed.'));
  await executeBuyOrdersWithList([coinListB], 400).then(() => console.log('Orders for B executed.'));
  await executeBuyOrdersWithList([coinListC], 300).then(() => console.log('Orders for C executed.'));
  await executeBuyOrdersWithList([coinListD], 200).then(() => console.log('Orders for D executed.'));
}

// async function mainTier() {
//   // await executeBuyOrdersWithList([tierA, tierB], 300).then(() => console.log('Orders for tier A and B executed.'));
//   await executeBuyOrdersWithList([tierC, memeList], 150).then(() => console.log('Orders for tier C and memeList executed.'));
// }

mainRandom();