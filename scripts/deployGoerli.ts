import { ethers } from 'ethers'
import convertStringArrayToBytes32 from '../scripts/helpers/convertStringArrayToBytes32'

import dotenv from 'dotenv'
dotenv.config()

import PROPOSALS from '../scripts/data/ballotProposals'
import { G11Token__factory, TokenizedBallot__factory } from '../typechain-types'

export async function validateGoerliMetaMaskBalance() {
  console.log(
    'Validating Metamask wallet balance for Goerli transactions! ==================',
  )
  // setup provider
  const provider = new ethers.providers.AlchemyProvider(
    'goerli',
    `${process.env.ALCHEMY_API_KEY}`,
  )
  // connect wallet to provider to get signer
  const wallet = new ethers.Wallet(`${process.env.GOERLI_PRIVATE_KEY}`)
  const signer = wallet.connect(provider)

  // verify balance for deployment
  const balanceBN = await signer.getBalance()
  const balance = Number(ethers.utils.formatEther(balanceBN))
  console.log('Balance details: ', balanceBN, balance)

  if (balance < 0.01) return false
  return true
}

async function main() {
  console.log('\n')

  /* GOERLI DEPLOYMENT OF TOKENIZED BALLOT CONTRACT */
  try {
    // deploy token contract
    console.log('\n')
    console.log(
      'Attempt Token Contract Deployment: ===============================',
    )

    if (await validateGoerliMetaMaskBalance()) {
      // setup provider
      const provider = new ethers.providers.AlchemyProvider(
        'goerli',
        `${process.env.ALCHEMY_API_KEY}`,
      )

      // connect wallet to provider to get signer
      const wallet = new ethers.Wallet(`${process.env.GOERLI_PRIVATE_KEY}`)
      const signer = wallet.connect(provider)

      // deploy token contract
      const tokenContractFactory = new G11Token__factory(signer)
      const tokenContract = await tokenContractFactory.deploy()
      console.log('\n')
      console.log(
        'Success ✅ \n G11Token deployment address: ',
        tokenContract.address,
      )

      // get current block
      const currentBlock = await provider.getBlock('latest')

      // deploy tokenized ballot contract
      if (await validateGoerliMetaMaskBalance()) {
        // deploy tokenized-ballot contract
        console.log('\n')
        console.log(
          'Attempt Tokenized Ballot Contract Deployment: ===============================',
        )
        const tokenizedBallotContractFactory = new TokenizedBallot__factory(
          signer,
        )
        const tokenizedBallotContract = await tokenizedBallotContractFactory.deploy(
          convertStringArrayToBytes32(PROPOSALS),
          tokenContract.address,
          currentBlock.number,
        )

        await tokenizedBallotContract.deployed()

        console.log('\n')
        console.log(
          'Success ✅ \n G11Token deployment address: ',
          tokenizedBallotContract.address,
        )
      }
    } else {
      throw new Error('Not enough balance')
    }
  } catch (error) {
    console.log(error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
