// src\strat2\spotPriceTracker.js
require('dotenv').config({ path: '../.env' }); // To load environment variables
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Constants
const pairPrice = 'BTCUSDT';
const BINANCE_TICKER_WS_URL = `wss://stream.binance.com:9443/ws/${pairPrice.toLowerCase()}@ticker`;
const BINANCE_TRADE_WS_URL = `wss://stream.binance.com:9443/ws/${pairPrice.toLowerCase()}@trade`;
const logFilePath = path.join(__dirname, '../../log/spotPriceTracker.log');

let lastTradePrice = null;
let tradeCountAtSamePrice = 0;

// Utility function to log messages to a file
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

// Tracks real-time price updates (ticker stream)
function trackTickerPrice() {
    const ws = new WebSocket(BINANCE_TICKER_WS_URL);

    ws.on('open', () => {
        logToFile(`WebSocket connection opened for ${pairPrice} ticker price tracking.`);
        console.log(`Connected to WebSocket for ${pairPrice} ticker price tracking...`);
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message && message.c) { // c is the current price in Binance's ticker stream
            const currentPrice = parseFloat(message.c).toFixed(2);
            logToFile(`Ticker price for ${pairPrice}: ${currentPrice}`);
            console.log(`Ticker price for ${pairPrice}: ${currentPrice}`);
        }
    });

    ws.on('error', (error) => {
        logToFile(`WebSocket error (ticker): ${error.message}`);
        console.error('WebSocket error (ticker):', error.message);
    });

    ws.on('close', () => {
        logToFile(`Ticker WebSocket connection closed. Reconnecting...`);
        console.log('Ticker WebSocket connection closed. Reconnecting...');
        setTimeout(trackTickerPrice, 5000); // Reconnect after 5 seconds
    });
}

// Logs trade price and count when it changes
function logTradePrice(tradePrice, count) {
    const message = `Trade price for ${pairPrice}: ${tradePrice} (${count} times)`;
    logToFile(message);
    console.log(message);
}

// Tracks actual trades (trade stream)
function trackTradePrice() {
    const ws = new WebSocket(BINANCE_TRADE_WS_URL);

    ws.on('open', () => {
        logToFile(`WebSocket connection opened for ${pairPrice} trade price tracking.`);
        console.log(`Connected to WebSocket for ${pairPrice} trade price tracking...`);
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message && message.p) { // p is the price at which a trade happened
            const tradePrice = parseFloat(message.p).toFixed(2);

            if (tradePrice === lastTradePrice) {
                tradeCountAtSamePrice += 1;
            } else {
                if (lastTradePrice !== null) {
                    logTradePrice(lastTradePrice, tradeCountAtSamePrice);
                }
                lastTradePrice = tradePrice;
                tradeCountAtSamePrice = 1; // New price occurred, reset count
            }
        }
    });

    ws.on('error', (error) => {
        logToFile(`WebSocket error (trade): ${error.message}`);
        console.error('WebSocket error (trade):', error.message);
    });

    ws.on('close', () => {
        logToFile(`Trade WebSocket connection closed. Reconnecting...`);
        console.log('Trade WebSocket connection closed. Reconnecting...');
        setTimeout(trackTradePrice, 5000); // Reconnect after 5 seconds
    });
}



/**************************************************************************************
*  EXPLANATION:                                                                        *
*  Use `trackTickerPrice` to track general real-time price updates.                    *
*  Use `trackTradePrice` to track actual trades for algorithmic execution, capturing   *
*  minimal latency during trading events.                                              *
*  NOTE: Beware of Binance API call weight limits. Each WebSocket connection and API   *
*  call may contribute to your usage limits per minute, hour, or day. Monitor usage    *
*  carefully to avoid rate limiting or restrictions imposed by Binance API.            *
**************************************************************************************/


trackTickerPrice();
// trackTradePrice();
