import { useEffect, useState } from "react"
import axios from "axios"
import "./dashboard.css"

const API = "secure-vault-production-1159.up.railway.app"

export default function Dashboard({ token, logout }) {

  const [files, setFiles] = useState([])

  // Load files
  const loadFiles = async () => {
    try {
      const res = await axios.get(`${API}/api/files/list`, {
        headers: { Authorization: token }
      })
      setFiles(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  // Upload handler
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    try {
      const form = new FormData()
      form.append("file", selectedFile)

      await axios.post(`${API}/api/files/upload`, form, {
        headers: { Authorization: token }
      })

      loadFiles()
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    }
  }

  // Download handler
  const download = async (id, filename) => {
    try {
      const response = await axios.get(`${API}/api/files/download/${id}`, {
        headers: { Authorization: token },
        responseType: "blob"
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
    } catch (err) {
      console.error(err)
      alert("Download failed")
    }
  }

  // Delete handler
  const deleteFile = async (id) => {
    try {
      await axios.delete(`${API}/api/files/delete/${id}`, {
        headers: { Authorization: token }
      })
      loadFiles()
    } catch (err) {
      console.error(err)
      alert("Delete failed")
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const formatType = (type) => {
    if (!type) return "FILE"

    if (type.includes("pdf")) return "PDF"
    if (type.includes("image")) return "IMAGE"
    if (type.includes("word")) return "DOC"
    if (type.includes("excel")) return "XLS"
    if (type.includes("text")) return "TXT"

    return type.split("/")[1]?.toUpperCase()
  }
  return (
    <div className="dash-layout">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>CloudVault</h2>

        <nav>
          <p className="active">File Manager</p>
          <p>Access Control</p>
          <p>Versioning</p>
          <p>Backup</p>
        </nav>

        <button className="logout" onClick={logout}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="main">

        {/* TOP BAR */}
        <div className="topbar">
          <div>
            <h1>File Manager</h1>
            <p>Upload, download, and manage your files securely.</p>
          </div>

          <div className="upload">
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            <button onClick={() => document.getElementById("fileInput").click()}>
              Upload File
            </button>
          </div>
        </div>

        {/* FILE TABLE */}
        <div className="table">

          <div className="table-header">
            <span>Name</span>
            <span>Version</span>
            <span>Uploaded</span>
            <span>Action</span>
          </div>

          {files.length === 0 ? (
            <div className="row">
              <span>No files uploaded</span>
              <span>-</span>
              <span>-</span>
              <span>-</span>
            </div>
          ) : (
            files.map(file => (
              <div key={file._id} className="row">

                <span className="type-badge">
                  {formatType(file.type)}
                </span>

                <span className="badge">
                  v{file.version}
                </span>

                <span>
                  {new Date(file.uploadedAt).toLocaleString()}
                </span>

                <div className="actions">
                  <button onClick={() => download(file._id, file.filename)}>
                    Download
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteFile(file._id)}
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  )
}