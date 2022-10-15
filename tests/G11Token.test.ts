import { expect } from 'chai'
import { utils } from 'ethers'
import { ethers } from 'hardhat'
import { G11Token } from '../typechain-types'
import bigNumberDecimalToFloat from '../scripts/helpers/bigNumberDecimalToFloat'

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

      const tokenSupplyFloat = bigNumberDecimalToFloat(
        totalTokenSupply,
        decimals,
      )

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
  describe('token contract deployer gives voting tokens', () => {
    it('to one account', async () => {
      const TRANSFER_TOKEN_UNITS = 25
      const [, account1] = await ethers.getSigners()

      await tokenContract.transfer(account1.address, TRANSFER_TOKEN_UNITS)
      expect(await tokenContract.balanceOf(account1.address)).to.eq(
        TRANSFER_TOKEN_UNITS,
      )
    })
  })

  // mint with minter to mint tokens
  describe('account with minter role can mint tokens', () => {
    it('deployer mints tokens', async () => {
      const decimals = await tokenContract.decimals()
      console.log(decimals)

      const TOKEN_UNITS_TO_MINT = 50

      const [, , account2] = await ethers.getSigners()
      const initialAccountTokenBalance = bigNumberDecimalToFloat(
        await tokenContract.balanceOf(account2.address),
        decimals,
      )
      console.log(initialAccountTokenBalance)

      await tokenContract.mint(
        account2.address,
        ethers.utils.parseEther(`${TOKEN_UNITS_TO_MINT}`),
      )

      const finalAccountTokenBalance = bigNumberDecimalToFloat(
        await tokenContract.balanceOf(account2.address),
        decimals,
      )

      expect(finalAccountTokenBalance).to.eq(
        initialAccountTokenBalance + TOKEN_UNITS_TO_MINT,
      )
    })
  })

  // give roles
  describe('give roles to accounts', () => {
    it('give minter role to account 5', async () => {
      const accounts = await ethers.getSigners()
      const newMinterToBe = accounts[4]

      // ethers keccak256: https://docs.ethers.io/v5/api/utils/hashing/
      const MINTER_ROLE = ethers.utils.keccak256(
        utils.toUtf8Bytes('MINTER_ROLE'),
      )

      expect(await tokenContract.hasRole(MINTER_ROLE, newMinterToBe.address)).to
        .be.false
      await tokenContract.grantRole(MINTER_ROLE, newMinterToBe.address)
      expect(await tokenContract.hasRole(MINTER_ROLE, newMinterToBe.address)).to
        .be.true
    })
  })

  // delegating voting power
  describe('delegate voting power between accounts', () => {
    it('self-delegation', async () => {
      const accounts = await ethers.getSigners()
      const accountA = accounts[3]

      const accountADelegatesBefore = await tokenContract.delegates(
        accountA.address,
      )
      expect(accountADelegatesBefore).to.eq(ethers.constants.AddressZero)

      await tokenContract.connect(accountA).delegate(accountA.address)
      const accountADelegatesAfter = await tokenContract.delegates(
        accountA.address,
      )
      expect(accountADelegatesAfter).to.eq(accountA.address)
    })
    it('delegate voting power from one account to another', async () => {
      const accounts = await ethers.getSigners()
      const accountA = accounts[3]
      const accountB = accounts[4]

      const accountADelegatesBefore = await tokenContract.delegates(
        accountA.address,
      )
      expect(accountADelegatesBefore).to.eq(ethers.constants.AddressZero)

      await tokenContract.connect(accountA).delegate(accountB.address)
      const accountADelegatesAfter = await tokenContract.delegates(
        accountA.address,
      )
      expect(accountADelegatesAfter).to.eq(accountB.address)
    })
  })
})
