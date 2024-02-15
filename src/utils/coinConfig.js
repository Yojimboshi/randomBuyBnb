// coinConfig.js

// below are list only available in binnance spot
module.exports = {
  // 1 to 20
  coinListA: [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA',
    'AVAX', 'DOGE', 'LINK', 'TRX', 'DOT', 'MATIC',
    'ICP', 'SHIB', 'BCH', 'LTC'
  ],

  // 20 to 50
  coinListB: [
    'IMX', 'UNI', 'ATOM', 'ETC', 'STX', 'OP', 'NEAR', 'APT',
    'INJ', 'XLM', 'TIA', 'LDO', 'FIL', 'HBAR', 'ARB',
    'VET', 'XMR', 'SUI', 'SEI', 'MKR', 'RNDR', 'RUNE', 'GRT',
    'EGLD'
  ],
  // 50 to 100
  coinListC: [
    'MINA', 'ORDI', 'ALGO', 'FLOW',
    'AAVE', 'QNT', 'BLUR', 'DYM',
    'FTM', 'SNX', 'THETA', 'AXS',
    'SAND', 'XTZ', '1000SATS', 'ASTR',
    'PYTH', 'CHZ', 'MANA', 'BONK',
    'NEO', 'CFX', 'ROSE', 'IOTA',
    'EOS', 'KLAY', 'OSMO', 'KAVA',
    'PENDLE', 'MANTA', 'WOO', 'GNO',
    'ENS', 'GALA', 'JUP', 'LUNC'
  ],
  // 100 to 200
  coinListD: [
    'FXS', 'XEC', 'AR', 'RPL', 'CAKE', 'FTT',
    'SC', 'CRV', 'NEXO', 'APE', 'FET', 'SUPER',
    '1INCH', 'PEPE', 'TWT', 'CKB', 'GMT', 'COMP',
    'LUNA', 'ALT', 'ENJ', 'SKL', 'NTRN', 'IOTX',
    'ELF', 'GMX', 'WLD', 'GAS', 'PAXG', 'CELO',
    'API3', 'AGIX', 'ILV', 'KSM', 'ZIL', 'HOT',
    'UMA', 'BAT', 'MASK', 'MAGIC', 'GLMR', 'SFP',
    'ZEC', 'LRC', 'XEM', 'CVX', 'DASH', 'SSV',
    'QTUM', 'FLOKI', 'TRB', 'JASMY', 'ANT', 'XAI',
    'KDA', 'JST', 'OCEAN', 'RAY', 'ZRX', 'SUSHI',
    'BAND', 'TFUEL', 'CHR', 'ID', 'RVN', 'MEME',
    'T', 'STORJ', 'ANKR', 'GAL', 'BICO', 'VTHO',
    'DCR', 'JTO', 'YFI', 'WAVES'
  ],
  // 200 to 400
  coinListE: [
    'GAL', 'JTO', 'ICX', 'GLM', 'ONT', 'BAL',
    'ONE', 'FLUX', 'MOVR', 'POND', 'SXP', 'WAXP',
    'ACE', 'EDU', 'OM', 'IOST', 'VTHO', 'LSK',
    'JOE', 'AUCTION', 'XVS', 'MAV', 'C98', 'RLC',
    'GNS', 'NMR', 'POWR', 'PYR', 'HIVE', 'ARK',
    'SNT', 'XNO', 'AMP', 'AI', 'GMT', 'STRAX',
    'RIF', 'PEOPLE', 'CELR', 'NFP', 'YGG', 'ACH',
    'RDNT', 'SYN', 'DGB', 'DUSK', 'BLZ', 'LQTY',
    'POLYX', 'CTXC', 'PROM', 'CYBER', 'ZEN', 'RSR',
    'SLP', 'COTI', 'STG', 'KNC', 'DEXE', 'PUNDIX',
    'LOOM', 'PLA', 'OXT', 'STPT', 'DENT', 'SCRT',
    'STEEM', 'BAKE', 'BNT', 'ACA', 'AGLD', 'RAD',
    'MTL', 'DODO', 'BNX', 'WIN', 'CVC', 'OGN',
    'OMG', 'SYS', 'ARKM', 'IQ', 'CTK', 'ARDR',
    'REQ', 'NKN'
  ],
  // 400 to 600
  coinListF: [
    'GTC', 'ALPHA', 'ALICE', 'MBOX', 'WRX',
    'POLS', 'SUN', 'PERP', 'MBL', 'HIGH',
    'AEUR', 'VANRY', 'QKC', 'ARPA', 'PHA',
    'STMX', 'VIC', 'RARE', 'QI', 'HIFI',
    'WNXM', 'BADGER', 'FUN', 'TKO', 'MOB',
    'MEME', 'REN', 'AERGO', 'TRU', 'XVG',
    'SPELL', 'BETA', 'DATA', 'TLM', 'GHST',
    'ALCX', 'COMBO', 'FORTH', 'LINA', 'PHB',
    'DIA', 'MDX', 'DAR', 'DEGO', 'FLM',
    'ALT', 'ERN', 'WAN', 'BSW', 'MLN',
    'IRIS', 'LEVER', 'IDEX', 'ATA', 'UTK',
    'CLV', 'FRONT', 'BEL', 'ALT', 'UNFI'
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
