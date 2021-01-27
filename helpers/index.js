const convertFromWeiToEthereum = amount => {
  const ethereumBalance = web3.utils.fromWei(amount)
  const ethereumBalanceToNumber = parseFloat(ethereumBalance, 10)
  return ethereumBalanceToNumber
}

const toE18 = amount =>  web3.utils.toWei(amount)

/* dirty way to take into account the gas fee */
const approximateEquality = (x, y, epsilon = 0.001) => {
  return Math.abs(x - y) < epsilon
}

module.exports = {
  convertFromWeiToEthereum,
  approximateEquality,
  toE18
}
