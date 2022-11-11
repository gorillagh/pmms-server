const Pocket = require("../models/Pocket");
const User = require("../models/User");
const UserPocketGroup = require("../models/UserPocketGroup");
const slugify = require("slugify");
const UserActivity = require("../models/UserActivity");
const currency = require("currency.js");
const https = require("https");
const axios = require("axios");

exports.create = async (req, res) => {
  try {
    const { title, percentage, userClass, icon, color, description, subs } =
      await req.body;
    const slug = slugify(title).toLowerCase();
    const newPocket = await new Pocket({
      title,
      slug,
      percentage,
      userClass,
      icon,
      color,
      description,
      subs,
    }).save();
    res.json(newPocket);
  } catch (error) {
    console.log(error.code);
    if (error.code === 11000) {
      res.json({ error: { message: "Title already used" } });
    } else {
      res.json({ error: { message: error.message } });
    }
  }
};

exports.list = async (req, res) => {
  try {
    const pockets = await Pocket.find({}).sort({ createdAt: -1 }).exec();
    res.json(pockets);
  } catch (error) {
    res.status(403).json({ error: { message: "Failed to retrieve pockets" } });
  }
};

exports.read = (req, res) => {
  //
};

exports.update = (req, res) => {
  //
};

exports.remove = (req, res) => {
  //
};

exports.userPocktets = async (req, res) => {
  const { slug } = req.params;
  try {
    const userPockets = await UserPocketGroup.findOne({ userId: slug }).exec();
    res.json(userPockets);
  } catch (error) {
    res
      .status(403)
      .json({ error: { message: "Failed to retrieve user pockets" } });
  }
};

exports.getUserPocket = async (req, res) => {
  const { id } = req.params;
  const { slug } = req.body;

  try {
    const userPockets = await UserPocketGroup.findOne({ userId: id }).exec();
    userPockets.pockets.some((pocket) => {
      if (pocket.slug === slug) res.json(pocket);
    });
  } catch (error) {
    res
      .status(403)
      .json({ error: { message: "Failed to retrieve user pocket" } });
  }
};

exports.editPocket = async (req, res) => {
  const { id, slug } = req.params;
  const update = req.body;
  if (update.title) update.slug = slugify(update.title).toLowerCase();
  try {
    const userPockets = await UserPocketGroup.findOne({ userId: id }).exec();
    if (update.percentage) {
      update.percentage = currency(update.percentage).value;
      let unallocatedPercentage;
      let valueChange;
      userPockets.pockets.some((pocket) => {
        if (pocket.slug === "unallocated")
          unallocatedPercentage = pocket.percentage;
      });
      userPockets.pockets.some((pocket) => {
        if (pocket.slug === slug)
          valueChange = update.percentage - pocket.percentage;
      });
      if (
        currency(valueChange).value <= currency(unallocatedPercentage).value
      ) {
        userPockets.pockets.some((pocket) => {
          if (pocket.slug === "unallocated")
            pocket.percentage = currency(
              unallocatedPercentage - valueChange
            ).value;
        });
      }
      await UserPocketGroup.findOneAndUpdate(
        { userId: id },
        { pockets: userPockets.pockets },
        { new: true }
      ).exec();

      console.log("New unallocated---->", unallocatedPercentage);
    }

    await userPockets.pockets.some((p) => {
      if (p.slug === slug) {
        const p1 = { ...p._doc, ...update };
        p._doc = p1;
      }
    });
    const updatedPocketGroup = await UserPocketGroup.findOneAndUpdate(
      { userId: id },
      { pockets: userPockets.pockets },
      { new: true }
    ).exec();
    if (update.title) {
      const userActivities = await UserActivity.findOne({ userId: id }).exec();
      console.log("useractivities---->", slug, update.slug);
      await userActivities.events.map((e) => {
        if (e.pocket === slug) e.pocket = update.slug;
      });
      await userActivities.transactions.map((t) => {
        if (t.pocket === slug) t.pocket = update.slug;
      });

      await UserActivity.findOneAndUpdate(
        { userId: id },
        {
          events: userActivities.event,
          transactions: userActivities.transactions,
        }
      ).exec();
    }
    res.json(updatedPocketGroup);
  } catch (error) {
    console.log(error);
    res.status(403).json({ error: { message: "Failed to update pocket" } });
  }
};

