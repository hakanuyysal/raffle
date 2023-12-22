const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const raffleEntryRoute = require("./routes/raffleEntry");
const cors = require("cors");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Db connection successfull"))
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use("/api/raffleEntry", raffleEntryRoute);

app.listen(process.env.PORT || 5000, () => {
  console.log("Backend server is running");
});
