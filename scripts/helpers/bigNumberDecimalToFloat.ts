import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'

export default function (bn: BigNumber, dec: number) {
  const bn_formatted = ethers.utils.formatUnits(bn, dec)
  return parseFloat(bn_formatted)
}
