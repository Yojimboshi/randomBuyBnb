// coinConfig.js

// below are list only available in binnance spot
module.exports = {
  // 1 to 20
  coinListA: [
    'BTC', 'ETH', 'BNB',
    'SOL', 'XRP', 'ADA',
    'DOGE', 'AVAX', 'SHIB',
    'DOT', 'LINK', 'TRX',
    'MATIC', 'NEAR', 'BCH',
    'UNI', 'LTC'
  ],

  // 20 to 50
  coinListB: [
    'ICP', 'APT', 'FIL',
    'ATOM', 'ETC', 'IMX',
    'RNDR', 'INJ', 'STX',
    'HBAR', 'XLM', 'OP',
    'PEPE', 'GRT', 'VET',
    'RUNE', 'WIF', 'THETA',
    'LDO', 'TIA', 'MKR'
  ],
  // 50 to 100
  coinListC: [
    'ARB', 'FLOKI', 'ALGO', 'SEI',
    'AR', 'FTM', 'FET', 'FLOW',
    'BONK', 'AAVE', 'GALA', 'EGLD',
    'SUI', 'DYDX', 'STRK', 'QNT',
    'AXS', 'CFX', 'SAND', 'ORDI',
    'AGIX', 'SNX', 'WLD', 'MINA',
    'XTZ', 'CHZ', 'APE', 'JUP',
    'MANA', 'DYDX', 'EOS', '1000SATS',
    'AXL', 'XEC', 'NEO', 'IOTA',
    'ZRX', 'CAKE', 'DYDX', 'KAVA'
  ],
  // 100 to 200
  coinListD: [
    'ROSE', 'KLAY', 'GNO', 'OSMO', 'BLUR', 'LUNC',
    'JASMY', 'WOO', 'DYM', 'CRV', 'ASTR', 'CKB',
    'MANTA', 'ID', 'NEXO', 'FTT', 'ENJ', 'LPT',
    'ENS', 'IOTX', 'CELO', '1INCH', 'COMP', 'HOT',
    'LUNA', 'RPL', 'FXS', 'LRC', 'PENDLE', 'OCEAN',
    'ZIL', 'SUPER', 'METIS', 'TWT', 'GMT', 'TFUEL',
    'GLM', 'ALT', 'SC', 'PIXEL', 'SKL', 'MEME',
    'ZEC', 'ANKR', 'GMX', 'QTUM', 'BAT', 'GLMR',
    'ILV', 'GAS', 'WAVES', 'XEM', 'ELF', 'GAL',
    'KDA', 'SSV', 'ARKM', 'SUSHI', 'DASH', 'KSM',
    'DCR', 'BICO', 'MASK', 'ONE', 'CVX', 'AMP',
    'FLUX', 'PAXG', 'RVN', 'PORTAL', 'VANRY', 'NTRN',
    'RAY', 'ACH', 'DEXE', 'AUDIO', 'SFP'
  ],
  // 200 to 400
  coinListE: [
    'RLC', 'WAVES', 'CTSI', 'YFI', 'BICO', 'ONE',
    'ICX', 'BAL', 'JTO', 'RAY', 'ONT', 'C98',
    'EDU', 'ACE', 'WAXP', 'AI', 'SXP', 'PROM',
    'COTI', 'AMP', 'IOST', 'ARKM', 'NMR', 'RIF',
    'GNS', 'XVS', 'JOE', 'MOVR', 'SNT', 'PYR',
    'ACH', 'POWR', 'AUCTION', 'CELR', 'LSK', 'NFP',
    'HIVE', 'POND', 'OM', 'MAV', 'CYBER', 'DGB',
    'STRAX', 'YGG', 'BLZ', 'DEXE', 'POLYX', 'ARK',
    'GMT', 'XNO', 'RSR', 'SLP', 'IQ', 'RDNT',
    'ZEN', 'PEOPLE', 'HFT', 'LQTY', 'DENT', 'HOOK',
    'STG', 'SCRT', 'CTXC', 'ONG', 'LOOM', 'SYN',
    'DUSK', 'DODO', 'KNC', 'OXT', 'STPT', 'PUNDIX',
    'STEEM', 'WIN', 'BAKE', 'CVC', 'SYS', 'PLA',
    'VANRY', 'AGLD', 'ALPHA', 'MTL', 'REQ', 'ACA',
    'BNX', 'BNT', 'OMG', 'RAD', 'NKN', 'SUN'
  ],
  // 400 to 600
  coinListF: [
    'OGN', 'GTC', 'CTK', 'ALICE', 'MBL',
    'ARDR', 'WRX', 'RARE', 'MBOX', 'PERP',
    'POLS', 'SPELL', 'PHA', 'HIGH', 'ARPA',
    'HIFI', 'STMX', 'WNXM', 'QKC', 'PHB',
    'QI', 'TKO', 'VIC', 'REN', 'BADGER',
    'AEUR', 'DATA', 'AERGO', 'DAR', 'MOB',
    'TRU', 'ALCX', 'MEME', 'ALT', 'XVG',
    'TLM', 'FUN', 'BETA', 'FORTH', 'COMBO',
    'STRK', 'ATA', 'LINA', 'DIA', 'BSW',
    'FRONT', 'GHST', 'ORN', 'LEVER', 'FLM',
    'IDEX', 'MDT', 'IRIS', 'MDX', 'LIT',
    'BEL', 'DEGO', 'ERN', 'CLV', 'WAN'
  ],

  stablecoins: [
    'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'PAX', 'USDP',
    'USTC', 'SUSD', 'EURC', 'vBUSD', 'VAI', 'EURt', 'FDUSD'
  ],

  wrappedTokens: [
    'WBTC', 'WETH', 'stETH', 'BTCB', 'WBNB', 'WTRX', 'WHBAR',
    'WEOS', 'WBETH', 'RETH', 'HBTC', 'vBNB', 'cbETH', 'WKAVA',
    'vBTC', 'vUSDC', 'vETH', 'ankrETH', 'renBTC']

};
