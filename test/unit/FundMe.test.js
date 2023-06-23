const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.parseUnits("1", "ether")
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
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
            const response = await fundMe.priceFeed()
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
            const response = await fundMe.addressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })

        it("Adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.funders(0)
            assert.equal(funder, deployer)
        })
    })
})
