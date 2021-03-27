pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract CrowdclickMockOracle is Ownable {
    using SafeMath for uint256;

    uint256 private currentUnderlyingPrice;
    uint256 private multiplier = 10 ** 18;

    address public dataSource;

    constructor(uint256 _currentUnderlyingPrice, address _dataSource) public {
        require(_currentUnderlyingPrice > 0, 'NOT_GREATER_THAN_0');
        currentUnderlyingPrice = _currentUnderlyingPrice.mul(multiplier);
        dataSource = _dataSource;
    }

    function changeDataSource(address _dataSource) external onlyOwner() {
        dataSource = _dataSource;
    }

    function adminPushUnderlyingUSDPrice(uint256 _currentUnderlyingPrice) external {
        require(msg.sender == dataSource, 'NOT_DATASOURCE');
        require(_currentUnderlyingPrice > 0, 'NOT_GREATER_THAN_0');
        currentUnderlyingPrice = _currentUnderlyingPrice.mul(multiplier);
    }

    function getUnderlyingUsdPriceFeed() view external returns(uint256) {
        require(currentUnderlyingPrice > 0, 'NOT_GREATER_THAN_0');
        return currentUnderlyingPrice;
    }    
}
