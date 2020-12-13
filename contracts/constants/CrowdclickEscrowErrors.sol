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
        internal constant BALANCE_GREATER_THAN_WITHDRAW_AMOUNT = "BALANCE MUST BE >= _AMOUNT";
}
