import { expect } from 'chai'
import { ethers } from 'hardhat'
import { G11Token } from '../typechain-types'
import { token } from '../typechain-types/@openzeppelin/contracts'

describe('G11Token', function () {
  let tokenContract: G11Token

  beforeEach(async function () {
    const tokenContractFactory = await ethers.getContractFactory('G11Token')
    tokenContract = await tokenContractFactory.deploy()
    await tokenContract.deployed()
  })

  // verify deployment details
  describe('token contract deployment', () => {
    it('token name checks out', async () => {
      expect(await tokenContract.name()).to.eq('G11Token')
    })
    it('total supply of tokens checks out', async () => {
      const totalTokenSupply = await tokenContract.totalSupply()

      const decimals = await tokenContract.decimals()
      const totalTokenSupply_formatted = ethers.utils.formatUnits(
        totalTokenSupply,
        decimals,
      )
      const tokenSupplyFloat = parseFloat(totalTokenSupply_formatted)

      expect(tokenSupplyFloat).to.eq(1200)
    })
    it('verify access control', async () => {
      const [contractDeployerAccount] = await ethers.getSigners()

      // deployer has default admin role
      expect(
        await tokenContract.hasRole(
          await tokenContract.DEFAULT_ADMIN_ROLE(),
          contractDeployerAccount.address,
        ),
      ).to.be.true

      // deployer has minter role
      expect(
        await tokenContract.hasRole(
          await tokenContract.MINTER_ROLE(),
          contractDeployerAccount.address,
        ),
      ).to.be.true
    })
    it('verify ERC20Permit', async () => {
      const [contractDeployerAccount] = await ethers.getSigners()

      const initialNonceForDeployerAccount = await tokenContract.nonces(
        contractDeployerAccount.address,
      )

      expect(initialNonceForDeployerAccount).to.eq(0)
    })
    it('verify ERC20Votes', async () => {
      const [contractDeployerAccount] = await ethers.getSigners()

      const numCheckpointsForDeployerAccount = await tokenContract.numCheckpoints(
        contractDeployerAccount.address,
      )

      expect(numCheckpointsForDeployerAccount).to.eq(0)
    })
  })

  // give voting tokens
  describe('', () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })

  // mint with minter to mint tokens
  describe('', () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })

  // give roles
  describe('', () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })

  // delegating voting power
  describe('', () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
})
