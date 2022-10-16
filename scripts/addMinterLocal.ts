import { ethers } from 'ethers'
import { ethers as hardhatEthers } from 'hardhat'

async function main() {
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

  // give minting rights to another account
  const accounts = await hardhatEthers.getSigners()
  const newMinter = accounts[7]
  const deployer = accounts[0]
  const voterA = accounts[1]

  const MINTER_ROLE = 'MINTER_ROLE'
  const MINTER_ROLE_KECCAK = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(MINTER_ROLE),
  )

  // assign newMinter role to non-deployer account
  console.log('\n')
  console.log('...get current roles for newMinter, a non-deployer account...')
  console.log(
    await tokenContract.hasRole(MINTER_ROLE_KECCAK, newMinter.address),
  )

  console.log('\n')
  console.log('...assign newMinter role to non-deployer account...')
  await tokenContract
    .connect(deployer)
    .grantRole(MINTER_ROLE_KECCAK, newMinter.address)

  console.log('\n')
  console.log('...get current roles for newMinter, a non-deployer account...')
  console.log(
    await tokenContract.hasRole(MINTER_ROLE_KECCAK, newMinter.address),
  )

  // validate minting abilities of newMinter
  console.log('\n')
  console.log('...current token balance for voterA...')
  console.log(await tokenContract.balanceOf(voterA.address))

  const TOKEN_AMOUNT_TO_MINT = hardhatEthers.utils.parseEther('25')

  console.log('\n')
  console.log('...newMinter minting tokens for voterA...')
  await tokenContract
    .connect(newMinter)
    .mint(voterA.address, TOKEN_AMOUNT_TO_MINT)

  console.log('\n')
  console.log('...new token balance for voterA...')
  console.log(await tokenContract.balanceOf(voterA.address))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
