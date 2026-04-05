

const checkHealth = async (req, res) => {
    res.send({
        status: "success",
        message: "Server is running"
    })
}

export {
    checkHealth
}