exports.deletePocket = async (req, res) => {
  try {
    const { id, slug } = req.params;
    const userPockets = await UserPocketGroup.findOne({ userId: id }).exec();
    let pocketAmount;
    let pocketPercentage;
    let title;
    //Get the pocket amount and percentage
    await userPockets.pockets.some((p) => {
      if (p.slug === slug) {
        pocketAmount = currency(p.amount).value;
        pocketPercentage = currency(p.percentage).value;
        title = p.title;
      }
    });
    //Add percentage and money to unallocated
    await userPockets.pockets.some((p) => {
      if (p.slug === "unallocated") {
        p.amount = currency(p.amount + pocketAmount).value;
        p.percentage = currency(p.percentage + pocketPercentage).value;
      }
    });
    //Delete the pocket
    await userPockets.pockets.some((p, i) => {
      if (p.slug === slug) {
        userPockets.pockets.splice(i, 1);
      }
    });

    const userActivities = await UserActivity.findOne({ userId: id }).exec();
    //Delete pocket events
    await userActivities.events.map((e, i) => {
      if (e.pocket === slug) {
        userActivities.events.splice(i, 1);
      }
    });
    //Delete Pocket activities
    await userActivities.transactions.map((t, i) => {
      if (t.pocket === slug) {
        userActivities.transactions.splice(i, 1);
      }
    });
    //Add delete event
    await userActivities.events.push({
      activityType: "pocket deleted",
      details: `You deleted ${title} pocket`,
      status: "success",
    });
    await UserActivity.findOneAndUpdate(
      { userId: id },
      {
        events: userActivities.events,
        transactions: userActivities.transactions,
      },
      { new: true }
    ).exec();

    const updatedPocketGroup = await UserPocketGroup.findOneAndUpdate(
      { userId: id },
      { pockets: userPockets.pockets },
      { new: true }
    ).exec();

    res.json(updatedPocketGroup);
  } catch (error) {
    console.log(error);
    res.status(403).json({ error: { message: "Failed to delete pocket" } });
  }
};

exports.getPocketActivities = async (req, res) => {
  const { id } = req.params;
  const { slug } = req.body;

  try {
    const userActivities = await UserActivity.findOne({ userId: id }).exec();
    // console.log("Activities---->", userActivities);
    let activities = [];
    await userActivities.events.map((e) => {
      if (e.pocket === slug) activities.push(e);
      // console.log(e.pocket);
    });
    await userActivities.transactions.map((p) => {
      if (p.pocket === slug) activities.push(p);
    });

    res.json(activities);
  } catch (error) {
    res
      .status(403)
      .json({ error: { message: "Failed to retrieve pocket activities" } });
  }
};

exports.createUserPocket = async (req, res) => {
  try {
    const pocket = await req.body;
    // pocket.percentage = pocket.percentage.toFixed(2);
    console.log("Pocket----->>>>", pocket);
    const { id } = await req.params;
    pocket.slug = slugify(pocket.title).toLowerCase();
    pocket.amount = currency(0.0).value;
    pocket.percentage = currency(pocket.percentage).value;

    const matchPocket = await UserPocketGroup.findOne({
      userId: id,
    }).exec();

    if (matchPocket.pockets.some((p) => p.slug === pocket.slug)) {
      res.json({
        error: {
          message: `"${pocket.title}" already exists in your collection`,
        },
      });
      return;
    }

    const unallocated = await matchPocket.pockets.find(
      (p) => p.slug === "unallocated"
    );
    //Check if percentage is not more than unallocated
    if (unallocated.percentage < pocket.percentage) {
      res.json({
        error: {
          message: `Make sure to set the right percentage`,
        },
      });
      return;
    }

    //Update Unallocated

    await UserPocketGroup.updateOne(
      { userId: id },
      {
        $set: {
          "pockets.$[elemX].percentage": currency(
            unallocated.percentage - pocket.percentage
          ).value,

          // Number(unallocated.percentage) - Number(pocket.percentage),
        },
      },
      { arrayFilters: [{ "elemX.slug": "unallocated" }] }
    ).exec();

    const updatedPocketGroup = await UserPocketGroup.findOneAndUpdate(
      { userId: id },
      {
        $push: {
          pockets: pocket,
        },
      },
      { new: true }
    ).exec();
    await UserActivity.findOneAndUpdate(
      { userId: id },
      {
        $push: {
          events: {
            pocket: pocket.slug,
            activityType: "pocket created",
            details: `You created ${pocket.title} pocket`,
            status: "success",
          },
        },
      },
      { new: true }
    ).exec();

    res.json(updatedPocketGroup);
  } catch (error) {
    console.log(error);
    res.json({ error: { message: error.message } });
  }
};

