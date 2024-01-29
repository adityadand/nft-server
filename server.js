// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const mongoURI = "mongodb+srv://admin:BrulTZ9gH5KG63Ki@cluster0.qocy1xl.mongodb.net/nftMembershipsApp?retryWrites=true&w=majority";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const Membership = mongoose.model('Membership', {
  title: String,
  symbol: String,
  images: [String],
  priceUsd: Number,
  benefits: String,
});

app.post('/api/memberships', upload.array('images', 5), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    const newMembership = new Membership({
      title: req.body.title,
      symbol: req.body.symbol,
      images: req.body.images,
      priceUsd: req.body.priceUsd,
      benefits: req.body.benefits,
    });

    await newMembership.save();

    console.log('New Membership:', newMembership);

    res.status(201).json(newMembership);
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/deploy', async (req, res) => {
  try {
    // Destructure values from the request body
    const { title, symbol, priceUsd, benefits } = req.body;

    // Get the deployed contract factory
    const CustomNft = await ethers.getContractFactory('CustomNft');

    // Deploy the contract
    const customNft = await CustomNft.deploy(title, symbol, priceUsd, benefits);
    await customNft.waitForDeployment();

    console.log('CustomNft deployed to:', customNft.target);

    // Send back the deployed contract address
    res.status(201).json({ contractAddress: customNft.target });
  } catch (error) {
    console.error('Error deploying NFT contract:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/memberships', async (req, res) => {
    try {
      const allMemberships = await Membership.find();
      res.json(allMemberships);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// server.js
app.get('/api/memberships/:id/image', async (req, res) => {
    try {
      const membership = await Membership.findById(req.params.id);
  
      if (!membership || !membership.image) {
        return res.status(404).json({ error: 'Image not found' });
      }
  
      const imageBuffer = Buffer.from(membership.image, 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length,
      });
      res.end(imageBuffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
