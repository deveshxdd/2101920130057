const express = require("express"); // Importing the express module
const axios = require("axios"); // Importing the axios module
const cors = require("cors"); // Importing the cors module

const app = express(); // Creating an instance of the express application
const port = 3000; // Setting the port number for the server

const myClientID = "insert-here"; // Client ID for authentication
const myClientSecret = "insert-here"; // Client secret for authentication
const testURL = "http://20.244.56.144/test"; // URL for testing
const minPrice = 0; // Minimum price for products

app.use(cors()); // Using the cors middleware for handling cross-origin requests

let accessToken = ""; // Variable to store the access token
let refreshToken = ""; // Variable to store the refresh token

// Function to authenticate the client
const authenticate = async () => {
  try {
    const response = await axios.post(`${testURL}/auth`, {
      companyName: "sawanMart",
      clientID: myClientID,
      clientSecret: myClientSecret,
      ownerName: "Sawan",
      ownerEmail: "Sawan9793711154@gmail.com",
      rollNo: "2001920100",
    });
    accessToken = response.data.access_token; // Storing the access token
    refreshToken = response.data.refresh_token; // Storing the refresh token
  } catch (error) {
    console.error("Error authenticating:", error);
  }
};

// Function to refresh the access token
const refreshAccessToken = async () => {
  try {
    const response = await axios.post(`${testURL}/refresh`, {
      refresh_token: refreshToken,
    });
    accessToken = response.data.access_token; // Updating the access token
    refreshToken = response.data.refresh_token; // Updating the refresh token
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};

// Middleware to check if access token is present, if not authenticate
app.use(async (req, res, next) => {
  if (!accessToken) {
    await authenticate();
  }
  next();
});

// Route to fetch products based on category name
app.get("/categories/:categoryName/products", async (req, res) => {
  const { categoryName } = req.params; // Extracting the category name from the request parameters
  const {
    n = 10, // Number of products to fetch
    minPrice = 1, // Minimum price filter
    maxPrice = 10000, // Maximum price filter
    sort = "", // Sorting parameter
    order = "asc", // Sorting order
    page = 1, // Page number
  } = req.query; // Extracting the query parameters

  const companyNames = ["AMZ", "FLP", "SNP", "MYN", "AZO"]; // Array of company names

  try {
    let allProducts = []; // Array to store all the products

    // Fetching products from each company
    for (const company of companyNames) {
      const response = await axios.get(
        `${testURL}/companies/${company}/categories/${categoryName}/products`,
        {
          params: { top: n, minPrice: minPrice, maxPrice },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      allProducts = allProducts.concat(response.data); // Concatenating the products to the array
    }

    // Sorting the products based on the sort parameter and order
    if (sort) {
      allProducts.sort((a, b) => {
        const comparison = order === "asc" ? 1 : -1;
        return a[sort] > b[sort] ? comparison : -comparison;
      });
    }

    const start = (page - 1) * n; // Calculating the starting index for pagination
    const myPaginationProducts = allProducts.slice(start, start + n); // Slicing the products for pagination

    res.json(myPaginationProducts); // Sending the response with the paginated products
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expired, refresh and retry
      await refreshAccessToken();
      return res.redirect(req.originalUrl);
    }

    console.error("Error fetching products:", error.response.data);
    res
      .status(500)
      .json({ errors: error.response.data.errors || "Internal server error" });
  }
});

// Starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
