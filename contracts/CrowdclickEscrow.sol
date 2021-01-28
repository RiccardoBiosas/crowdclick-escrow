pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./constants/CrowdclickEscrowErrors.sol";
import "./interfaces/ICrowdclickOracle.sol";


contract CrowdclickEscrow is Ownable, CrowdclickEscrowErrors, ReentrancyGuard {
    using SafeMath for uint256;

    ICrowdclickOracle internal crowdclickOracle;

    struct Task {
        uint256 taskBudget;
        uint256 taskReward;
        uint256 currentBudget;
        string url;
        bool isActive;
    }

    mapping(address => Task[]) private taskCollection;
    mapping(address => uint256) private publisherAccountBalance;
    mapping(address => uint256) private userAccountBalance;

    /** by default it converts to 18decimals */
    uint256 public divider = 10 ** 18;
    /** greater than price of eth to avoid decimals */
    uint256 public multiplier = 10 * 100000;
    /** base minimumUsdWithdrawal * multiplier */
    uint256 public minimumUsdWithdrawal;
    uint256 public feePercentage;
    uint256 public collectedFee;

    address payable public feeCollector;

    constructor(address _crowdclickOracleAddress, 
                uint256 _minimumUsdWithdrawal,
                uint256 _feePercentage,
                address payable _feeCollector
    ) public {
        crowdclickOracle = ICrowdclickOracle(_crowdclickOracleAddress);
        minimumUsdWithdrawal = _minimumUsdWithdrawal;
        feePercentage = _feePercentage;
        feeCollector = _feeCollector;
    }

    /****************************************       
        EXTERNAL FUNCTIONS        
    *****************************************/

    function openTask(
        uint256 _taskBudget,
        uint256 _taskReward,
        string calldata _campaignUrl
    ) external payable nonReentrant {
        uint256 fee = calculateFee(_taskBudget);
        require(msg.value == _taskBudget, WRONG_CAMPAIGN_BUDGET);
        require(_taskBudget.sub(fee) >= _taskReward, WRONG_CAMPAIGN_REWARD);
        collectedFee = collectedFee.add(fee);

        Task memory taskInstance;
        taskInstance.taskBudget = _taskBudget;
        taskInstance.taskReward = _taskReward;
        taskInstance.currentBudget = _taskBudget.sub(fee);
        taskInstance.isActive = true;
        taskInstance.url = _campaignUrl;
        taskCollection[msg.sender].push(taskInstance);
        /** publisher balance + taskBudget - fee */
        publisherAccountBalance[msg.sender] = publisherAccountBalance[msg
            .sender]
            .add(taskInstance.currentBudget);
    }

    function changeFeeCollector(address payable _newFeeCollector) external onlyOwner() {
        feeCollector = _newFeeCollector;
    }

    function changeFeePercentage(uint256 _newFeePercentage) external onlyOwner() {
        feePercentage = _newFeePercentage;
    }

    function balanceOfPublisher(address _address)
        external
        view
        returns (uint256)
    {
        return publisherAccountBalance[_address];
    }

    function balanceOfUser(address _address) external view returns (uint256) {
        return userAccountBalance[_address];
    }

    function withdrawUserBalance(uint256 withdrawAmount) 
        external
        payable 
        nonReentrant {
        uint256 withdrawAmountToUsd = calculateWeiUsdPricefeed(withdrawAmount);
        /** one-thousandth */
        require(
            withdrawAmountToUsd >= minimumUsdWithdrawal.mul(1000),
            LESS_THAN_MINIMUM_WITHDRAWAL
        );
        require(
            userAccountBalance[msg.sender] >= withdrawAmount,
            NOT_ENOUGH_USER_BALANCE
        );
        userAccountBalance[msg.sender] = userAccountBalance[msg.sender].sub(
            withdrawAmount
        );
        msg.sender.transfer(withdrawAmount);
    }

    function withdrawFromCampaign(string calldata _campaignUrl)
        external
        payable
        nonReentrant
    {
        (uint256 campaignIndex, ) = helperSelectTask(msg.sender, _campaignUrl);
        require(
            taskCollection[msg.sender][campaignIndex].currentBudget > 0,
            NOT_ENOUGH_CAMPAIGN_BALANCE
        );
        require(
            publisherAccountBalance[msg.sender] >=
                taskCollection[msg.sender][campaignIndex].currentBudget,
            NOT_ENOUGH_PUBLISHER_BALANCE
        );
        taskCollection[msg.sender][campaignIndex].isActive = false;
        publisherAccountBalance[msg.sender] = publisherAccountBalance[msg
            .sender]
            .sub(taskCollection[msg.sender][campaignIndex].currentBudget);
        uint256 currentCampaignBudget = taskCollection[msg
            .sender][campaignIndex]
            .currentBudget;
        taskCollection[msg.sender][campaignIndex].currentBudget = 0;
        msg.sender.transfer(currentCampaignBudget);
    }

    /** look up task based on the campaign's url */
    function lookupTask(string calldata _campaignUrl)
        external
        view
        returns (Task memory task)
    {
        (uint256 campaignIndex, ) = helperSelectTask(msg.sender, _campaignUrl);
        return taskCollection[msg.sender][campaignIndex];
    }

    /** forward rewards */
    function forwardRewards(
        address _userAddress,
        address _publisherAddress,
        string calldata _campaignUrl
    ) external 
      payable 
      onlyOwner()
      nonReentrant
    {
        (uint256 campaignIndex, ) = helperSelectTask(
            _publisherAddress,
            _campaignUrl
        );
        require(
            taskCollection[_publisherAddress][campaignIndex].isActive,
            CAMPAIGN_NOT_ACTIVE
        );
        require(
            publisherAccountBalance[_publisherAddress] >
                taskCollection[_publisherAddress][campaignIndex].taskReward,
            NOT_ENOUGH_PUBLISHER_BALANCE
        );
        /** decreases campaign task's current budget by campaign's reward */
        taskCollection[_publisherAddress][campaignIndex]
            .currentBudget = taskCollection[_publisherAddress][campaignIndex]
            .currentBudget
            .sub(taskCollection[_publisherAddress][campaignIndex].taskReward);
        /** decreases the balance of the campaign's owner by the campaign's reward */
        publisherAccountBalance[_publisherAddress] = publisherAccountBalance[_publisherAddress]
            .sub(taskCollection[_publisherAddress][campaignIndex].taskReward);
        /** increases the user's balance by the campaign's rewrd */
        userAccountBalance[_userAddress] = userAccountBalance[_userAddress].add(
            taskCollection[_publisherAddress][campaignIndex].taskReward
        );
        /** if the updated campaign's current budget is less than the campaign's reward, then the campaign is not active anymore */
        if (
            publisherAccountBalance[_publisherAddress] <=
            taskCollection[_publisherAddress][campaignIndex].taskReward
        ) {
            taskCollection[_publisherAddress][campaignIndex].isActive = false;
        }
    }

    function calculateWithdrawalRate(uint256 _assetPrice) view external returns(uint256) {
        require(_assetPrice > 0, VALUE_NOT_GREATER_THAN_0);
        return minimumUsdWithdrawal.div(_assetPrice);
    }

    function collectFee() external returns(uint256) {
        require(msg.sender == feeCollector, NOT_FEE_COLLECTOR);
        feeCollector.transfer(collectedFee);
        collectedFee = 0;
    }

    /****************************************       
        PRIVATE FUNCTIONS        
    *****************************************/

    /** retrieves correct task based on the address of the publisher and the campaign's url */
    function helperSelectTask(address _address, string memory _campaignUrl)
        private
        view
        returns (uint256, bool)
    {
        uint256 indx = 0;
        bool found = false;
        for (uint256 i = 0; i < taskCollection[_address].length; i++) {
            string memory url = taskCollection[_address][i].url;
            if (keccak256(bytes(url)) == keccak256(bytes(_campaignUrl))) {
                indx = i;
                found = true;
            }
        }
        return (indx, found);
    }

    function calculateWeiUsdPricefeed(uint256 _weiAmount) private returns(uint256) {
        require(_weiAmount > 0, VALUE_NOT_GREATER_THAN_0);
        /** fetches current eth/usd pricefeed */
        uint256 currentEthPrice = crowdclickOracle.getEthUsdPriceFeed();
        /** adjusts the 8decimals-long eth/usd pricefeed and adjusts by multiplier */
        uint256 adjustedCurrentEthPrice = (currentEthPrice.div(100000000)).mul(multiplier);
        /** adjusts the 18decimals-long wei value and adjusts by multiplier */
        uint256 adjustedEthAmount = adjustByDivider(adjustByMultiplier(_weiAmount));
        /** one-millionth */
        uint256 sliceOfWholeEth = adjustedCurrentEthPrice.div(adjustedEthAmount);
        /** adjusted wei/usd pricefeed */
        return adjustedCurrentEthPrice.div(sliceOfWholeEth);
    }

    function calculateFee(uint256 _amount) private returns(uint256) {
        require(_amount > 0, VALUE_NOT_GREATER_THAN_0);
        return _amount.mul(feePercentage).div(100);
    }

    function adjustByMultiplier(uint256 _value) view private returns(uint256) {
        require(_value > 0, VALUE_NOT_GREATER_THAN_0);
        return _value.mul(multiplier);
    }

    function adjustByDivider(uint256 _value) view private returns(uint256) {
        require(_value > 0, VALUE_NOT_GREATER_THAN_0);
        return _value.div(divider);
    }
}