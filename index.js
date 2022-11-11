const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const { readdirSync } = require("fs");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");

//App
const app = express();
const port = process.env.PORT || 8000;

//Connect to db
mongoose
  .connect(process.env.DATABASE, {
    keepAlive: true,
  })
  .then(() => {
    console.log("Db Connection Succesful");
  })
  .catch((error) =>
    console.log(`Connection Error! ${error.message}, Error Code: ${error.code}`)
  );

//Middlewares
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json({ limit: "2mb" })); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

//Routes Middleware
readdirSync("./routes").map((r) => app.use("/api", require("./routes/" + r)));

app.listen(port, () => {
  console.log(`PMMS server is running at http://localhost:${port}`);
});
