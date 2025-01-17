import axios from 'axios';

// Define the pairs to be tracked
export const trackedPairs = [
  "BIOUSDT", "SUSHIUSDT", "ENAUSDT", "CETUSUSDT", "DOGEUSDT", "EOSUSDT", "ICPUSDT", "BONKUSDT", "NEIROUSDT", "TURBOUSDT", 
  "ADAUSDT", "XVSUSDT", "ONEUSDT", "AGLDUSDT", "NEOUSDT", "SUIUSDT", "GALAUSDT", "KAVAUSDT", "MANAUSDT", "ATOMUSDT", "FLOKIUSDT", 
  "UMAUSDT", "SANDUSDT", "1000CATUSDT", "1MBABYDOGEUSDT", "GRTUSDT", "BANANAUSDT", "WOOUSDT", "RSRUSDT", "SCRUSDT", "ETHFIUSDT", 
  "ENJUSDT", "SKLUSDT", "NTRNUSDT", "VETUSDT", "ZILUSDT", "COMPUSDT", "LTCUSDT", "DYDXUSDT", "MANTAUSDT", "APEUSDT", "SHIBUSDT", 
  "REZUSDT", "ARUSDT", "HBARUSDT", "QTUMUSDT", "PNUTUSDT", "EIGENUSDT", "MOVEUSDT", "WIFUSDT", "ENSUSDT", "SUPERUSDT", "XNOUSDT", 
  "ARBUSDT", "METISUSDT", "CRVUSDT", "OPUSDT", "ANKRUSDT", "ALTUSDT", "DOTUSDT", "GASUSDT", "POLUSDT", "SAGAUSDT", "BLURUSDT", 
  "KSMUSDT", "TNSRUSDT", "COWUSDT", "ILVUSDT", "DASHUSDT", "PORTALUSDT", "BALUSDT", "ALICEUSDT", "FETUSDT", "IMXUSDT", "IOTXUSDT", 
  "IOSTUSDT", "ARKMUSDT", "MOVRUSDT", "MAVUSDT", "FILUSDT", "ZROUSDT", "EGLDUSDT", "INJUSDT", "SPELLUSDT", "HIGHUSDT", "LISTAUSDT", 
  "LPTUSDT", "AVAUSDT", "FLOWUSDT", "RVNUSDT", "HOTUSDT", "TAOUSDT", "DCRUSDT", "NEARUSDT", "UNIUSDT", "NULSUSDT", "AVAXUSDT", 
  "TIAUSDT", "PEPEUSDT", "FLMUSDT", "ZRXUSDT", "RUNEUSDT", "ONTUSDT", "JASMYUSDT", "LINKUSDT", "FARMUSDT", "TRUUSDT", "QNTUSDT", 
  "YFIUSDT", "FIDAUSDT", "GMXUSDT", "SEIUSDT", "CHESSUSDT", "VANRYUSDT", "NEXOUSDT", "XAIUSDT", "SNTUSDT", "CTSIUSDT", "LINAUSDT", 
  "SNXUSDT", "STRAXUSDT", "GTCUSDT", "CELOUSDT", "MINAUSDT", "LDOUSDT", "MEUSDT", "STGUSDT", "BOMEUSDT", "KNCUSDT", "1INCHUSDT", 
  "DGBUSDT", "BANDUSDT", "REIUSDT", "PENDLEUSDT", "PEOPLEUSDT", "FTMUSDT", "GNSUSDT", "YGGUSDT", "APTUSDT", "ALPACAUSDT", "CELRUSDT", 
  "WAXPUSDT", "AXLUSDT", "MEMEUSDT", "ROSEUSDT", "DYMUSDT", "LRCUSDT", "OSMOUSDT", "BNTUSDT", "BEAMXUSDT", "CYBERUSDT", "STPTUSDT", 
  "AUDIOUSDT", "ZKUSDT", "BATUSDT", "C98USDT", "DOGSUSDT", "NKNUSDT", "ACXUSDT", "COTIUSDT", "CFXUSDT", "ALPHAUSDT", "XECUSDT", 
  "AEVOUSDT", "BTTCUSDT", "HFTUSDT", "MBOXUSDT", "LEVERUSDT", "RDNTUSDT", "TKOUSEDT", "WLDUSDT", "GHSTUSDT", "FIOUSDT", "SCUSDT", 
  "OMNIUSDT", "BELUSDT", "SYSUSDT", "LUNAUSDT", "ARKUSDT", "ONGUSDT", "USUALUSDT", "FLUXUSDT", "STXUSDT", "VOXELUSDT", "BAKEUSDT", 
  "MTLUSDT", "MASKUSDT", "ICXUSDT", "JUPUSDT", "COMBOUSDT", "IOTAUSDT", "JOEUSDT", "LSKUSDT", "DIAUSDT", "ARPAUSDT", "PIVXUSDT", 
  "QUICKUSDT", "RENDERUSDT", "TLMUSDT", "GLMUSDT", "SOLUSDT", "HIFIUSDT", "QIUSDT", "SLPUSDT", "BNSOLUSDT", "BNXUSDT", "KDAUSDT", 
  "ASTRUSDT", "CAKEUSDT", "ETHUSDT", "VICUSDT", "POLYXUSDT", "OXTUSDT", "LUNCUSDT", "TRBUSDT", "TUSDT", "STRKUSDT", 
  "CATIUSDT", "HMSTRUSDT", "CVXUSDT", "RONINUSDT", "ZECUSDT", "DARUSDT", "NOTUSDT", "XLMUSDT", "XTZUSDT", "AMBUSDT", "WUSDT", 
  "ACEUSDT", "ALCXUSDT", "ALPINEUSDT", "AMPUSDT", "CKBUSDT", "COSUSDT", "CTKUSDT", "DEGOUSDT", "GLMRUSDT", "GMTUSDT", "HOOKUSDT", 
  "KAIAUSDT", "LOKAUSDT", "MDTUSDT", "MKRUSDT", "NMRUSDT", "OGNUSDT", "ORDIUSDT", "PERPUSDT", "PHBUSDT", "PIXELUSDT", "POWRUSDT", 
  "PYTHUSDT", "RADUSDT", "RAREUSDT", "SSVUSDT", "STORJUSDT", "SXPUSDT", "SYNUSDT", "THETAUSDT", "TWTUSDT", "VANAUSDT", "VELODROMEUSDT", 
  "VITEUSDT", "WANUSDT", "BBUSDT", "PUNDIXUSDT", "TFUELUSDT", "RIFUSDT", "FIROUSDT", "SANTOSUSDT", "HIVEUSDT", "UTKUSDT", "BIFIUSDT", 
  "SLFUSDT", "TONUSDT", "CLVUSDT", "ADXUSDT", "CTXCUSDT", "IQUSDT", "MBLUSDT", "MLNUSDT", "STEEMUSDT", "DODOUSDT", 
  "AUCTIONUSDT", "BCHUSDT", "WINUSDT", "ASRUSDT", "STMXUSDT", "TROYUSDT", "ELFUSDT", "AERGOUSDT", "LUMIAUSDT", "ATMUSDT", "ACHUSDT", 
  "XRPUSDT", "JSTUSDT", "PORTOUSDT", "REQUSDT", "DATAUSDT", "ARDRUSDT", "HARDUSDT", "QKCUSDT", "OGUSDT", "DUSKUSDT", "LQTYUSDT", 
  "PDAUSDT", "LAZIOUSDT", "JUVUSDT", "CREAMUSDT", "FUNUSDT", "LTOUSDT", "EDUUSDT", "ACMUSDT", "IDEXUSDT", "BADGERUSDT", "GNOUSDT", 
  "ACTUSDT", "BARUSDT", "ASTUSDT", "BSWUSDT", "CVCUSDT", "ACAUSDT", "PSGUSDT", "FORTHUSDT", "BETAUSDT", "KMDUSDT", "OMUSDT", "TRXUSDT", 
  "CITYUSDT", "JTOUSDT", "NFPUSDT", "BURGERUSDT", "RAYUSDT", "BNBUSDT", "BICOUSDT", "DFUSDT", "SFPUSDT", 
  "PHAUSDT", "MAGICUSDT", "SCRTUSDT", "PROMUSDT", "PROSUSDT", "RLCUSDT", "UFTUSDT", "DEXEUSDT", "FTTUSDT", 
  "ATAUSDT", "DENTUSDT", "PONDUSDT", "AIUSDT", "THEUSDT", "XVGUSDT", "ZENUSDT", "PENGUUSDT", 
  "VIBUSDT", "FISUSDT", "LITUSDT", "FXSUSDT", "VIDTUSDT", "WINGUSDT", "SUNUSDT", "SUSDT",
];

