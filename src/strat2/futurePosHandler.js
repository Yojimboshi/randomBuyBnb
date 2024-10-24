require('dotenv').config({ path: '../.env' });
const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');

const OrderType = {
    LIMIT: 'LIMIT',
    MARKET: 'MARKET',
    STOP: 'STOP',
    STOP_MARKET: 'STOP_MARKET',
    TAKE_PROFIT: 'TAKE_PROFIT',
    TAKE_PROFIT_MARKET: 'TAKE_PROFIT_MARKET',
    TRAILING_STOP_MARKET: 'TRAILING_STOP_MARKET'
};

const pair = 'BTCUSDT'; 
const markPrice = 65000; 
const loop = 5; 
const percentage = 5; 
const amount = 1000; 
const BINANCE_FUTURES_API_URL = 'https://fapi.binance.com';
const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;

let buyCount = 0;
let basePrice = null;

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

async function trackPriceAndBuy(pair) {
    const BINANCE_TRADE_WS_URL = `wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@trade`;
    const ws = new WebSocket(BINANCE_TRADE_WS_URL);

    ws.on('open', () => {
        console.log(`Connected to WebSocket for ${pair} trade tracking...`);
    });

    ws.on('message', async (data) => {
        const message = JSON.parse(data);
        if (message && message.p) { 
            const currentPrice = parseFloat(message.p).toFixed(2);
            console.log(`Current trade price for ${pair}: ${currentPrice}`);

            if (buyCount === 0 && currentPrice <= markPrice) {
                console.log(`Mark price hit. Entering first buy at ${currentPrice}`);
                await enterBuyPosition(currentPrice);
                basePrice = currentPrice;
            }

            if (buyCount > 0 && buyCount < loop) {
                const targetPrice = basePrice * (1 - (percentage / 100) * buyCount);
                if (currentPrice <= targetPrice) {
                    console.log(`Price dropped by ${percentage * buyCount}%. Entering buy at ${currentPrice}`);
                    await enterBuyPosition(currentPrice);
                }
            }

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

// Function to execute a futures order with adjustments for tick size and lot size
async function executeFuturesOrder(symbol, side, price, usdtAmount, orderType = OrderType.MARKET) {
    const endpoint = '/fapi/v1/order';
    const timestamp = Date.now();
    
    let data = {
        symbol,
        side,
        type: orderType,
        timestamp
    };

    if (orderType === OrderType.MARKET) {
        // For market orders, use 'quoteOrderQty' (USDT amount)
        data.quoteOrderQty = usdtAmount.toString();
    } else {
        // For limit orders, calculate quantity and adjust price
        const symbolInfo = await getSymbolInfo(symbol);
        const tickSize = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize;
        const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE').stepSize;

        const adjustedPrice = adjustPriceToTickSize(price, tickSize);
        const adjustedQuantity = adjustQuantityToLotSize(usdtAmount / adjustedPrice, lotSize);

        data.price = adjustedPrice;
        data.quantity = adjustedQuantity;
        data.timeInForce = 'GTC'; // Good till canceled
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
        console.error(`Error placing ${orderType} order: ${error.response ? error.response.data : error.message}`);
    }
}


async function enterBuyPosition(price) {
    buyCount++;
    const quantity = (amount / price).toFixed(6); 
    console.log(`Entering buy position ${buyCount} at price ${price} for ${amount} USDT (Quantity: ${quantity}).`);
    await executeFuturesOrder(pair, 'BUY', null, 10, OrderType.MARKET);
    
    await executeFuturesOrder(pair, 'BUY', 65000, 10, OrderType.LIMIT);
}

trackPriceAndBuy(pair);
