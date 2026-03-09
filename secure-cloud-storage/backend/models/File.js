const mongoose = require("mongoose")

const FileSchema = new mongoose.Schema({
 userId: String,
 filename: String,
 version: Number,
 s3Key: String,
 uploadedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("File", FileSchema)