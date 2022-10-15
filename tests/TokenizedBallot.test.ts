import { expect } from 'chai'
import { ethers } from 'hardhat'
import { G11Token, TokenizedBallot } from '../typechain-types'
import convertStringArrayToBytes32 from '../scripts/helpers/convertStringArrayToBytes32'
import bigNumberDecimalToFloat from '../scripts/helpers/bigNumberDecimalToFloat'

import PROPOSALS from '../scripts/data/ballotProposals'
import { before } from 'mocha'

describe('TokenizedBallot', function () {
  let tokenContract: G11Token
  let tokenizedBallotContract: TokenizedBallot

  const TOKEN_UNITS_TO_MINT_ACCOUNT_A = 20
  const TOKEN_UNITS_TO_MINT_ACCOUNT_B = 30
  const TOKEN_UNITS_TO_MINT_ACCOUNT_C = 40
  const TOKEN_UNITS_TO_MINT_ACCOUNT_D = 50

  /*
  |> Pre-requisites for `TokenizedBallot.sol` deployment:
    1. token contract already deployed
    2. mint money to people involved in the vote
    3. complete vote delegations phase amongst the people
  */
  /*
  |> Updated test-rig structure
    |> test-rig setup 
      1. deploy ERC20Votes token contract and record reference block
      2. identify entire population of voters
      3. allocate voters their voting power by minting tokens into their account
      4. mandate delegations with-in a certain period 
      5. only after these steps are completed in-order,
        - deploy 

    |> actual tests
      - vote 
      - check winning proposal
  */

  // test-rig setup
  before(async () => {
    // 1. deploy ERC20Votes token contract =================================================================
    const tokenContractFactory = await ethers.getContractFactory('G11Token')
    tokenContract = await tokenContractFactory.deploy()
    await tokenContract.deployed()
    const currentBlock = await ethers.provider.getBlock('latest')

    // 2. identify entire population of voters =============================================================
    const [
      deployerAccount,
      accountA,
      accountB,
      accountC,
      accountD,
    ] = await ethers.getSigners()

    // 3. allocate voters their voting power by minting tokens into their account ==========================

    await tokenContract
      .connect(deployerAccount)
      .mint(
        accountA.address,
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_A}`),
      )

    await tokenContract
      .connect(deployerAccount)
      .mint(
        accountB.address,
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_B}`),
      )

    await tokenContract
      .connect(deployerAccount)
      .mint(
        accountC.address,
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_C}`),
      )

    await tokenContract
      .connect(deployerAccount)
      .mint(
        accountD.address,
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_D}`),
      )

    // 4. mandate delegations with-in a certain period =====================================================

    // accountD delegates to accountC
    await tokenContract.connect(accountD).delegate(accountC.address)

    // accountA self-delegates
    await tokenContract.connect(accountA).delegate(accountA.address)
    // accountB self-delegates
    await tokenContract.connect(accountB).delegate(accountB.address)
    // accountC self-delegates
    await tokenContract.connect(accountC).delegate(accountC.address)

    // 5. only after these steps are completed in-order, deploy tokenized-ballot contract =================
    const tokenizedBallotContractFactory = await ethers.getContractFactory(
      'TokenizedBallot',
    )
    tokenizedBallotContract = await tokenizedBallotContractFactory.deploy(
      convertStringArrayToBytes32(PROPOSALS),
      tokenContract.address,
      currentBlock.number,
    )
    await tokenizedBallotContract.deployed()
  })

  describe('post tokenized-ballot deployment', () => {
    it('checks for voting powers of voting accounts, accounting for delegation', async () => {
      const [
        ,
        accountA,
        accountB,
        accountC,
        accountD,
      ] = await ethers.getSigners()

      expect(await tokenContract.balanceOf(accountA.address)).to.eq(
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_A}`),
      )
      expect(await tokenContract.balanceOf(accountB.address)).to.eq(
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_B}`),
      )
      expect(await tokenContract.balanceOf(accountC.address)).to.eq(
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_C}`),
      )
      expect(await tokenContract.balanceOf(accountD.address)).to.eq(
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_D}`),
      )
    })

    it('casts votes and queries results', async () => {
      // get voter accounts
      const [, accountA, accountB, accountC] = await ethers.getSigners()

      // cast votes
      await tokenizedBallotContract
        .connect(accountA)
        .vote(0, ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_A}`))

      await tokenizedBallotContract
        .connect(accountB)
        .vote(1, ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT_ACCOUNT_B}`))

      await tokenizedBallotContract
        .connect(accountC)
        .vote(
          2,
          ethers.utils.parseEther(
            `${TOKEN_UNITS_TO_MINT_ACCOUNT_C + TOKEN_UNITS_TO_MINT_ACCOUNT_D}`,
          ),
        )

      // query results
      expect(await tokenizedBallotContract.winnerName()).to.eq(
        ethers.utils.formatBytes32String(PROPOSALS[2]),
      )
    })
  })
})
