// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";

contract GrantOracleRole is Script {
    // Адрес контракта (payable, так как контракт может принимать ETH)
    address payable constant PREDICTION_MARKET = payable(0xc6CAdeFE6B9F55Fdce475a1e118270FA7F787001);
    
    // Адрес, которому выдаём роль оракула
    address constant NEW_ORACLE = 0xC48E3fc74f7fCec688A19589E0F36b8f121eDfce;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        PredictionMarket market = PredictionMarket(PREDICTION_MARKET);
        
        bytes32 oracleRole = keccak256("ORACLE_ROLE");
        
        market.grantRole(oracleRole, NEW_ORACLE);
        
        console.log("Granted ORACLE_ROLE to", NEW_ORACLE);
        
        vm.stopBroadcast();
    }
}