require("dotenv").config()
const express = require("express")
const cors = require("cors")

const app = express()

const connectDB = require("./config/db")
connectDB()

app.use(cors({
  origin: [
    'https://secure-vault-sepia-ten.vercel.app',  // ← removed trailing slash
    'http://localhost:5173'
  ],
  credentials: true
}))

app.use(express.json())

app.use("/api/auth", require("./routes/auth"))
app.use("/api/files", require("./routes/files"))

app.get("/", (req, res) => res.send("API running"))

const PORT = process.env.PORT || 5000  // ← use Railway's PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))