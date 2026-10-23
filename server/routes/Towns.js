const express = require("express");
const router = express.Router();
const { Towns, Design } = require("../models");

router.get("/", async (req, res) => {
  try {
    const listOfTowns = await Towns.findAll({
      include: [
        {
          model: Design,
          attributes: ["id", "title", "description", "image_url", "createdAt", "updatedAt"],
          through: { attributes: [] },
        },
      ],
    });
    res.json(listOfTowns);
  } catch (error) {
    console.error("Error fetching towns:", error);
    res.status(500).json({ error: "Failed to fetch towns" });
  }
});

module.exports = router;
