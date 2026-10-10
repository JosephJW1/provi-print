const express = require("express")
const router = express.Router()
const { Towns } = require("../models")

router.get("/", async (req, res) => {
    const listOfTowns = await Towns.findAll();
    res.json(listOfTowns)
})

module.exports = router