// File: @openzeppelin/contracts/GSN/Context.sol

pragma solidity ^0.5.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
contract Context {
    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal { }
    // solhint-disable-previous-line no-empty-blocks

    function _msgSender() internal view returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

// File: @openzeppelin/contracts/ownership/Ownable.sol

pragma solidity ^0.5.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: @openzeppelin/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: @openzeppelin/contracts/utils/ReentrancyGuard.sol

pragma solidity ^0.5.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * _Since v2.5.0:_ this module is now much more gas efficient, given net gas
 * metering changes introduced in the Istanbul hardfork.
 */
contract ReentrancyGuard {
    bool private _notEntered;

    constructor () internal {
        // Storing an initial non-zero value makes deployment a bit more
        // expensive, but in exchange the refund on every call to nonReentrant
        // will be lower in amount. Since refunds are capped to a percetange of
        // the total transaction's gas, it is best to keep them low in cases
        // like this one, to increase the likelihood of the full refund coming
        // into effect.
        _notEntered = true;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_notEntered, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _notEntered = false;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _notEntered = true;
    }
}

// File: contracts/constants/CrowdclickEscrowErrors.sol

pragma solidity ^0.5.0;

contract CrowdclickEscrowErrors {
    string internal constant WRONG_CAMPAIGN_BUDGET = "WRONG_CAMPAIGN_BUDGET";
    string
        internal constant LESS_THAN_MINIMUM_WITHDRAWAL = "LESS_THAN_MINIMUM_WITHDRAWAL";
    string
        internal constant NOT_ENOUGH_USER_BALANCE = "NOT_ENOUGH_USER_BALANCE";
    string
        internal constant NOT_ENOUGH_CAMPAIGN_BALANCE = " NOT_ENOUGH_CAMPAIGN_BALANCE";
    string
        internal constant NOT_ENOUGH_PUBLISHER_BALANCE = "NOT_ENOUGH_PUBLISHER_BALANCE";

    string internal constant CAMPAIGN_NOT_ACTIVE = "CAMPAIGN_NOT_ACTIVE";

    string internal constant WRONG_AMOUNT = "WRONG_AMOUNT";
    string
        internal constant BALANCE_GREATER_THAN_WITHDRAW_AMOUNT = "BALANCE_MUST_BE_>=_AMOUNT";
    string
        internal constant VALUE_NOT_GREATER_THAN_0 = "VALUE_NOT_GREATER_THAN_0";
    string internal constant WRONG_CAMPAIGN_REWARD = "WRONG_CAMPAIGN_REWARD";
    string internal constant NOT_FEE_COLLECTOR = "NOT_FEE_COLLECTOR";
}

// File: contracts/interfaces/ICrowdclickOracle.sol

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

interface ICrowdclickOracle {
    function getUnderlyingUsdPriceFeed() external returns(uint256);
}

// File: contracts/CrowdclickEscrow.sol

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;







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

    /**
     * @notice Admin withdraws campaign's balance on publisher's behalf
     */
    function adminPublisherWithdrawal(
        string calldata _campaignUrl,
        address payable _publisherAddress
        ) 
        onlyOwner()
        external
        payable
        nonReentrant
    {
        (uint256 campaignIndex, ) = helperSelectTask(_publisherAddress, _campaignUrl);
        require(
            taskCollection[_publisherAddress][campaignIndex].currentBudget > 0,
            NOT_ENOUGH_CAMPAIGN_BALANCE
        );
        require(
            publisherAccountBalance[_publisherAddress] >=
                taskCollection[_publisherAddress][campaignIndex].currentBudget,
            NOT_ENOUGH_PUBLISHER_BALANCE
        );
        taskCollection[_publisherAddress][campaignIndex].isActive = false;
        publisherAccountBalance[_publisherAddress] = publisherAccountBalance[_publisherAddress]
            .sub(taskCollection[_publisherAddress][campaignIndex].currentBudget);
        uint256 currentCampaignBudget = taskCollection[_publisherAddress][campaignIndex]
            .currentBudget;
        taskCollection[_publisherAddress][campaignIndex].currentBudget = 0;
        _publisherAddress.transfer(currentCampaignBudget);
    }

    /**
     * @notice Admin withdraws user's balance on user's behalf
     */
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
        uint256 currentUnderlyingPrice = crowdclickOracle.getUnderlyingUsdPriceFeed();
        /** adjusts the 8decimals-long eth/usd pricefeed and adjusts by multiplier */
        uint256 adjustedCurrentUnderlyingPrice = (currentUnderlyingPrice.div(100000000)).mul(multiplier);
        /** adjusts the 18decimals-long wei value and adjusts by multiplier */
        uint256 adjustedEthAmount = adjustByDivider(adjustByMultiplier(_weiAmount));
        /** one-millionth */
        uint256 sliceOfWholeEth = adjustedCurrentUnderlyingPrice.div(adjustedEthAmount);
        /** adjusted wei/usd pricefeed */
        return adjustedCurrentUnderlyingPrice.div(sliceOfWholeEth);
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
