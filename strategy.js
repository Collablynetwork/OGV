import axios from 'axios';
import moment from 'moment';
import { sendTelegramMessage, editTelegramMessage } from './telegram.js';
import fs from 'fs';

// Define log file paths
const RSI_LOG_FILE = './rsi_data.csv';
const BUY_SIGNAL_LOG_FILE = './buy_signals.csv';

// Global constants
const RSI_PERIOD = 14;
const RSI_THRESHOLD_15m = 25;
const RSI_THRESHOLD_5m = 15;
const RSI_THRESHOLD_1m = 25;

// Global trackers
const lastNotificationTimes = {};
const sellPrices = {};
const bottomPrices = {};
const entryPrices = {}; // Tracks multiple entry prices for each symbol
let lastBTCPrice = null;
const btcPriceHistory = [];

// Initialize log files
const initializeLogFiles = () => {
  if (!fs.existsSync(RSI_LOG_FILE)) {
    fs.writeFileSync(RSI_LOG_FILE, 'Timestamp,Symbol,RSI_15m,RSI_5m,RSI_1m,Bullish Volume,Bearish Volume,Current Price\n');
  }
  if (!fs.existsSync(BUY_SIGNAL_LOG_FILE)) {
    fs.writeFileSync(
      BUY_SIGNAL_LOG_FILE,
      'Timestamp,Symbol,RSI_15m,RSI_5m,RSI_1m,Buy Price,Sell Price,Duration,Bottom Price,Percentage Drop,BTC Change,BTC 30m Change\n'
    );
  }
};
initializeLogFiles();

// Function to calculate RSI
const calculateRSI = (prices, period = RSI_PERIOD) => {
  if (prices.length < period) return null;

  let gains = 0,
    losses = 0;
  for (let i = 1; i < period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

// Fetch candlestick data
const fetchCandlestickData = async (symbol, interval) => {
  try {
    const url = `https://api.binance.com/api/v3/klines`;
    const params = {
      symbol,
      interval,
      limit: RSI_PERIOD + 1,
    };

    const response = await axios.get(url, { params });

    if (!response.data || response.data.length === 0) {
      console.error(`No data returned for ${symbol} on interval ${interval}`);
      return null;  // Handle empty data gracefully
    }

    return response.data.map((candle) => {
      return {
        open: parseFloat(candle[1]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
        timestamp: candle[0],
      };
    });

  } catch (error) {
    console.error(`Error fetching data for ${symbol} on interval ${interval}:`, error.message);
    return null;  // Return null if request fails
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchDataWithDelay = async (symbols, interval) => {
  for (const symbol of symbols) {
    await fetchCandlestickDataWithRetry(symbol, interval);
    await delay(10000);  // Delay of 10000ms between each request
  }
};


// Fetch and calculate RSI for a specific interval
const fetchAndCalculateRSI = async (symbol, interval) => {
  const candles = await fetchCandlestickData(symbol, interval);
  const prices = candles.map((candle) => candle.close);
  return calculateRSI(prices);
};

// Fetch 15-minute RSI
const fetch15mRSI = async (symbol) => fetchAndCalculateRSI(symbol, '15m');

// Fetch current BTC price and maintain history
const fetchBTCPrice = async () => {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol: 'BTCUSDT' },
    });
    const price = parseFloat(response.data.price);

    // Add price to history with timestamp
    btcPriceHistory.push({
      price,
      timestamp: moment(),
    });

    // Keep only last 31 minutes of history (extra minute for safety)
    const thirtyOneMinutesAgo = moment().subtract(31, 'minutes');
    while (btcPriceHistory.length > 0 && btcPriceHistory[0].timestamp.isBefore(thirtyOneMinutesAgo)) {
      btcPriceHistory.shift();
    }

    return price;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return null;
  }
};

// Calculate BTC price changes
const calculateBTCChanges = async () => {
  const currentBTCPrice = await fetchBTCPrice();
  if (!currentBTCPrice) return { price: null, change: null, change30m: null };

  // Calculate immediate change
  let priceChange = null;
  if (lastBTCPrice) {
    priceChange = ((currentBTCPrice - lastBTCPrice) / lastBTCPrice * 100).toFixed(2);
  }

  // Calculate 30-minute change
  let priceChange30m = null;
  if (btcPriceHistory.length > 0) {
    const thirtyMinutesAgo = moment().subtract(30, 'minutes');
    const oldPrice = btcPriceHistory.find((entry) => entry.timestamp.isSameOrBefore(thirtyMinutesAgo));
    if (oldPrice) {
      priceChange30m = ((currentBTCPrice - oldPrice.price) / oldPrice.price * 100).toFixed(2);
    }
  }

  lastBTCPrice = currentBTCPrice;
  return {
    price: currentBTCPrice,
    change: priceChange,
    change30m: priceChange30m,
  };
};

// Log RSI and price data
const logRSIAndPrice = (symbol, rsi15m, rsi5m, rsi1m, currentPrice, bullishVolume, bearishVolume) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logData = `${timestamp},${symbol},${rsi15m},${rsi5m},${rsi1m},${bullishVolume},${bearishVolume},${currentPrice}\n`;

  fs.appendFile(RSI_LOG_FILE, logData, (err) => {
    if (err) console.error('Error writing to RSI log file:', err);
    else console.log(`Logged RSI and price for ${symbol}`);
  });
};