// Split the pairs into two groups
const group1 = trackedPairs.slice(0, Math.ceil(trackedPairs.length / 2));  // First half
const group2 = trackedPairs.slice(Math.ceil(trackedPairs.length / 2));     // Second half

// Function to fetch and calculate RSI for a group of pairs
const fetchDataForGroup = async (group) => {
  for (const symbol of group) {
    await fetchAndCalculateRSI(symbol);  // Call the existing function for each pair
    await delay(10000);  // Delay between each request (e.g., 10 seconds)
  }
};

// Function to alternate between Group 1 and Group 2
const alternateRequests = () => {
  let group1Turn = true;  // Flag to alternate between groups

  setInterval(async () => {
    if (group1Turn) {
      console.log("Processing Group 1...");
      await fetchDataForGroup(group1);
    } else {
      console.log("Processing Group 2...");
      await fetchDataForGroup(group2);
    }

    group1Turn = !group1Turn;  // Toggle the group
  }, 60000);  // 60000ms = 1 minute
};

// Function to delay between requests (e.g., 10 seconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to calculate RSI for a given pair
const fetchAndCalculateRSI = async (symbol) => {
  try {
    const url = `https://api.binance.com/api/v3/klines`;
    const params = {
      symbol,
      interval: '15m',  // Example: 15-minute interval
      limit: 15,  // Number of candles to fetch
    };

    const response = await axios.get(url, { params });

    if (!response.data || response.data.length === 0) {
      console.error(`No data returned for ${symbol}`);
      return;
    }

    // Process the data (e.g., calculate RSI)
    console.log(`Processing RSI for ${symbol}`);
    // Your logic for RSI calculation here

  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error.message);
  }
};

// Start alternating requests for pairs
alternateRequests();
