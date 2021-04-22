pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CrowdclickMockOracle is
    Initializable,
    OwnableUpgradeable
{
    using SafeMath for uint256;

    uint256 private currentUnderlyingPrice;

    address public dataSource;

    function initialize(
        uint256 _currentUnderlyingPrice, 
        address _dataSource
    ) public {
        __Ownable_init_unchained();
        require(_currentUnderlyingPrice > 0, 'NOT_GREATER_THAN_0');

        currentUnderlyingPrice = _currentUnderlyingPrice;
        dataSource = _dataSource;
    }

    function changeDataSource(address _dataSource) external onlyOwner() {
        dataSource = _dataSource;
    }

    function adminPushUnderlyingUSDPrice(uint256 _currentUnderlyingPrice) external {
        require(msg.sender == dataSource, 'NOT_DATASOURCE');
        require(_currentUnderlyingPrice > 0, 'NOT_GREATER_THAN_0');
        currentUnderlyingPrice = _currentUnderlyingPrice;
    }

    function getUnderlyingUsdPriceFeed() view external returns(uint256) {
        require(currentUnderlyingPrice > 0, 'NOT_GREATER_THAN_0');
        return currentUnderlyingPrice;
    }    
}
