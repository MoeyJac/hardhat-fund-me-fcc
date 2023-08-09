const { deployments, ethers, network, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.parseUnits(".05", "ether")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              const fundMeContract = await deployments.get("FundMe")
              fundMe = await ethers.getContractAt(
                  fundMeContract.abi,
                  fundMeContract.address
              )
          })

          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.target
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
