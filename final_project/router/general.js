const express = require("express");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require("axios"); 

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (users.find((user) => user.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// Function to simulate fetching books with an async callback
function getBooks(callback) {
  setTimeout(() => {
    callback(null, books); // Simulate async data fetch with a callback
  }, 500); // Delay of 500ms
}

// Route to get the list of books using an async callback
public_users.get("/", (req, res) => {
  getBooks((error, bookList) => {
    if (error) {
      console.error("Error fetching books:", error);
      return res.status(500).json({ message: "Failed to fetch books" });
    }
    res.status(200).json(bookList); // Send the book list as the response
  });
});

// Function to search for a book by ISBN using Promises
function findBookByISBN(isbn) {
  return new Promise((resolve, reject) => {
    const book = books[isbn]; // Search for the book by ISBN
    if (book) {
      resolve(book); // Resolve with the book if found
    } else {
      reject("Book not found"); // Reject with an error message if not found
    }
  });
}

// Get book details based on ISBN
public_users.get("/isbn/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  findBookByISBN(isbn)
    .then((book) => {
      res.status(200).json(book); // Send the book details if found
    })
    .catch((error) => {
      res.status(404).json({ message: error }); // Send an error message if not found
    });
});

// Function to search for books by author using Promises
function findBooksByAuthor(author) {
  return new Promise((resolve, reject) => {
    // Convert the author name to lowercase for case-insensitive search
    const lowerCaseAuthor = author.toLowerCase();

    // Filter books to find matches by author
    const foundBooks = Object.values(books).filter((book) =>
      book.author.toLowerCase().includes(lowerCaseAuthor)
    );

    if (foundBooks.length > 0) {
      resolve(foundBooks); // Resolve with the list of books if found
    } else {
      reject("No books found by this author"); // Reject if no books are found
    }
  });
}

// Route to handle searching for books by author using Promises
public_users.get("/author/:author", (req, res) => {
  const author = req.params.author;

  findBooksByAuthor(author)
    .then((books) => {
      res.status(200).json(books); // Send the books list if found
    })
    .catch((error) => {
      res.status(404).json({ message: error }); // Send an error message if no books are found
    });
});

function findBookByTitle(title) {
  return new Promise((resolve, reject) => {
    // Convert the title to lowercase for case-insensitive search
    const lowerCaseTitle = title.toLowerCase();
    // Search for books with the specified title
    const foundBooks = Object.values(books).filter((book) =>
      book.title.toLowerCase().includes(lowerCaseTitle)
    );

    if (foundBooks.length > 0) {
      resolve(foundBooks); // Resolve with the list of books if found
    } else {
      reject("No books found with this title"); // Reject if no books are found
    }
  });
}

// Route to handle searching for books by title using Promises
public_users.get("/title/:title", (req, res) => {
  const title = req.params.title;

  findBookByTitle(title)
    .then((books) => {
      res.status(200).json(books); // Send the books list if found
    })
    .catch((error) => {
      res.status(404).json({ message: error }); // Send an error message if no books are found
    });
});

// Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    // Check if reviews exist and are not empty
    if (book.reviews && Object.keys(book.reviews).length > 0) {
      return res.status(200).json(book.reviews);
    } else {
      return res
        .status(201)
        .json({ message: "No reviews found for this book" });
    }
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;
