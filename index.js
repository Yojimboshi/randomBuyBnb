require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { conservativeCoins, midRiskCoins, highRiskCoins } = require('./coinConfig');

const API_KEY = process.env.API;
const SECRET_KEY = process.env.SECRET;

const binanceBaseUrl = 'https://api.binance.com';

// Function to create a query string with a signature
function getSignedQuery(data) {
  const queryString = Object.keys(data).map(key => `${key}=${data[key]}`).join('&');
  return `${queryString}&signature=${crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex')}`;
}

// Function to make a buy order
async function makeBuyOrder(symbol, quantity) {
  const data = {
    symbol,
    side: 'BUY',
    type: 'MARKET',
    quantity,
    timestamp: Date.now()
  };
  const signedQuery = getSignedQuery(data);

  try {
    const response = await axios.post(`${binanceBaseUrl}/api/v3/order?${signedQuery}`, {}, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    console.log('Order successful:', response.data);
  } catch (error) {
    console.error('Order failed:', error.response.data);
  }
}

// Main function to distribute and execute buy orders
async function executeBuyOrders(totalAmount) {
  // Randomly select a coin list
  const coinLists = [conservativeCoins, midRiskCoins, highRiskCoins];
  const selectedCoins = coinLists[Math.floor(Math.random() * coinLists.length)];

  // Assuming equal distribution for simplicity, calculate amount per coin
  const amountPerCoin = totalAmount / selectedCoins.length;

  console.log(`Buying ${amountPerCoin} worth of each coin: ${selectedCoins.join(', ')}`);

  // Execute buy orders for each selected coin
  for (let coin of selectedCoins) {
    // Placeholder for actual quantity calculation, assuming '1' for demonstration
    await makeBuyOrder(coin + 'USDT', 1); // Assuming USDT pair for all coins
  }
}

// Example usage
executeBuyOrders(1000).then(() => console.log('All orders executed.'));