exports.addMoney = async (req, res) => {
  try {
    const transaction = await req.body;

    const verifiedTransaction = await axios.get(
      `https://api.paystack.co/transaction/verify/${transaction.response.reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACk_TEST_SECRET_KEY}`,
        },
      }
    );

    console.log("Transaction verification---->", verifiedTransaction.data);

    if (
      verifiedTransaction &&
      verifiedTransaction.data.data.status === "success"
    ) {
      transaction.amount = currency(
        verifiedTransaction.data.data.amount / 100
      ).value;
      const { id } = await req.params;
      const userPockets = await UserPocketGroup.findOne({
        userId: id,
      }).exec();
      const userActivities = await UserActivity.findOne({
        userId: id,
      }).exec();

      if (transaction.destination === "spread") {
        await userPockets.pockets.map((p) => {
          if (p.amount) {
            p.amount = currency(
              p.amount + (p.percentage / 100) * transaction.amount
            ).value;
          } else {
            p.amount = currency(
              (p.percentage / 100) * transaction.amount
            ).value;
          }
          userActivities.transactions.push({
            reference: verifiedTransaction.data.data.reference,
            id: verifiedTransaction.data.data.id,
            pocket: p.slug,
            activityType: "money added",
            details: `You added GHS ${
              currency((p.percentage / 100) * transaction.amount).value
            } to your ${p.title} pocket`,
            status: "success",
          });
        });
        // userActivities.transactions.push({
        //   activityType: "money added",
        //   details: `You added GHS ${transaction.amount} to be spread on all pockets`,
        //   status: "success",
        // });
      } else {
        await userPockets.pockets.some((p) => {
          if (transaction.destination === p.slug) {
            if (p.amount) {
              p.amount = currency(p.amount + transaction.amount).value;
            } else {
              p.amount = transaction.amount;
            }
            userActivities.transactions.push({
              reference: verifiedTransaction.data.data.reference,
              id: verifiedTransaction.data.data.id,
              pocket: p.slug,
              activityType: "money added",
              details: `You added GHS ${transaction.amount} to your "${p.title}" pocket`,
              status: "success",
            });
          }
        });
      }
      const updatedPocketGroup = await UserPocketGroup.findOneAndUpdate(
        { userId: id },
        { pockets: userPockets.pockets },
        { new: true }
      ).exec();
      res.json(updatedPocketGroup);
      await UserActivity.findOneAndUpdate(
        { userId: id },
        {
          events: userActivities.events,
          transactions: userActivities.transactions,
        },
        { new: true }
      ).exec();
    }
  } catch (error) {
    console.log(error);
    res.json({ error: { message: error.message } });
  }
};

