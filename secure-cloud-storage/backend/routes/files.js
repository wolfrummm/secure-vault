const { PutObjectCommand, CopyObjectCommand } = require("@aws-sdk/client-s3")
const s3 = require("../config/s3")
const { v4: uuidv4 } = require("uuid")
const File = require("../models/File")
const auth = require("../middleware/auth")
const router = require("express").Router()
const multer = require("multer")

const upload = multer({ storage: multer.memoryStorage() })

router.post("/upload", auth, upload.single("file"), async (req,res)=>{
 try{

   const filename = req.file.originalname
   const userId = req.user.id

   // version logic
   const existing = await File.find({ filename, userId }).sort({ version:-1 })
   let version = existing.length > 0 ? existing[0].version + 1 : 1

   const key = `${userId}/${uuidv4()}-${filename}`

   // upload to primary bucket
   await s3.send(new PutObjectCommand({
     Bucket: process.env.PRIMARY_BUCKET,
     Key: key,
     Body: req.file.buffer
   }))

   // replicate to backup bucket
   await s3.send(new CopyObjectCommand({
     Bucket: process.env.BACKUP_BUCKET,
     CopySource: `${process.env.PRIMARY_BUCKET}/${key}`,
     Key: key
   }))

   const newFile = new File({
     userId,
     filename,
     version,
     s3Key: key
   })

   await newFile.save()

   res.json({
     message:"File uploaded to cloud with replication",
     version
   })

 }catch(err){
   console.error(err)
   res.status(500).send(err.message)
 }
})

const { GetObjectCommand } = require("@aws-sdk/client-s3")

router.get("/download/:id", auth, async (req, res) => {
  try {

    const file = await File.findById(req.params.id)
    if (!file) return res.status(404).send("File not found")

    const command = new GetObjectCommand({
      Bucket: process.env.PRIMARY_BUCKET,
      Key: file.s3Key
    })

    const response = await s3.send(command)

    // Important headers
    res.setHeader("Content-Type", response.ContentType)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    )

    response.Body.pipe(res)

  } catch (err) {
    console.error("Download error:", err)
    res.status(500).send("Download failed")
  }
})

router.get("/list", auth, async (req,res)=>{
 try{
   const files = await File.find({ userId: req.user.id })
   res.json(files)
 }catch(err){
   res.status(500).send(err.message)
 }
})

const { DeleteObjectCommand } = require("@aws-sdk/client-s3")

router.delete("/delete/:id", auth, async (req,res)=>{
  try{

    const file = await File.findById(req.params.id)
    if(!file) return res.status(404).send("File not found")

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.PRIMARY_BUCKET,
      Key: file.s3Key
    }))

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.BACKUP_BUCKET,
      Key: file.s3Key
    }))

    await File.findByIdAndDelete(req.params.id)

    res.json({ message: "File deleted successfully" })

  }catch(err){
    console.error(err)
    res.status(500).send("Delete failed")
  }
})
module.exports = router