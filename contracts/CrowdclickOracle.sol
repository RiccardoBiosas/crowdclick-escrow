pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";


import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV3Interface.sol";

import "./constants/CrowdclickOracleErrors.sol";

contract CrowdclickOracle is  
    Initializable,
    OwnableUpgradeable, 
    CrowdclickOracleErrors, 
    ReentrancyGuardUpgradeable 
{
    using SafeMath for uint256;

    AggregatorV3Interface internal priceFeedOracle;

    event PricefeedUpdate(uint256 value, bool wasCached);

    uint256 private currentEthUsdPrice;
    /** to be updated once every trackingInterval */
    uint256 public startTracking;
    uint256 public trackingInterval;

    function initialize(
        address _priceFeedOracleAddress, 
        uint256 _startTracking, 
        uint256 _trackingInterval
    ) public {
        __Ownable_init_unchained();
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
