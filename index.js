const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
require("dotenv").config();
// middleware

const port = process.env.PORT || 3000;

var admin = require("firebase-admin");

var serviceAccount = require("./loan-link-firebase-adminsdk-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verificationToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ message: "unauthorise user ,token not found" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorised user" });
  }
  console.log(token);
  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.token_email = decoded.email;

    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorised user" });
  }
};

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.URI_USER_NAME}:${process.env.URI_PASSWORD}@cluster0.sillvi5.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("loan_Link");
    const usercollection = db.collection("users");
    const addLoanCollection = db.collection("manager-addLoan");

    // Send a ping to confirm a successful connection
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;
      const existsUser = await usercollection.findOne({ email });
      if (existsUser) {
        return res
          .status(409)
          .send({ message: "Conflict – resource already exists" });
      }
      const result = await usercollection.insertOne(newUser);
      res.send(result);
    });

    // add laon
    app.post("/manager/addloan", verificationToken, async (req, res) => {
      const addloanData = req.body;
      console.log(addloanData);
      const result = await addLoanCollection.insertOne(addloanData);
      res.send(result);
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
