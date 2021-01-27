pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

interface ICrowdclickOracle {
    function getEthUsdPriceFeed() external returns(uint256);
}