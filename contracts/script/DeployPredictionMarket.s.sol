// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract DeployPredictionMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        address oracle = admin; // или другой адрес

        vm.startBroadcast(deployerPrivateKey);
        PredictionMarket market = new PredictionMarket(admin, oracle);
        vm.stopBroadcast();

        console.log("PredictionMarket deployed at:", address(market));
    }
}