// Log buy signals
const logBuySignal = (symbol, rsi15m, rsi5m, rsi1m, buyPrice, sellPrice, duration, bottomPrice, percentageDrop, btcChange, btcChange30m) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logData = `${timestamp},${symbol},${rsi15m},${rsi5m},${rsi1m},${buyPrice},${sellPrice},${duration},${bottomPrice},${percentageDrop},${btcChange},${btcChange30m}\n`;

  fs.appendFile(BUY_SIGNAL_LOG_FILE, logData, (err) => {
    if (err) console.error('Error writing to buy_signals.csv:', err);
    else console.log(`Logged Buy Signal for ${symbol}`);
  });
};

// Volume Check for Bullish Market
const checkBullishMarketVolume = async (symbol) => {
  const candles = await fetchCandlestickData(symbol, '15m');
  if (!candles || candles.length < 14) return { bullishVolume: 0, bearishVolume: 0 };

  let bullishVolume = 0;
  let bearishVolume = 0;

  // Iterate over the last 14 candles
  for (let i = 1; i <= 14; i++) {
    const candle = candles[candles.length - i];  // Current candle
    const prevCandle = candles[candles.length - i - 1];  // Previous candle

    const volume = candle.volume; // Volume is the 6th element in the candlestick data

    // If the closing price is higher than the opening price, it's a Bullish candle
    if (candle.close > candle.open) { // Close price (candle[4]) > Open price (candle[1])
      bullishVolume += volume; // Add the volume of the bullish candle
    } 
    // If the closing price is lower than the opening price, it's a Bearish candle
    else if (candle.close < candle.open) { // Close price (candle[4]) < Open price (candle[1])
      bearishVolume += volume; // Add the volume of the bearish candle
    }
  }

  return { bullishVolume, bearishVolume };
};

