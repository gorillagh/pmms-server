const express = require("express");

const router = express.Router();

//Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

//Controllers
const {
  create,
  read,
  update,
  remove,
  list,
} = require("../controllers/userClass");

//routes
router.post("/userClass", authCheck, adminCheck, create);
router.get("/userClasses", list);
router.get("/userClass/:slug", authCheck, adminCheck, read);
router.put("/userClass/:slug", authCheck, adminCheck, update);
router.delete("/userClass/:slug", authCheck, adminCheck, remove);

module.exports = router;
