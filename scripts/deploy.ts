import ethers from 'ethers'
import { ethers as hardhatEthers } from 'hardhat'
import convertStringArrayToBytes32 from './helpers/convertStringArrayToBytes32'

import PROPOSALS from '../scripts/data/ballotProposals'

async function main() {
  const [
    deployer,
    accountA,
    accountB,
    accountC,
  ] = await hardhatEthers.getSigners()

  console.log(
    'Running Local Network Connect and Deploy! =====================================',
  )
  console.log('\n')
  console.log('...deploying ERC-20 token contract...')

  const tokenContractFactory = await hardhatEthers.getContractFactory(
    'G11Token',
  )
  const tokenContract = await tokenContractFactory.deploy()
  await tokenContract.deployed()

  console.log('\n')
  console.log('...getting latest block...')
  const currentBlock = await hardhatEthers.provider.getBlock('latest')

  console.log('\n')
  console.log('...deploying tokenized ballot...')
  const tokenizedBallotContractFactory = await hardhatEthers.getContractFactory(
    'TokenizedBallot',
  )
  const tokenizedBallotContract = await tokenizedBallotContractFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS),
    tokenContract.address,
    currentBlock.number,
  )
  await tokenizedBallotContract.deployed()

  // - give voting tokens by minting
  console.log('\n')
  console.log('...minting ERC-20 tokens into other accounts...')
  const TOKEN_AMOUNT_TO_MINT = hardhatEthers.utils.parseEther('25')

  await tokenContract
    .connect(deployer)
    .mint(accountA.address, TOKEN_AMOUNT_TO_MINT)
  await tokenContract
    .connect(deployer)
    .mint(accountB.address, TOKEN_AMOUNT_TO_MINT)
  await tokenContract
    .connect(deployer)
    .mint(accountC.address, TOKEN_AMOUNT_TO_MINT)

  console.log(
    'new token balance of accountA: ',
    await tokenContract.balanceOf(accountA.address),
  )
  console.log(
    'new token balance of accountB: ',
    await tokenContract.balanceOf(accountB.address),
  )
  console.log(
    'new token balance of accountC: ',
    await tokenContract.balanceOf(accountC.address),
  )

  // - delegating voting power
  console.log('\n')
  console.log('...accountA delegating voting power to self...')
  await tokenContract.connect(accountA).delegate(accountA.address)
  console.log('...accountA delegates...')
  console.log({
    'accountA delegate': await tokenContract.delegates(accountA.address),
    'accountA address': accountA.address,
  })

  console.log('\n')
  console.log('...accountB delegating voting power to accountC...')
  await tokenContract.connect(accountB).delegate(accountC.address)
  console.log('...accountB delegates...')
  console.log({
    'accountB delegate': await tokenContract.delegates(accountB.address),
    'accountC address': accountC.address,
  })

  // - casting votes
  console.log('\n')
  console.log('...accountA is voting...')
  const VOTE_TOKEN_AMOUNT = hardhatEthers.utils.parseEther('15')
  const voteTxn = await tokenizedBallotContract
    .connect(accountA)
    .vote(1, VOTE_TOKEN_AMOUNT)
  voteTxn.wait()

  console.log(
    'Proposal 1 voteCount:',
    (await tokenizedBallotContract.proposals(0)).voteCount,
  )
  console.log(
    'Proposal 2 voteCount:',
    (await tokenizedBallotContract.proposals(1)).voteCount,
  )
  console.log(
    'Proposal 3 voteCount:',
    (await tokenizedBallotContract.proposals(2)).voteCount,
  )

  // - checking vote power
  console.log('\n')
  console.log('...getting accountAs voting power...')
  console.log(
    'accountA voting power: ',
    await tokenizedBallotContract.votingPower(accountA.address),
  )

  // - querying results
  console.log('\n')
  console.log('...getting voting winner...')
  console.log(
    hardhatEthers.utils.parseBytes32String(
      await tokenizedBallotContract.winnerName(),
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
