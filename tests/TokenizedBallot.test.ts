import { expect } from 'chai'
import { ethers } from 'hardhat'
import { G11Token, TokenizedBallot } from '../typechain-types'
import convertStringArrayToBytes32 from '../scripts/helpers/convertStringArrayToBytes32'
import bigNumberDecimalToFloat from '../scripts/helpers/bigNumberDecimalToFloat'

import PROPOSALS from '../scripts/data/ballotProposals'

describe('TokenizedBallot', function () {
  let tokenContract: G11Token
  let tokenizedBallotContract: TokenizedBallot

  beforeEach(async function () {
    const tokenContractFactory = await ethers.getContractFactory('G11Token')
    tokenContract = await tokenContractFactory.deploy()
    await tokenContract.deployed()

    const currentBlock = await ethers.provider.getBlock('latest')

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
  // casting votes
  describe('casting votes', () => {
    it('give voting tokens to accounts, then count votes, then get winning proposal', async () => {
      const decimals = await tokenContract.decimals()
      const [, accountA] = await ethers.getSigners()

      // give voting token to an account
      const TRANSFER_TOKEN_UNITS_ACC_A = ethers.utils.parseEther('25')

      await tokenContract.transfer(accountA.address, TRANSFER_TOKEN_UNITS_ACC_A)

      expect(
        bigNumberDecimalToFloat(
          await tokenContract.balanceOf(accountA.address),
          decimals,
        ),
      ).to.eq(bigNumberDecimalToFloat(TRANSFER_TOKEN_UNITS_ACC_A, decimals))

      // vote from account
      const VOTE_TOKEN_AMOUNT = ethers.utils.parseEther('15')
      const voteTxn = await tokenizedBallotContract
        .connect(accountA)
        .vote(1, VOTE_TOKEN_AMOUNT)
      voteTxn.wait()

      // check votes
      expect(
        bigNumberDecimalToFloat(
          (await tokenizedBallotContract.proposals(0)).voteCount,
          decimals,
        ),
      ).to.eq(0)
      expect(
        bigNumberDecimalToFloat(
          (await tokenizedBallotContract.proposals(1)).voteCount,
          decimals,
        ),
      ).to.eq(15)
      expect(
        bigNumberDecimalToFloat(
          (await tokenizedBallotContract.proposals(2)).voteCount,
          decimals,
        ),
      ).to.eq(0)

      // query results
      expect(await tokenizedBallotContract.winnerName()).to.eq(
        ethers.utils.formatBytes32String(PROPOSALS[1]),
      )
    })
  })
})
