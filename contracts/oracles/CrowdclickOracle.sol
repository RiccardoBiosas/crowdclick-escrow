pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV3Interface.sol";

import "../constants/CrowdclickOracleErrors.sol";

contract CrowdclickOracle is  
    CrowdclickOracleErrors, 
    Ownable, 
    ReentrancyGuard 
{
    using SafeMath for uint256;

    AggregatorV3Interface internal priceFeedOracle;

    event PricefeedUpdate(uint256 value, bool wasCached);

    uint256 private currentEthUsdPrice;
    /** to be updated once every trackingInterval */
    uint256 public startTracking;
    uint256 public trackingInterval;

    constructor (
        address _priceFeedOracleAddress, 
        uint256 _startTracking, 
        uint256 _trackingInterval
    ) {
        priceFeedOracle = AggregatorV3Interface(_priceFeedOracleAddress);
        /** initialize eth/usd pricefeed */
        currentEthUsdPrice = getOraclePriceFeed();
        startTracking = _startTracking;
        trackingInterval = _trackingInterval;
    }

    function getUnderlyingUsdPriceFeed() external nonReentrant returns(uint256) {
        if (block.timestamp > startTracking.add(trackingInterval)) {
            currentEthUsdPrice = getOraclePriceFeed();
            startTracking = block.timestamp;
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
        require(_priceFeedOracleAddress != address(0), "Not valid address");

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
