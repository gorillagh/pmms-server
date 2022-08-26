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
  userPocktets,
  createUserPocket,
  addMoney,
  cashout,
  p2pTransfer,
  getUserPocket,
  getPocketActivities,
  editPocket,
  deletePocket,
} = require("../controllers/pocket");

router.post("/pocket", authCheck, adminCheck, create);
router.get("/pockets", authCheck, list);
router.get("/pocket/:slug", authCheck, adminCheck, read);
router.put("/pocket/:slug", authCheck, adminCheck, update);
router.delete("/pocket/:slug", authCheck, adminCheck, remove);

router.post("/user-pockets/:slug", authCheck, userPocktets);
router.post("/get-user-pocket/:id", authCheck, getUserPocket);
router.post("/user-pocket/:id", authCheck, createUserPocket);
router.post("/edit-pocket/:id/:slug", authCheck, editPocket);
router.post("/delete-pocket/:id/:slug", authCheck, deletePocket);
router.post("/add-money/:id", authCheck, addMoney);
router.post("/cashout/:id", authCheck, cashout);
router.post("/p2p-transfer/:id", authCheck, p2pTransfer);

router.post("/get-user-pocket-activities/:id", authCheck, getPocketActivities);

module.exports = router;