exports.cashout = async (req, res) => {
  try {
    const transaction = await req.body;
    transaction.amount = currency(transaction.amount).value;
    const { id } = await req.params;
    const userPockets = await UserPocketGroup.findOne({
      userId: id,
    }).exec();
    const userActivities = await UserActivity.findOne({
      userId: id,
    }).exec();

    ////////Deduct amount from user pocket/////////////////
    await userPockets.pockets.some((p) => {
      if (transaction.pocket === p.slug) {
        if (p.amount && p.amount >= transaction.amount) {
          p.amount = currency(p.amount - transaction.amount).value;
          console.log("remainder=====>", p.amount);
          userActivities.transactions.push({
            pocket: p.slug,
            activityType: "cashout",
            details: `You removed GHS ${transaction.amount} from your "${p.title}" pocket`,
            status: "success",
          });
          UserActivity.findOneAndUpdate(
            { userId: id },
            {
              transactions: userActivities.transactions,
            },
            { new: true }
          ).exec();
        } else {
          res.json({
            error: {
              message: `Make sure the amount is less than what is in the pocket`,
            },
          });
          return;
        }
      }
    }); ////////////////////////////

    //////Transfer to PMMS User///////////////
    if (transaction.recipient[0] === 1) {
      const PMMSUser = await User.findOne({
        email: transaction.recipient[1],
      }).exec();

      const recipientPockets = await UserPocketGroup.findOne({
        userId: PMMSUser._id,
      }).exec();
      console.log("Recipient pockets------>", recipientPockets);
      recipientPockets.pockets.some((p) => {
        if (p.slug === "unallocated") {
          if (p.amount) {
            p.amount = currency(p.amount + transaction.amount).value;
          } else {
            p.amount = currency(transaction.amount).value;
          }
        }
      });
      await UserPocketGroup.findOneAndUpdate(
        { userId: PMMSUser._id },
        { pockets: recipientPockets.pockets },
        { new: true }
      ).exec();
    } /////////////////////////////////////////////

    const updatedPocketGroup = await UserPocketGroup.findOneAndUpdate(
      { userId: id },
      { pockets: userPockets.pockets },
      { new: true }
    ).exec();
    res.json(updatedPocketGroup);
  } catch (error) {
    console.log(error);
    res.json({ error: { message: error.message } });
  }
};

/////Pocket to Pocket Transfer///////////
exports.p2pTransfer = async (req, res) => {
  try {
    const transaction = await req.body;
    transaction.amount = currency(transaction.amount).value;
    const { id } = await req.params;
    const userPockets = await UserPocketGroup.findOne({
      userId: id,
    }).exec();
    const userActivities = await UserActivity.findOne({
      userId: id,
    }).exec();

    await userPockets.pockets.some((p) => {
      if (transaction.pocket.slug === p.slug) {
        if (p.amount && p.amount >= transaction.amount) {
          p.amount = currency(p.amount - transaction.amount).value;
          console.log("remainder=====>", p.amount);
          userActivities.transactions.push({
            pocket: p.slug,
            activityType: "pocket to pocket transfer",
            details: `You transfered GHS ${transaction.amount} from "${p.title}" pocket to "${transaction.recipient.title}" pocket`,
            status: "success",
          });
          UserActivity.findOneAndUpdate(
            { userId: id },
            {
              transactions: userActivities.transactions,
            },
            { new: true }
          ).exec();
        } else {
          res.json({
            error: {
              message: `Make sure the amount is less than what is in the pocket`,
            },
          });
          return;
        }
      }
    });
    await userPockets.pockets.some((p) => {
      if (
        transaction.recipient.slug === p.slug &&
        transaction.recipient.slug !== transaction.pocket.slug
      ) {
        if (p.amount) {
          p.amount = currency(p.amount + transaction.amount).value;
        } else {
          p.amount = transaction.amount;
        }
        userActivities.transactions.push({
          pocket: p.slug,
          activityType: "pocket to pocket transfer",
          details: `"${p.title}" pocket received GHS ${transaction.amount} from "${transaction.pocket.title}" pocket`,
          status: "success",
        });
        UserActivity.findOneAndUpdate(
          { userId: id },
          {
            transactions: userActivities.transactions,
          },
          { new: true }
        ).exec();
      }
    });

    const updatedPocketGroup = await UserPocketGroup.findOneAndUpdate(
      { userId: id },
      { pockets: userPockets.pockets },
      { new: true }
    ).exec();
    res.json(updatedPocketGroup);
  } catch (error) {
    console.log(error);
    res.json({ error: { message: error.message } });
  }
};
