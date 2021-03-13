const axios = require('axios')
const config = require('./environment')

const coingecko = new axios.create({
    baseURL: config.api.coingecko,
    headers: {
      'Content-Type': 'application/json',
    }
  })

class CurrencyApi {
    static async fetchEthToUSD() {
      const response = await coingecko.get('simple/price?ids=ethereum&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false')
      return Math.floor(response.data.ethereum.usd)
    }
}

module.exports = CurrencyApi