const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

const SECRET_KEY = "your_secret_key"; // Replace with a strong secret key
let users = [];

// Check if the username is valid
const isValid = (username) => {
  return users.some((user) => user.username === username);
};

// Check if the username and password match
const authenticatedUser = (username, password) => {
  return users.some(
    (user) => user.username === username && user.password === password
  );
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Generate JWT token
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
  return res.status(200).json({ message: "Login successful", token });
});

// Add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn; // Treating 'isbn' as a book ID
  const { review } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1]; // Extracts the token if prefixed with "Bearer"
  console.log("token", token);

  // Check if the token is provided
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  // Verify JWT token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // Check if the book exists using 'isbn' as the ID
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Add or update the review for the book
    if (!book.reviews) {
      book.reviews = {};
    }
    // Store the review under the username from the decoded token
    book.reviews[decoded.username] = review;

    return res.status(200).json({
      message: "Review added/updated successfully",
      reviews: book.reviews,
    });
  });
});

// Delete a book review
// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn; // Book ID (isbn is used as the identifier)
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from the Authorization header

  // Check if the token is provided
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  // Verify the JWT token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const username = decoded.username; // Get the username from the decoded token
    const book = books[isbn]; // Find the book by isbn

    // Check if the book exists
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if the review exists for this user
    if (!book.reviews || !book.reviews[username]) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Delete the review for this user
    delete book.reviews[username];
    return res
      .status(200)
      .json({ message: "Review deleted successfully", reviews: book.reviews });
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
