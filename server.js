const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('public')); // Serves index.html and static files
app.use("/downloads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files
app.use(express.json()); // For parsing JSON bodies
app.use(express.urlencoded({ extended: true }));

// ✅ Upload file with dynamic folder support
app.post('/upload', (req, res) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const folder = req.body.folder || 'default';
            const uploadPath = path.join(__dirname, 'uploads', folder);
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    });

    const upload = multer({ storage }).single('file');

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).send("Upload failed: File too large or invalid.");
        } else if (err) {
            return res.status(500).send("Upload failed: Server error.");
        }
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        console.log("✅ Uploaded to folder:", req.body.folder);
        res.send("File uploaded successfully!");
    });
});

// ✅ Latest 5 files (sorted by modified time) — scan all subfolders
app.get("/latest-files", async (req, res) => {
    const uploadsDir = path.join(__dirname, "uploads");

    function getAllFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push({
                    path: fullPath,
                    name: file,
                    time: fs.statSync(fullPath).mtime
                });
            }
        });
        return arrayOfFiles;
    }

    try {
        const allFiles = getAllFiles(uploadsDir);
        const sorted = allFiles.sort((a, b) => b.time - a.time).slice(0, 5);
        const relativePaths = sorted.map(f => path.relative(uploadsDir, f.path).replace(/\\/g, '/'));
        res.json(relativePaths);
    } catch (err) {
        res.status(500).send("Error reading files.");
    }
});

// ✅ Get all files (from all subfolders)
app.get("/all-files", (req, res) => {
    const uploadsDir = path.join(__dirname, "uploads");

    function getAllFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(path.relative(uploadsDir, fullPath).replace(/\\/g, '/'));
            }
        });
        return arrayOfFiles;
    }

    try {
        const allFiles = getAllFiles(uploadsDir);
        res.json(allFiles);
    } catch (err) {
        res.status(500).send("Error reading files.");
    }
});

// ✅ Delete file or folder
app.delete("/delete/:fileName", (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.params.fileName);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error("Stat error:", err);
            return res.status(500).send("Error checking file.");
        }

        if (stats.isDirectory()) {
            fs.rm(filePath, { recursive: true, force: true }, (err) => {
                if (err) {
                    console.error("Failed to delete folder:", err);
                    return res.status(500).send("Error deleting folder.");
                }
                res.send("Folder deleted successfully.");
            });
        } else {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Failed to delete file:", err);
                    return res.status(500).send("Error deleting file.");
                }
                res.send("File deleted successfully.");
            });
        }
    });
});

// ✅ Get list of folders
app.get('/folders', (req, res) => {
    fs.readdir("uploads/", { withFileTypes: true }, (err, items) => {
        if (err) return res.status(500).send("Failed to read folders.");
        const folders = items.filter(item => item.isDirectory()).map(dir => dir.name);
        res.json(folders);
    });
});

// ✅ Get files inside a specific folder
app.get('/files/:folder', (req, res) => {
    const folderPath = path.join(__dirname, "uploads", req.params.folder);
    fs.readdir(folderPath, (err, files) => {
        if (err) return res.status(500).send("Failed to read folder.");
        res.json(files);
    });
});

// ✅ Create a new folder
app.post('/create-folder', (req, res) => {
    const folderName = req.body.folder;
    if (!folderName) return res.status(400).send("Folder name is required.");

    const folderPath = path.join(__dirname, 'uploads', folderName);
    fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to create folder.");
        }
        res.send("Folder created successfully.");
    });
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.get("/downloads/:filename", (req, res) => {
    const fileName = decodeURIComponent(req.params.filename);
    const filePath = path.join(__dirname, "uploads", fileName);
    res.download(filePath);
  });
  