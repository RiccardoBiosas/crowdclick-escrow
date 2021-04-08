pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface ICrowdclickOracle {
    function getUnderlyingUsdPriceFeed() external returns(uint256);
}