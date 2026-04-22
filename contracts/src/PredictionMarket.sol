// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract PredictionMarket is ReentrancyGuard, AccessControl {

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum MarketOutcome { Undecided, Yes, No, Cancelled }

    struct Market {
        string question;
        string description;
        string imageUri;
        uint256 endTime;
        MarketOutcome outcome;
        uint256 totalYes;
        uint256 totalNo;
        uint256 totalPool;
        bool resolved;
        bool refunded; 
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
    }

    uint256 public marketId;
    mapping(uint256 => Market) private markets;

    // ---------------- EVENTS ----------------

    event MarketCreated(uint256 indexed id, string question, uint256 endTime);
    event BetPlaced(uint256 indexed id, address indexed user, bool yes, uint256 amount);
    event MarketResolved(uint256 indexed id, MarketOutcome outcome);
    event Refunded(uint256 indexed id);
    event Claimed(uint256 indexed id, address indexed user, uint256 amount);

    // ---------------- CONSTRUCTOR ----------------

    constructor(address admin, address oracle) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, oracle);

        _setRoleAdmin(ORACLE_ROLE, ADMIN_ROLE);
    }

    // ---------------- CREATE ----------------

    function createMarket(
        string calldata _question,
        string calldata _description,
        string calldata _imageUri,
        uint256 _endTime)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(bytes(_question).length >= 5, "bad question");
        require(_endTime > block.timestamp + 1 hours, "bad time");

        Market storage market = markets[marketId];
        market.question = _question;
        market.description = _description;
        market.imageUri = _imageUri;
        market.endTime = _endTime;
        market.outcome = MarketOutcome.Undecided;

        emit MarketCreated(marketId, _question, _endTime);
        marketId++;
    }

    // ---------------- BET ----------------

    function makeBet(uint256 _marketId, bool yes)
        external
        payable
        nonReentrant
    {
        require(_marketId < marketId, "market not found");

        Market storage market = markets[_marketId];

        require(block.timestamp < market.endTime, "ended");
        require(!market.resolved, "resolved");
        require(msg.value > 0, "need more ETH");

        if (yes) {
            market.yesShares[msg.sender] += msg.value;
            market.totalYes += msg.value;
        } else {
            market.noShares[msg.sender] += msg.value;
            market.totalNo += msg.value;
        }

        market.totalPool += msg.value;

        emit BetPlaced(_marketId, msg.sender, yes, msg.value);
    }

    // ---------------- RESOLVE ----------------

    function resolveMarket(uint256 _marketId, bool outcomeYes)
        external
        onlyRole(ORACLE_ROLE)
    {
        require(_marketId < marketId, "market not found");

        Market storage market = markets[_marketId];

        require(block.timestamp >= market.endTime, "not ended");
        require(!market.resolved, "already");

        if (outcomeYes && market.totalYes == 0) {
            market.refunded = true;
            market.outcome = MarketOutcome.Cancelled;
            emit Refunded(_marketId);
        } else if (!outcomeYes && market.totalNo == 0) {
            market.refunded = true;
            market.outcome = MarketOutcome.Cancelled;
            emit Refunded(_marketId);
        } else {
            market.outcome = outcomeYes ? MarketOutcome.Yes : MarketOutcome.No;
        }

        market.resolved = true;

        emit MarketResolved(_marketId, market.outcome);
    }

    // ---------------- CLAIM ----------------

    function claimWinnings(uint256 _marketId) external nonReentrant {
        require(_marketId < marketId, "market not found");

        Market storage market = markets[_marketId];
        require(market.resolved, "not resolved");

        uint256 payout;

        // 🧯 REFUND MODE
        if (market.refunded) {
            uint256 betYes = market.yesShares[msg.sender];
            uint256 betNo = market.noShares[msg.sender];

            payout = betYes + betNo;

            require(payout > 0, "nothing");

            market.yesShares[msg.sender] = 0;
            market.noShares[msg.sender] = 0;
        }
        // 🏆 NORMAL PAYOUT
        else if (market.outcome == MarketOutcome.Yes) {
            uint256 userBet = market.yesShares[msg.sender];
            require(userBet > 0, "no yes");

            payout = (userBet * market.totalPool) / market.totalYes;
            market.yesShares[msg.sender] = 0;
        }
        else if (market.outcome == MarketOutcome.No) {
            uint256 userBet = market.noShares[msg.sender];
            require(userBet > 0, "no no");

            payout = (userBet * market.totalPool) / market.totalNo;
            market.noShares[msg.sender] = 0;
        }

        require(payout > 0, "zero payout");

        // 💸 SAFE TRANSFER (call)
        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "transfer failed");

        emit Claimed(_marketId, msg.sender, payout);
    }

    // ---------------- VIEW ----------------

    function getMarketsPaginated(uint256 start, uint256 limit)
        external
        view
        returns (
            uint256[] memory ids,
            string[] memory questions,
            string[] memory descriptions,
            string[] memory imageUris,
            uint256[] memory endTimes,
            MarketOutcome[] memory outcomes,
            uint256[] memory totalYes,
            uint256[] memory totalNo,
            uint256[] memory totalPool,
            bool[] memory resolved,
            bool[] memory refunded
        )
    {
        // Если рынков нет, возвращаем пустые массивы
    if (marketId == 0) {
        ids = new uint256[](0);
        questions = new string[](0);
        descriptions = new string[](0);
        imageUris = new string[](0);
        endTimes = new uint256[](0);
        outcomes = new MarketOutcome[](0);
        totalYes = new uint256[](0);
        totalNo = new uint256[](0);
        totalPool = new uint256[](0);
        resolved = new bool[](0);
        refunded = new bool[](0);
        return (ids, questions, descriptions, imageUris, endTimes, outcomes, totalYes, totalNo, totalPool, resolved, refunded);
    }

        require(start < marketId, "Invalid start");

        uint256 end = start + limit;
        if (end > marketId) {
            end = marketId;
        }
        uint256 length = end - start;

        ids = new uint256[](length);
        questions = new string[](length);
        descriptions = new string[](length);
        imageUris = new string[](length);
        endTimes = new uint256[](length);
        outcomes = new MarketOutcome[](length);
        totalYes = new uint256[](length);
        totalNo = new uint256[](length);
        totalPool = new uint256[](length);
        resolved = new bool[](length);
        refunded = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 id = start + i;
            Market storage m = markets[id];
            ids[i] = id;
            questions[i] = m.question;
            descriptions[i] = m.description;
            imageUris[i] = m.imageUri;
            endTimes[i] = m.endTime;
            outcomes[i] = m.outcome;
            totalYes[i] = m.totalYes;
            totalNo[i] = m.totalNo;
            totalPool[i] = m.totalPool;
            resolved[i] = m.resolved;
            refunded[i] = m.refunded;
        }
    }

    function getMarket(uint256 _marketId)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            MarketOutcome,
            uint256,
            uint256,
            uint256,
            bool,
            bool
        )
    {
        Market storage market = markets[_marketId];

        return (
            market.question,
            market.description,
            market.endTime,
            market.outcome,
            market.totalYes,
            market.totalNo,
            market.totalPool,
            market.resolved,
            market.refunded
        );
    }

    function getMarketsCount() external view returns (uint256) {
        return marketId;
    }

    function getUserBets(uint256 _marketId, address _user)
        external
        view
        returns (uint256 betYes, uint256 betNo)
    {
        Market storage market = markets[_marketId];
        return (market.yesShares[_user], market.noShares[_user]);
    }

    receive() external payable {}
}