// SPDX-License-Identifier: none
pragma solidity >=0.7.0 <0.9.0;

// define interface for token contract
interface ITokenizedVotes {
    function getPastVotes(address, uint256) external view returns (uint256);
}

// main tokenizedballot contract body
contract TokenizedBallot {
    // reference block storage
    uint256 public referenceBlock;

    // token contract storage
    ITokenizedVotes public tokenContract;

    // proposal data-type
    struct Proposal {
        bytes32 name;
        uint256 voteCount;
    }

    // array of proposals data-type
    Proposal[] public proposals;

    // track voting power spent
    mapping(address => uint256) public votingPowerSpent;

    constructor(
        bytes32[] memory _proposalNames,
        address _tokenContract,
        uint256 _referenceBlock
    ) {
        // fill proposals array at deployment and zero-out vote count for each
        for (uint256 i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({name: _proposalNames[i], voteCount: 0}));
        }

        // save token contract to contract state
        tokenContract = ITokenizedVotes(_tokenContract);

        // save reference block to contract state
        referenceBlock = _referenceBlock;
    }

    // vote function
    // amount parameter helps split voting power across multiple
    // proposals to varying degrees if so desired
    function vote(uint256 proposal, uint256 amount) public {
        uint256 votingPower_ = votingPower(msg.sender);
        require(votingPower_ >= amount, "Not enough voting power!");
        votingPowerSpent[msg.sender] += amount;
        proposals[proposal].voteCount += amount;
    }

    // check vote power function
    function votingPower(address account)
        public
        view
        returns (uint256 votingPower_)
    {
        // pastVotingSinceReferenceBlock = tokenContract.getPastVotes(account, referenceBlock);
        votingPower_ =
            tokenContract.getPastVotes(account, referenceBlock) -
            votingPowerSpent[account];
    }

    // retrieve winnerName
    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }

    // retrieve winningProposal
    function winningProposal() public view returns (uint256 winningProposal_) {
        uint256 winningVoteCount = 0;
        for (uint256 p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }
}