// Handle RSI logic with multiple entry points
// Handle RSI logic with volume exception notification
export const handleRSI = async (symbol, token, chatIds) => {
  const rsi15m = await fetch15mRSI(symbol);
  const prices5m = await fetchCandlestickData(symbol, '5m');
  const prices1m = await fetchCandlestickData(symbol, '1m');
  const btcData = await calculateBTCChanges();
  const { bullishVolume, bearishVolume } = await checkBullishMarketVolume(symbol);

  if (!prices5m || !prices1m || rsi15m === null) return;

  const rsi5m = calculateRSI(prices5m.map((candle) => candle.close));
  const rsi1m = calculateRSI(prices1m.map((candle) => candle.close));
  const currentPrice = prices1m[prices1m.length - 1].close;

  console.log(`RSI for ${symbol}: 15m = ${rsi15m}, 5m = ${rsi5m}, 1m = ${rsi1m}, Bullish Volume = ${bullishVolume}, Bearish Volume = ${bearishVolume}, Price = ${currentPrice}`);

  // Log RSI and price data with volume information
  logRSIAndPrice(symbol, rsi15m, rsi5m, rsi1m, currentPrice, bullishVolume, bearishVolume);

  // Check for an existing signal
  const existingSignal = sellPrices[symbol];
  if (existingSignal) {
    const { sellPrice, entryPrice, messageId, buyTime } = existingSignal;

    // If current price is below the sell price and the sell target isn't met, update with the previous sell price
    if (currentPrice < sellPrice) {
      const updatedMessage = `
📢 **Buy Signal**
💎 Token: #${symbol}
💰 Entry Price: ${entryPrice}
💰 Sell Price: ${sellPrice}
🕒 Timeframes: 1m
💹 Trade Now on: [Binance](https://www.binance.com/en/trade/${symbol})
`;

      for (const chatId of chatIds) {
        await editTelegramMessage(token, chatId, messageId, updatedMessage);
      }
      return;  // Exit early, as we've updated the existing signal
    }
  }

  // Check if RSI conditions meet
  if (rsi15m < RSI_THRESHOLD_15m && rsi5m > RSI_THRESHOLD_5m && rsi1m > RSI_THRESHOLD_1m) {
    const currentTime = moment();
    const lastNotificationTime = lastNotificationTimes[symbol];

    if (lastNotificationTime && currentTime.diff(lastNotificationTime, 'minutes') < 30) return;

    lastNotificationTimes[symbol] = currentTime;

    // Ensure entryPrice is tracked for the first signal
    let entryPrice = currentPrice;
    if (!sellPrices[symbol]) {
      entryPrices[symbol] = entryPrice;
    } else {
      entryPrice = sellPrices[symbol].entryPrice;  // Use the previous entry price if it exists
    }

    // If volume pressure is bearish, wait for bullish volume to exceed bearish volume
    if (bullishVolume <= bearishVolume) {
      console.log(`Waiting for bullish volume to exceed bearish volume for ${symbol}`);
      return;
    }

    // Volume Change Exception Detection
    const volumeChangeRatio = bullishVolume / bearishVolume;
    const previousVolumeRatio = entryPrices[symbol] ? entryPrices[symbol].previousVolumeRatio : 0;

    if (previousVolumeRatio && volumeChangeRatio >= previousVolumeRatio * 3) {
      const exceptionalVolumeMessage = `
🚨 **Exceptional Volume Change Alert**
💎 Token: #${symbol}
📈 Volume Change: ${volumeChangeRatio.toFixed(2)}x (Bullish Volume / Bearish Volume)
🔔 We've observed a significant volume increase compared to the initial buying pressure.
💹 Trade Now on: [Binance](https://www.binance.com/en/trade/${symbol})
`;
      for (const chatId of chatIds) {
        await sendTelegramMessage(token, chatId, exceptionalVolumeMessage);
      }
    }

    // Store the volume ratio for future comparison
    if (!entryPrices[symbol]) entryPrices[symbol] = {};
    entryPrices[symbol].previousVolumeRatio = volumeChangeRatio;

    // Once conditions meet, place the buy signal
    const sellPrice = (entryPrice * 1.011).toFixed(8);  // Set sell price at 1.1% of entry price
    const message = `
📢 **Buy Signal**
💎 Token: #${symbol}
💰 Entry Price: ${entryPrice}
💰 Sell Price: ${sellPrice}
🕒 Timeframes: 1m
💹 Trade Now on: [Binance](https://www.binance.com/en/trade/${symbol})
`;

    const messageIds = [];
    for (const chatId of chatIds) {
      const messageId = await sendTelegramMessage(token, chatId, message);
      messageIds.push(messageId);
    }

    sellPrices[symbol] = {
      entryPrice,
      sellPrice,
      messageId: messageIds[0],
      buyTime: currentTime,
      btcPriceAtBuy: btcData.price,
    };
    bottomPrices[symbol] = currentPrice;
  }
};

// Check if sell target is achieved
export const checkTargetAchieved = async (token, chatIds) => {
  for (const symbol in sellPrices) {
    const { sellPrice, entryPrices, messageId, buyTime } = sellPrices[symbol];
    const prices = await fetchCandlestickData(symbol, '1m');
    const btcData = await calculateBTCChanges();

    if (!prices) continue;

    const currentPrice = prices[prices.length - 1].close;

    if (currentPrice < bottomPrices[symbol]) {
      bottomPrices[symbol] = currentPrice;
    }

    if (currentPrice >= sellPrice) {
      const duration = moment.duration(moment().diff(buyTime));
      const period = `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;

      const bottomPrice = bottomPrices[symbol];
      const percentageDrop = (((entryPrices[0] - bottomPrice) / entryPrices[0]) * 100).toFixed(2);

      const btcChange = btcData.price
        ? ((btcData.price - sellPrices[symbol].btcPriceAtBuy) / sellPrices[symbol].btcPriceAtBuy * 100).toFixed(2)
        : null;

      const newMessage = `
📢 **Buy Signal**
💎 Token: #${symbol}
💰 Entry Prices: ${entryPrices.join('-')}
💰 Sell Price: ${sellPrice}
📉 Bottom Price: ${bottomPrice}
📉 Percentage Drop: ${percentageDrop}%
✅ Target Achieved
⏱️ Duration: ${period}
💹 Trade Now on: [Binance](https://www.binance.com/en/trade/${symbol})
`;

      for (const chatId of chatIds) {
        await editTelegramMessage(token, chatId, messageId, newMessage);
      }

      logBuySignal(
        symbol,
        RSI_THRESHOLD_15m,
        RSI_THRESHOLD_5m,
        RSI_THRESHOLD_1m,
        entryPrices[0],
        sellPrice,
        period,
        bottomPrice,
        percentageDrop,
        btcChange,
        btcData.change30m
      );

      delete sellPrices[symbol];
      delete bottomPrices[symbol];
      delete entryPrices[symbol];
    }
  }
};
