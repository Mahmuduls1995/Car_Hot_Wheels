const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
var admin = require("firebase-admin");
const { ServerApiVersion } = require('mongodb');
const Razorpay = require("razorpay");
const sha256 = require("crypto-js/sha256");
const crypto = require('crypto');

const { MongoClient } = require('mongodb');
const { urlencoded } = require('express');
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

var serviceAccount = require("./car-hot-wheels-firebase-adminsdk-3bqse-efa9656e2f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jie6i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const instance = new Razorpay({
  key_id: `${process.env.RAZOR_PAY_KEY_ID}`,
  key_secret: `${process.env.RAZOR_PAY_KEY_SECRET}`,
});

async function verifyToken(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    const idToken = req.headers.authorization.split('Bearer ')[1]
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken)
      req.decodedUserEmail = decodedUser.email
    } catch (error) {

    }
  }
  next();
}

async function run() {
  try {

    await client.connect();
    // console.log('database connected');
    console.log('database connected');
    const carsCollection = client.db("Car_Hot_Wheels").collection("Available_Cars");
    const bookingCollection = client.db("Car_Hot_Wheels").collection("Car_Booking");
    const usersCollection = client.db("Car_Hot_Wheels").collection("User_Collection");
    const reviewCollection = client.db("Car_Hot_Wheels").collection("Review_Collection");

   

    // POST A CAR DATA , DETAILS
    app.post('/availableCars', async (req, res) => {
      const carDetails = req.body;
      const result = await carsCollection.insertOne(carDetails);
      res.send(result)
    })
    // GET ALL CARS DATA
    app.get('/availableCars', async (req, res) => {
      const cursor = carsCollection.find({});
      const result = await cursor.toArray();
      res.json(result)
    })
    // GET SINGLE CAR DATA
    app.get('/availableCars/:id', async (req, res) => {
      const id = req.params.id;
      console.log('car id', id);
      const query = { _id: ObjectId(id) }
      const car = await carsCollection.findOne(query);
      res.json(car)
    })
    // UPDATE SINGLE CAR DETAILS
    app.put('/availableCars/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedCar.name,
          mileage: updatedCar.mileage,
          price: updatedCar.price,
          img: updatedCar.img,
          details: updatedCar.details
        },
      };
      const result = await carsCollection.updateOne(filter, updateDoc, options)
      // res.send('updating not dationg')
      res.json(result)
    })
    // DELETE SINGLE CAR DATA
    app.delete('/deletedCar/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await carsCollection.deleteOne(query)
      res.json(result)
    })
    // POST BOOKING API
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      console.log('hit the post api', booking);
      const result = await bookingCollection.insertOne(booking)
      res.json(result)
    })
    
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})