const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.parseUnits("1", "ether")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              fundMe = await deployments.fixture(["all"])

              const fundMeContract = await deployments.get("FundMe")
              const mockV3AggregatorContract = await deployments.get(
                  "MockV3Aggregator"
              )

              fundMe = await ethers.getContractAt(
                  fundMeContract.abi,
                  fundMeContract.address
              )

              mockV3Aggregator = await ethers.getContractAt(
                  mockV3AggregatorContract.abi,
                  mockV3AggregatorContract.address
              )
          })

          describe("constructor", async function () {
              it("Sets  the aggregator function correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })
          describe("fund", async function () {
              it("Fails if not enough ETH sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didnt meet minimum deposit amount"
                  )
              })

              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              const provider = ethers.provider // Can also use fundMe.runner.provider
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("Should withdraw ETH from a single funder to the deployers address", async function () {
                  const startingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const startingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it("Should allow deployer to withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const startingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      )
                  }
              })

              it("Should only allow owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("Cheaper single withdraw...", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const startingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      )
                  }
              })

              it("Cheaper multi withdrawl...", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const startingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance = await provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      )
                  }
              })
          })
      })
