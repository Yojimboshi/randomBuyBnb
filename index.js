// index.js
// Imports and Configurations
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { coinListA, coinListB, coinListC, coinListD ,coinListE,coinListF} = require('./coinConfig');
const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;
const binanceBaseUrl = 'https://api.binance.com';
const logFilePath = './log/orders.log';

// Utility Functions
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

function roundUpToNearestTen(num) {
  return Math.ceil(num / 10) * 10;
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
async function executeBuyOrders(totalAmount) {
  const combinedCoins = [...coinListC, ...coinListD, ...coinListE];
  let remainingAmount = totalAmount;
  let allocations = [];

  while (combinedCoins.length > 0 && remainingAmount >= 10) {
    const coinIndex = Math.floor(Math.random() * combinedCoins.length);
    const coin = combinedCoins[coinIndex];
    let amountForCoin = roundUpToNearestTen(Math.random() * remainingAmount);

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

// Example usage
executeBuyOrders(100).then(() => console.log('All orders executed.'));
