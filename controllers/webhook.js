const User = require("../models/User");
const UserPocketGroup = require("../models/UserPocketGroup");
const UserActivity = require("../models/UserActivity");
const crypto = require("crypto");
const currency = require("currency.js");

exports.paystackWebhook = async (req, res) => {
  try {
    //Validate event
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (hash == req.headers["x-paystack-signature"]) {
      // Retrieve the request's body
      const event = req.body;
      if (event.event === "charge.success") {
        const transactionExists = await UserActivity.find({
          transactions: {
            $elemMatch: { reference: event.data.reference, id: event.data.id },
          },
        }).exec();

        if (transactionExists) {
          console.log(
            "Transaction Exists(from webhook)-------->",
            transactionExists
          );
          res.json({ ok: true, newTransaction: transactionExists });
        }
        if (!transactionExists) {
          const user = await User.findOne({ email: event.data.customer.email });
          const userPockets = await UserPocketGroup.findOne({
            userId: user,
          }).exec();
          const userActivities = await UserActivity.findOne({
            userId: user,
          }).exec();

          const transactionAmount = currency(event.data.amount / 100).value;

          if (event.data.metadata.name === "spread") {
            await userPockets.pockets.map((p) => {
              if (p.amount) {
                p.amount = currency(
                  p.amount + (p.percentage / 100) * transactionAmount
                ).value;
              } else {
                p.amount = currency(
                  (p.percentage / 100) * transactionAmount
                ).value;
              }
              userActivities.transactions.push({
                reference: event.data.reference,
                id: event.data.id,
                pocket: p.slug,
                activityType: "money added",
                details: `You added GHS ${
                  currency((p.percentage / 100) * transactionAmount).value
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
              if (event.data.metadata.referrer === p.slug) {
                if (p.amount) {
                  p.amount = currency(p.amount + transactionAmount).value;
                } else {
                  p.amount = transactionAmount;
                }
                userActivities.transactions.push({
                  reference: event.data.reference,
                  id: event.data.id,
                  pocket: p.slug,
                  activityType: "money added",
                  details: `You added GHS ${transactionAmount} to your "${p.title}" pocket`,
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

          console.log("Stack ORDER SAVED----->>", newOrder);
          res.send(200);
        } else {
          res.json({ ok: false });
        }
      } else {
        res.json({ ok: false });
      }
    } else {
      res.json({ ok: false });
    }
  } catch (error) {
    console.log(error);
  }
};
