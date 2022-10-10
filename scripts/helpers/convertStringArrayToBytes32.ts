import { ethers } from 'hardhat'

function convertStringArrayToBytes32(array: string[]) {
  return array.map((string) => ethers.utils.formatBytes32String(string))
}

export default convertStringArrayToBytes32
