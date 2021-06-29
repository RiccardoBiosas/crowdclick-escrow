pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./constants/CrowdclickEscrowErrors.sol";
import "./interfaces/ICrowdclickOracle.sol";

contract CrowdclickEscrow is
    CrowdclickEscrowErrors, 
    Ownable, 
    ReentrancyGuard
{
    using SafeMath for uint256;

    ICrowdclickOracle internal crowdclickOracle;

    event RewardForwarded(address recipient, uint256 reward, string campaignUrl);
    event CampaignCreated(address publisher, uint256 campaignBudget, string campaignUrl);
    event UserWithdrawalEmitted(address recipient, uint256 amount);
    event PublisherWithdrawalEmitted(address recipient, uint256 amount, string campaignUrl);

    struct Task {
        uint256 taskBudget;
        uint256 taskReward;
        uint256 currentBudget;
        string url;
        bool isActive;
    }

    mapping(address => mapping(string => Task)) taskCollection;
    mapping(address => uint256) private publisherAccountBalance;
    mapping(address => uint256) private userAccountBalance;
    mapping(address => uint256) public lastUserWithdrawalTime;

    // by default it converts to 18decimals
    uint256 public divider;
    // greater than price of underlying to avoid decimals
    uint256 public multiplier;
    // base minimumUsdWithdrawal * multiplier
    uint256 public minimumUsdWithdrawal;
    uint256 public maximumWeiUserWithdrawal;
    uint256 public feePercentage;
    uint256 public collectedFee;

    address payable public feeCollector;

    constructor(
        address _crowdclickOracleAddress, 
        uint256 _minimumUsdWithdrawal,
        uint256 _feePercentage,
        address payable _feeCollector
    ) {
        crowdclickOracle = ICrowdclickOracle(_crowdclickOracleAddress);
        minimumUsdWithdrawal = _minimumUsdWithdrawal;
        feePercentage = _feePercentage;
        feeCollector = _feeCollector;

        maximumWeiUserWithdrawal =  5e17;
        divider = 1e18;
        multiplier = 1e6;
    }

    // EXTERNAL FUNCTIONS /

    function openTask(
        string calldata _uuid,
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
        taskCollection[msg.sender][_uuid] = taskInstance;
        /** publisher balance + taskBudget - fee */
        publisherAccountBalance[msg.sender] = publisherAccountBalance[msg
            .sender]
            .add(taskInstance.currentBudget);
        emit CampaignCreated(msg.sender, taskInstance.taskBudget, taskInstance.url);
    }

    function changeFeeCollector(address payable _newFeeCollector) external onlyOwner() {
        feeCollector = _newFeeCollector;
    }

    function changeFeePercentage(uint256 _newFeePercentage) external onlyOwner() {
        feePercentage = _newFeePercentage;
    }

    function changeMaximumWeiUserWithdrawal(uint256 _updatedMaximumWeiUserWithdrawal) external onlyOwner() {
        maximumWeiUserWithdrawal = _updatedMaximumWeiUserWithdrawal;
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

    function isUserWithdrawalEnabled() external view returns (bool) {
        return block.timestamp >= lastUserWithdrawalTime[msg.sender] + 1 days;
    }

    function withdrawUserBalance() 
        external
        payable 
        nonReentrant {
        require(userAccountBalance[msg.sender] > 0);
        emit UserWithdrawalEmitted(msg.sender, userAccountBalance[msg.sender]);
        payable(msg.sender).transfer(userAccountBalance[msg.sender]);
        userAccountBalance[msg.sender] = 0;
    }

    function withdrawFromCampaign(string calldata _uuid)
        external
        payable
        nonReentrant
    {
        Task storage taskInstance = _selectTask(msg.sender, _uuid);
        require(
            taskInstance.currentBudget > 0,
            NOT_ENOUGH_CAMPAIGN_BALANCE
        );
        require(
            publisherAccountBalance[msg.sender] >=
                taskInstance.currentBudget,
            NOT_ENOUGH_PUBLISHER_BALANCE
        );
        taskInstance.isActive = false;
        publisherAccountBalance[msg.sender] = publisherAccountBalance[msg
            .sender]
            .sub(taskInstance.currentBudget);
        uint256 currentCampaignBudget = taskInstance.currentBudget;
        taskInstance.currentBudget = 0;
        payable(msg.sender).transfer(currentCampaignBudget);
        emit PublisherWithdrawalEmitted(msg.sender, taskInstance.currentBudget, taskInstance.url);
    }

    /** look up task based on the campaign's url */
    function lookupTask(string calldata _uuid, address _address)
        external
        view
        returns (Task memory task)
    {
        Task memory taskInstance = _selectTask(_address, _uuid);
        return taskInstance;
    }

    // forward rewards /
    function forwardRewards(
        address _userAddress,
        address _publisherAddress,
        string calldata _uuid
    ) external 
      payable 
      onlyOwner()
      nonReentrant
    {
        Task storage taskInstance = _selectTask(
            _publisherAddress,
            _uuid
        );
        require(
            taskInstance.isActive,
            CAMPAIGN_NOT_ACTIVE
        );
        require(
            publisherAccountBalance[_publisherAddress] >
                taskInstance.taskReward,
            NOT_ENOUGH_PUBLISHER_BALANCE
        );
        /** decreases campaign task's current budget by campaign's reward */
        taskInstance
            .currentBudget = taskInstance.currentBudget
            .sub(taskInstance.taskReward);
        /** decreases the balance of the campaign's owner by the campaign's reward */
        publisherAccountBalance[_publisherAddress] = publisherAccountBalance[_publisherAddress]
            .sub(taskInstance.taskReward);
        /** increases the user's balance by the campaign's reward */
        userAccountBalance[_userAddress] = userAccountBalance[_userAddress].add(
            taskInstance.taskReward
        );
        emit RewardForwarded(_userAddress, taskInstance.taskReward, taskInstance.url);
        // if the updated campaign's current budget is less than the campaign's reward, then the campaign is not active anymore
        if (
            publisherAccountBalance[_publisherAddress] <=
            taskInstance.taskReward ||
            taskInstance.currentBudget < taskInstance.taskReward
        ) {
            taskInstance.isActive = false;
        }
    }

    function calculateWithdrawalRate(uint256 _assetPrice) view external returns(uint256) {
        require(_assetPrice > 0, VALUE_NOT_GREATER_THAN_0);
        return minimumUsdWithdrawal.div(_assetPrice);
    }

    function collectFee() external {
        require(msg.sender == feeCollector, NOT_FEE_COLLECTOR);
        feeCollector.transfer(collectedFee);
        collectedFee = 0;
    }

    // Admin withdraws campaign's balance on publisher's behalf /
    function adminPublisherWithdrawal(
        string calldata _uuid,
        address payable _publisherAddress
        ) 
        onlyOwner()
        external
        payable
        nonReentrant
    {
        Task storage taskInstance = _selectTask(_publisherAddress, _uuid);
        require(
            taskInstance.currentBudget > 0,
            NOT_ENOUGH_CAMPAIGN_BALANCE
        );
        require(
            publisherAccountBalance[_publisherAddress] >=
                taskInstance.currentBudget,
            NOT_ENOUGH_PUBLISHER_BALANCE
        );
        taskInstance.isActive = false;
        publisherAccountBalance[_publisherAddress] = publisherAccountBalance[_publisherAddress]
            .sub(taskInstance.currentBudget);
        uint256 currentCampaignBudget = taskInstance.currentBudget;
        taskInstance.currentBudget = 0;
        _publisherAddress.transfer(currentCampaignBudget);
        emit PublisherWithdrawalEmitted(_publisherAddress, taskInstance.currentBudget, taskInstance.url);
    }

    // Admin withdraws user's balance on user's behalf /
    function adminUserWithdrawal(address payable _userAddress) 
        onlyOwner()
        external
        payable
        nonReentrant 
    {
        uint256 userBalance = userAccountBalance[_userAddress];
        require(
            userBalance > 0,
            NOT_ENOUGH_USER_BALANCE
        );
        userAccountBalance[_userAddress] = 0;
        _userAddress.transfer(userBalance);
        emit UserWithdrawalEmitted(_userAddress, userBalance);
    }

    // PRIVATE FUNCTIONS /
    

    /** retrieves correct task based on the address of the publisher and the campaign's url */
    function _selectTask(address _address, string memory _uuid)
        private
        view
        returns (Task storage task)
    {
        return taskCollection[_address][_uuid];
    }

    function calculateWeiUsdPricefeed(uint256 _weiAmount) private returns(uint256) {
        require(_weiAmount > 0, VALUE_NOT_GREATER_THAN_0);
        // fetches current eth/usd pricefeed /
        uint256 currentUnderlyingPrice = crowdclickOracle.getUnderlyingUsdPriceFeed();
        // adjusts the 8decimals-long eth/usd pricefeed and adjusts by multiplier /
        uint256 adjustedCurrentUnderlyingPrice = (currentUnderlyingPrice.div(100000000)).mul(multiplier);
        // adjusts the 18decimals-long wei value and adjusts by multiplier /
        uint256 adjustedUnderlyingAmount = adjustByDivider(adjustByMultiplier(_weiAmount));
        // one-millionth /
        uint256 sliceOfWholeUnderlying = adjustedCurrentUnderlyingPrice.div(adjustedUnderlyingAmount);
        // adjusted wei/usd pricefeed /
        return adjustedCurrentUnderlyingPrice.div(sliceOfWholeUnderlying);
    }

    function calculateFee(uint256 _amount) view private returns(uint256) {
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