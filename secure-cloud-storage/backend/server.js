require("dotenv").config()
const express = require("express")
const cors = require("cors")

app.use(cors({
  origin: [
    'https://secure-vault-sepia-ten.vercel.app/',  // replace with your real Vercel URL
    'http://localhost:5173'
  ],
  credentials: true
}));

const connectDB = require("./config/db")

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

app.use("/api/auth", require("./routes/auth"))
app.use("/api/files", require("./routes/files"))

app.get("/", (req,res)=> res.send("API running"))

app.listen(5000, ()=> console.log("Server running on port 5000"))