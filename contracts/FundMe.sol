//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "./PriceConverter.sol";

//constant, immutable used for gas savings

error FundMe__NotOwner();

/**
 * @title A contract for crowd functing
 * @author Moeyjac
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner(){
        // require(i_owner == msg.sender, "Sender is not the owner.");
        if(msg.sender != i_owner){ revert FundMe__NotOwner(); }
        _;
    }
    
    constructor(address _priceFeed){
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // What happens if someone sens this contract ETH without calling the fund function?

    // Used if msg.data is blank
    receive() external payable {
        // Call fund function if value was sent with no specific function called
        fund();
    }

    // Used if msg.data is not empty OR msg.data is empty and no receive function is implemented
    fallback() external payable {
        // Call fund function if value was sent with no specific function called
        fund();
    }

    /**
     * @notice This function funds this contract
     * @dev This impleements price feeds as our library
     */
    function fund() public payable {
        // Want to be able to specify a minimum amount for deposit
         require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "Didnt meet minimum deposit amount");
         s_funders.push(msg.sender);
         s_addressToAmountFunded[msg.sender] += msg.value;
    }

    /**
     * @notice This function allows the owner to withraw the balance of 
     * the contract
     */
    function withdraw() public onlyOwner() {
        for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++){
            address funder = s_funders[funderIndex];
            // Reset funder amount to 0
            s_addressToAmountFunded[funder] = 0;
        }
        // Reset the funders list
        s_funders = new address[](0);

        // Withdraw funds

        // transfer - reverts if it fails automatically
        // msg.sender = address
        // payable(msg.sender) = payable address
        // payable(msg.sender).transfer(address(this).balance);

        // send - returns bool if success/fail. Does NOT fail automatically
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send Failed");

        // call - can call a function and return success + data from called function
        // most used function to transfer ethereum 
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;

        for(uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);

    }

    function getOwner() public view returns(address){
        return i_owner;
    }

    function getFunder(uint256 index) public view returns(address){
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder) public view returns(uint256){
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns(AggregatorV3Interface){
        return s_priceFeed;
    }

}