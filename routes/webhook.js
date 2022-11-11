const express = require("express");
const router = express.Router();

//controller
const { paystackWebhook } = require("../controllers/webhook");

//middlewares
const { checkAuth } = require("../middlewares/auth");

router.post("/paystack/webhook", paystackWebhook);

module.exports = router;
