import { ethers } from 'ethers'
import * as G11TokenJSON from '../artifacts/contracts/G11Token.sol/G11Token.json'

import dotenv from 'dotenv'
dotenv.config()

async function main() {
  // 1. load contract deploying wallet

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
  console.log('Deployer balance details: ', balanceBN, balance)

  if (balance < 0.01) throw new Error('Not enough balance!')

  const MINTER_ROLE = 'MINTER_ROLE'
  const MINTER_ROLE_KECCAK = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(MINTER_ROLE),
  )

  // 2. connect to contract on goerli testnet
  const goerliTokenContract = new ethers.Contract(
    '0xac23614eA08907b5E33C7174a996d560cEb386E7',
    G11TokenJSON.abi,
    signer,
  )

  // 3. load new minter address
  const newGoerliMinter = '0x1FF078FB092C17E07695f9B8899996aFfEa33613'

  console.log('\n')
  console.log('...get current roles for newMinter, a non-deployer account...')

  const isNewMinterAlreadyMinter = await goerliTokenContract.hasRole(
    MINTER_ROLE_KECCAK,
    newGoerliMinter,
  )
  console.log({ newGoerliMinter, isNewMinterAlreadyMinter })

  // 4. assign minting function to new minter
  if (!isNewMinterAlreadyMinter) {
    const grantRoleTxn = await goerliTokenContract
      .connect(signer)
      .grantRole(MINTER_ROLE_KECCAK, newGoerliMinter)

    grantRoleTxn.wait()

    // 5. check role
    const isNewMinterNowMinter = await goerliTokenContract.hasRole(
      MINTER_ROLE_KECCAK,
      newGoerliMinter,
    )
    console.log({ newGoerliMinter, isNewMinterNowMinter })

    if (isNewMinterNowMinter) {
      console.log(
        `✅ New minter role successfully assigned to ${newGoerliMinter}!`,
      )
    } else {
      console.log(`X---X Unaccomplished X---X`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
