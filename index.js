// Import dependencies
require("dotenv").config(); // Load environment variables
const port = 4001;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection with MongoDB
mongoose.connect("mongodb+srv://beingshakil:shakil743@cluster0.oln20.mongodb.net/test?retryWrites=true&w=majority")


// API Root Endpoint
app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Ensure Upload Directory Exists
const uploadDir = "./upload/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image Storage Engine for multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// Serve images statically
app.use("/images", express.static("upload/images"));

// Upload Endpoint
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: 0,
      message: "No file uploaded",
    });
  }
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// Schema for Creating Products 

const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// Add Product Endpoint

app.post("/addproduct", async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
      const lastProduct = products[products.length - 1];
      id = lastProduct.id + 1;
    } else {
      id = 1;
    }
    const product = new Product({
        id: id,  // Use the auto-incremented id
        name: req.body.name,
        image: req.body.image, 
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
  
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    });
  });

  app.post("/addproduct", async (req, res) => {
    try {
      // Code for creating the product
    } catch (error) {
      console.error("Error saving product:", error);
      res.status(500).json({ success: false, message: "Failed to add product." });
    }
  });
  
//Creating API for deleting products

app.post('/removeproduct', async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})

// Creating API for getting all products

app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched");
    res.send(products);
});

// Schema creating for user model

const Users = mongoose.model('Users', {
  name:{
    type: String,
  }, 
  email:{
    type: String,
    unique: true,
  },
  password:{
    type: String,
  },
  cartData:{
    type: Object,
  },
  date:{
    type: Date,
    default: Date.now,
  }
})

// Creating End Point for registering the user

app.post('/signup', async(req, res)=>{
  
  let check = await Users.findOne({email:req.body.email});

  if(check){
    return res.status(400).json({success: false, error: "Existing User found with same Email"})
  }

  let cart = {};
  for (let i = 0; i < 300; i++){
    cart[i] = 0;
  }

  const user = new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart,
  })

  await user.save();

  const data = {
    user: {
      id:user.id
    }
  }

  const token = jwt.sign(data, 'secret_ecom');
  res.json({success:true, token})

})

//creating endpoint for user login

app.post('/login', async(req, res)=>{
  let user = await Users.findOne({email:req.body.email});

  if(user){
    const passCompare = req.body.password === user.password;
    if(passCompare){
      const data = {
        user:{
          id:user.id
        }
      }

      const token = jwt.sign(data, 'secret_ecom');
      res.json({sucess:true, token});
    }

    else{
      res.json({success: false, errors:"Wrong Password!"});
    }
  }

  else{
    res.json({sucess:false, errors:"Wrong Email"})
  }
})


// Start Server
app.listen(port, (error) => {
  if (!error) {
    console.log("Server running on port " + port);
  } else {
    console.log("Error:", error);
  }
});
