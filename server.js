const express = require("express");
const connectDB = require("./config/db");
var cors = require("cors");

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.status(200).send("Orderly API is running");
});

app.use(express.json());
app.use(cors());

app.use("/api/auth", require("./routes/api/auth"));
app.use("api/profile", require("./routes/api/profile"));
app.use("/api/team", require("./routes/api/team"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
