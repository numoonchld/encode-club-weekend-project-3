import { ethers } from 'ethers'
import convertStringArrayToBytes32 from '../scripts/helpers/convertStringArrayToBytes32'

import dotenv from 'dotenv'
dotenv.config()

export async function validateGoerliMetaMaskBalance() {
  console.log(
    'Validating Metamask wallet balance for Goerli transactions! ==================',
  )
  // setup provider
  const provider = new ethers.providers.AlchemyProvider(
    'goerli',
    `${process.env.ALCHEMY_API_KEY}`,
  )
  // const wallet = ethers.Wallet.createRandom()
  const wallet = new ethers.Wallet(`${process.env.GOERLI_PRIVATE_KEY}`)
  const signer = wallet.connect(provider)

  // verify balance for deployment
  const balanceBN = await signer.getBalance()
  const balance = Number(ethers.utils.formatEther(balanceBN))
  console.log(balanceBN, balance)

  if (balance < 0.01) return false
  return true
}

import PROPOSALS from '../scripts/data/ballotProposals'
import { TokenizedBallot__factory, G11Token__factory } from '../typechain-types'
TokenizedBallot__factory

async function main() {
  console.log('\n')

  /* GOERLI DEPLOYMENT OF TOKENIZED BALLOT CONTRACT */
  try {
    // deploy contracts
    console.log('\n')
    console.log('Deploy Contract: ===============================')

    // setup provider
    const provider = new ethers.providers.AlchemyProvider(
      'goerli',
      `${process.env.ALCHEMY_API_KEY}`,
    )

    // setup wallet and connect to provider as signer
    const wallet = new ethers.Wallet(`${process.env.GOERLI_PRIVATE_KEY}`)
    const signer = wallet.connect(provider)

    // verify balance for deployment
    const balanceBN = await signer.getBalance()
    const balance = Number(ethers.utils.formatEther(balanceBN))
    console.log(balanceBN, balance)

    if (balance < 0.01) {
      throw new Error('Not enough balance')
    } else {
      const tokenContractFactory = new G11Token__factory(signer)
      const tokenContract = await tokenContractFactory.deploy()
      const currentBlock = await provider.getBlock('latest')

      const tokenizedBallotContractFactory = new TokenizedBallot__factory(
        signer,
      )
      const tokenizedBallotContract = await tokenizedBallotContractFactory.deploy(
        convertStringArrayToBytes32(PROPOSALS),
        tokenContract.address,
        currentBlock.number,
      )
      await tokenizedBallotContract.deployed()

      console.log({ tokenContract, tokenizedBallotContract, wallet, signer })
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
