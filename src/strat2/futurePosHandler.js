// src\strat2\futurePosHandler.js
require('dotenv').config({ path: '../../.env' });
const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');

const BINANCE_FUTURES_API_URL = 'https://fapi.binance.com';
const apiKey = process.env.API;
const secretKey = process.env.SECRET;


// Utility to adjust price based on tick size
function adjustPriceToTickSize(price, tickSize) {
    const tickSizeDecimals = countDecimals(tickSize);
    const adjustedPrice = Math.round(price / tickSize) * tickSize;
    return adjustedPrice.toFixed(tickSizeDecimals);
}

// Utility to adjust quantity based on lot size
function adjustQuantityToLotSize(quantity, lotSize) {
    const lotSizeDecimals = countDecimals(lotSize);
    const adjustedQuantity = Math.floor(quantity / lotSize) * lotSize;
    return adjustedQuantity.toFixed(lotSizeDecimals);
}

// Utility to count decimals
function countDecimals(value) {
    if (Math.floor(value) === value) return 0;
    return value.toString().split(".")[1]?.length || 0;
}

// Get symbol info from Binance to retrieve tick size and lot size
async function getSymbolInfo(symbol) {
    const response = await axios.get(`${BINANCE_FUTURES_API_URL}/fapi/v1/exchangeInfo?symbol=${symbol}`);
    return response.data.symbols[0];
}


// Function to place a market or limit order
async function placeFuturesOrder(symbol, side, orderType, price = null, usdtAmount) {
    const endpoint = '/fapi/v1/order';
    const timestamp = Date.now();

    let data = {
        symbol,
        side,
        type: orderType,
        timestamp
    };

    if (orderType === 'MARKET') {
        // For futures, calculate the quantity based on USDT amount and price
        const symbolInfo = await getSymbolInfo(symbol);
        const priceData = await getMarketPrice(symbol); // Fetch current price to calculate quantity
        const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE').stepSize;

        const quantity = adjustQuantityToLotSize(usdtAmount / priceData, lotSize);

        data.quantity = quantity;

        console.log(`Placing MARKET order for ${symbol}:`);
        console.log(`Side: ${side}, Amount: ${usdtAmount} USDT, Quantity: ${quantity}, Current Price: ${priceData}`);
    } else if (orderType === 'LIMIT') {
        // Limit order uses price and quantity
        const symbolInfo = await getSymbolInfo(symbol);
        const tickSize = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize;
        const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE').stepSize;

        const adjustedPrice = adjustPriceToTickSize(price, tickSize);
        const adjustedQuantity = adjustQuantityToLotSize(usdtAmount / adjustedPrice, lotSize);

        data.price = adjustedPrice;
        data.quantity = adjustedQuantity;
        data.timeInForce = 'GTC'; // Good-till-canceled

        // Log details about the order
        console.log(`Placing LIMIT order for ${symbol}:`);
        console.log(`Side: ${side}`);
        console.log(`Price: ${price}, Adjusted Price: ${adjustedPrice}`);
        console.log(`USDT Amount: ${usdtAmount}, Adjusted Quantity: ${adjustedQuantity}`);
        console.log(`Tick Size: ${tickSize}, Lot Size: ${lotSize}`);
    }

    const queryString = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
    const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
    const url = `${BINANCE_FUTURES_API_URL}${endpoint}?${queryString}&signature=${signature}`;

    try {
        const response = await axios.post(url, {}, {
            headers: {
                'X-MBX-APIKEY': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(`${orderType} order placed successfully: ${response.data}`);
    } catch (error) {
        // Log the full error response properly
        if (error.response) {
            console.error(`Error placing ${orderType} order:`, error.response.data);
        } else {
            console.error(`Error placing ${orderType} order:`, error.message);
        }
    }
}


let buyCount = 0;
let basePrice = null;
let lastTradePrice = null;
let tradeCountAtSamePrice = 0;


// Function to track price and trigger the appropriate order
async function trackPriceAndBuy(pair, markPrice, loop, amount, percentage) {
    const BINANCE_TRADE_WS_URL = `wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@trade`;
    const ws = new WebSocket(BINANCE_TRADE_WS_URL);

    ws.on('open', () => {
        console.log(`Connected to WebSocket for ${pair} trade tracking...`);
    });

    ws.on('message', async (data) => {
        const message = JSON.parse(data);
        if (message && message.p) {
            const currentPrice = parseFloat(message.p).toFixed(2);

            // Log price only when it changes
            if (currentPrice === lastTradePrice) {
                tradeCountAtSamePrice += 1;
            } else {
                // Log previous price and count
                if (lastTradePrice !== null) {
                    console.log(`Trade price for ${pair}: ${lastTradePrice} (${tradeCountAtSamePrice} times)`);
                }
                lastTradePrice = currentPrice;
                tradeCountAtSamePrice = 1; // Reset count for new price
            }

            // First buy logic
            if (buyCount === 0 && currentPrice <= markPrice) {
                console.log(`Mark price hit. Entering first market buy at ${currentPrice}`);
                await placeFuturesOrder(pair, 'BUY', 'MARKET', null, amount);
                basePrice = currentPrice;
            }

            // Subsequent buys based on depreciation
            if (buyCount > 0 && buyCount < loop) {
                const targetPrice = basePrice * (1 - (percentage / 100) * buyCount);
                if (currentPrice <= targetPrice) {
                    console.log(`Price dropped by ${percentage * buyCount}%. Entering limit buy at ${currentPrice}`);
                    await placeFuturesOrder(pair, 'BUY', 'LIMIT', targetPrice, amount);
                }
            }

            // Complete the loop
            if (buyCount === loop) {
                console.log(`Completed all ${loop} buys.`);
                ws.close();
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed.');
    });
}


// Main function to handle either a single order or price tracking
const main = async ({ pair, option, price, usdtAmount, loop, percentage }) => {
    try {
        switch (option) {
            case 1: // Single order placement
                console.log(`Placing a single LIMIT order for ${pair}...`);
                await placeFuturesOrder(pair, 'BUY', 'LIMIT', price, usdtAmount);
                console.log('Single order placed successfully.');
                break;

            case 2: // Price tracking and multiple orders
                console.log(`Starting price tracking for ${pair}...`);
                trackPriceAndBuy(pair, price, loop, usdtAmount, percentage);
                console.log('Price tracking started...');
                break;

            default:
                console.log('Invalid option selected. Choose 1 for a single order, or 2 for price tracking.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// Parameters for main function
const params = {
    pair: 'UNFIUSDT',  // Trading pair
    option: 2,         // 1 for single order, 2 for price tracking
    price: 1.5,      // Price for the order or tracking
    usdtAmount: 1000,  // Amount in USDT for each order
    loop: 1,           // Number of buys in tracking mode
    percentage: 5      // Price drop percentage for tracking
};

// Invoke the main function with the provided parameters
main(params);
