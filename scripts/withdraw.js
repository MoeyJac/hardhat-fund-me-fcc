const { deployments, ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()

    const fundMeContract = await deployments.get("FundMe")
    const fundMe = await ethers.getContractAt(
        fundMeContract.abi,
        fundMeContract.address
    )

    console.log("Withdrawing...")

    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Funds Withdrawn!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
