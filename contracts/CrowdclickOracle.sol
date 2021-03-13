pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV3Interface.sol";

import "./constants/CrowdclickOracleErrors.sol";

contract CrowdclickOracle is Ownable, CrowdclickOracleErrors, ReentrancyGuard {
    using SafeMath for uint256;

    AggregatorV3Interface internal priceFeedOracle;

    event PricefeedUpdate(uint256 value, bool wasCached);

    uint256 private currentEthUsdPrice;
    /** to be updated once every trackingInterval */
    uint256 public startTracking;
    uint256 public trackingInterval;

    constructor(address _priceFeedOracleAddress, uint256 _startTracking, uint256 _trackingInterval) public {
        priceFeedOracle = AggregatorV3Interface(_priceFeedOracleAddress);
        /** initialize eth/usd pricefeed */
        currentEthUsdPrice = getOraclePriceFeed();
        startTracking = _startTracking;
        trackingInterval = _trackingInterval;
    }

    function getEthUsdPriceFeed() external nonReentrant returns(uint256) {
        if (now > startTracking.add(trackingInterval)) {
            currentEthUsdPrice = getOraclePriceFeed();
            startTracking = now;
            emit PricefeedUpdate(currentEthUsdPrice, false);
            return currentEthUsdPrice;
        } else {
            emit PricefeedUpdate(currentEthUsdPrice, true);
           return currentEthUsdPrice;
        }
    }

    function changeTrackingInterval(uint256 _newTrackingInterval) external onlyOwner() {
        require(_newTrackingInterval > 0, INTERVAL_LESS_ZERO);
        trackingInterval = _newTrackingInterval;
    }

    function changeOracle(address _priceFeedOracleAddress) external onlyOwner() {
       /** add check for valid address */
       priceFeedOracle = AggregatorV3Interface(_priceFeedOracleAddress);
    }

    function getOraclePriceFeed() private returns(uint256) {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeedOracle.latestRoundData();
        return uint256(price);
    }
}
