pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract CrowdclickMockOracle is Ownable {
    using SafeMath for uint256;

    uint256 private currentEthUsdPrice;
    uint256 private multiplier = 10 ** 18;

    address public dataSource;

    constructor(uint256 _currentEthUsdPrice, address _dataSource) public {
        require(_currentEthUsdPrice > 0, 'NOT_GREATER_THAN_0');
        currentEthUsdPrice = _currentEthUsdPrice.mul(multiplier);
        dataSource = _dataSource;
    }

    function changeDataSource(address _dataSource) external onlyOwner() {
        dataSource = _dataSource;
    }

    function adminPushEthUSDPrice(uint256 _currentEthUSDPrice) external {
        require(msg.sender == dataSource, 'NOT_DATASOURCE');
        require(_currentEthUSDPrice > 0, 'NOT_GREATER_THAN_0');
        currentEthUsdPrice = _currentEthUSDPrice.mul(multiplier);
    }

    function getEthUsdPriceFeed() view external returns(uint256) {
        require(currentEthUsdPrice > 0, 'NOT_GREATER_THAN_0');
        return currentEthUsdPrice;
    }    
}
