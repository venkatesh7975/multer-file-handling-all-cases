const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Initialize Express app
const app = express();
app.set("view engine", "ejs");

// Serve static files from "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Render the home page
app.get("/", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to scan uploads directory.");
    }

    // Filter only image files (jpg, png, jpeg)
    const imageFiles = files.filter(
      (file) =>
        file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")
    );

    // Render the "index.ejs" file and pass the list of images
    res.render("index", { files: imageFiles });
  });
});

// Configure Storage Engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Save file with timestamp to avoid name collisions
  },
});

// File Filter (Optional): To control which files can be uploaded (e.g., images only)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error("Only images (jpeg, jpg, png) and PDFs are allowed"));
  }
};

// Setting limits for file size
const limits = {
  fileSize: 1024 * 1024 * 5, // 5 MB max file size
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: limits,
  fileFilter: fileFilter,
});

// Single file upload route
app.post("/upload-single", upload.single("file"), (req, res) => {
  try {
    res.redirect("/"); // Redirect to home page to display uploaded files
  } catch (err) {
    res.status(400).send("Error uploading file");
  }
});

// Multiple files upload route (up to 3 files)
app.post("/upload-multiple", upload.array("files", 3), (req, res) => {
  try {
    res.redirect("/"); // Redirect to home page to display uploaded files
  } catch (err) {
    res.status(400).send("Error uploading files");
  }
});

// Upload different types of files with field names
app.post(
  "/upload-different-files",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "document", maxCount: 2 },
  ]),
  (req, res) => {
    try {
      res.redirect("/"); // Redirect to home page to display uploaded files
    } catch (err) {
      res.status(400).send("Error uploading files");
    }
  }
);

// Upload with file size limit and custom error handling
app.post("/upload-with-limit", (req, res) => {
  const uploadWithLimit = upload.single("file");
  uploadWithLimit(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).send("File is too large. Max limit is 5MB.");
      }
    } else if (err) {
      return res.status(400).send("Error uploading file: " + err.message);
    }
    res.redirect("/"); // Redirect to home page to display uploaded files
  });
});

// Handle errors globally (optional)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).send("Error: " + err.message);
  }
  next();
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
