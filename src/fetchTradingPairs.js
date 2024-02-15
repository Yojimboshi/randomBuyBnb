// fetchTradingPairs.js
require('dotenv').config();
const axios = require('axios');
const { coinListA, coinListB, coinListC, coinListD, coinListE, coinListF ,
  stablecoins, wrappedTokens} = require('./utils/coinConfig');
const binanceBaseUrl = 'https://api.binance.com';


function isStableCoinOrWrapped(coin) {
  return stablecoins.includes(coin) || wrappedTokens.some(pattern => coin.includes(pattern));
}

// Function to fetch available trading pairs from Binance
async function fetchAvailableTradingPairs() {
  try {
    const response = await axios.get(`${binanceBaseUrl}/api/v3/exchangeInfo`);
    const symbols = response.data.symbols
      .filter(symbol => symbol.status === 'TRADING' && symbol.isSpotTradingAllowed)
      .map(symbol => symbol.baseAsset); // Getting the base asset of each symbol
    return symbols;
  } catch (error) {
    console.error('Failed to fetch trading pairs:', error.message);
    return [];
  }
}

// Function to filter coin lists based on availability on Binance Spot
async function filterCoinsByAvailability(coinLists) {
  const availableTradingPairs = await fetchAvailableTradingPairs();
  return coinLists.map(coinList => coinList.filter(
    coin => availableTradingPairs.includes(coin) &&
      !isStableCoinOrWrapped(coin)));
}

// Exporting functions for external use
module.exports = {
  fetchAvailableTradingPairs,
  filterCoinsByAvailability
};

// This part can be used for testing purposes
// Comment out or remove in production
async function testFilterFunction() {
  // Mock coin lists for testing
  const allCoinLists = [coinListA, coinListB, coinListC, coinListD];

  // Mock structure of coinConfig object for testing
  const filteredCoinLists = await filterCoinsByAvailability(allCoinLists);

  filteredCoinLists.forEach((list, index) => {
    console.log(`Filtered Coin List ${String.fromCharCode(65 + index)}:`, list);
  });
}

// Uncomment the following line to run the test function during development
testFilterFunction();