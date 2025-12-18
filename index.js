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
  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const token_email = decoded.email;
    req.decodedEmail = token_email;

    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorised user" });
  }
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const loanApplicationCollection = db.collection("loan_application");

    // Send a ping to confirm a successful connection
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;
      const existsUser = await usercollection.findOne({ email: email });
      if (existsUser) {
        return res.send({ message: "User already exists" });
      }
      const result = await usercollection.insertOne(newUser);
      res.send(result);
    });

    // get user
    app.get("/user", verificationToken, async (req, res) => {
      try {
        const email = req.decodedEmail;
        if (!email) {
          return res
            .status(500)
            .send({ message: "Internal server error: Missing decoded email" });
        }

        const query = { email: email };
        const result = await usercollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // add laon
    app.post("/manager/addloan", verificationToken, async (req, res) => {
      const addloanData = req.body;
      const result = await addLoanCollection.insertOne(addloanData);
      res.send(result);
    });
    // get maange laons

    app.get("/ManageLoan", verificationToken, async (req, res) => {
      try {
        const email = req.decodedEmail;
        if (!email) {
          return res
            .status(500)
            .send({ message: "Internal server error: Missing decoded email" });
        }
        const query = { email: email };
        const result = await addLoanCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // updateLaon
    app.get("/loans/:id", verificationToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await addLoanCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "Loan not found" });
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    // loan deatails
    app.get("/loanDeatails/:id", verificationToken, async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await addLoanCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // updated laon
    app.patch("/loans/:id", verificationToken, async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const updatedFiled = req.body;
        const result = await addLoanCollection.updateOne(query, {
          $set: updatedFiled,
        });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    // delete Loan
    app.delete("/loan/:id", verificationToken, async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await addLoanCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/availableLoans", async (req, res) => {
      try {
        const result = await addLoanCollection.find().limit(6).toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/alllaons", async (req, res) => {
      const cursor = addLoanCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // laon appplication post
    app.post("/loan-applications", verificationToken, async (req, res) => {
      try {
        const applicationData = req.body;
        const { userEmail, loanId } = applicationData;
        const existsUser = await loanApplicationCollection.findOne({
          userEmail,
          loanId,
        });
        if (existsUser) {
          return res
            .status(409)
            .send({ message: "Already applided for this loan" });
        }
        const result = await loanApplicationCollection.insertOne({
          ...applicationData,
          date: new Date(),
        });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    // application deatial
    app.get("/loan-application/:id", verificationToken, async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await loanApplicationCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    //  loan Application get for brower
    app.get("/myLoan", verificationToken, async (req, res) => {
      try {
        const email = req.decodedEmail;
        console.log(email);
        const query = { userEmail: email };
        const result = await loanApplicationCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    app.get("/applicationDeatail/:id", verificationToken, async (req, res) => {
      try {
        const { id } = req.params;
        console.log(id);
        const query = { _id: new ObjectId(id) };
        const result = await loanApplicationCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    // approve laon application
    app.patch(
      "/loan-applications/:id/approve",
      verificationToken,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await loanApplicationCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                status: "Approved",
                approvedAt: new Date(),
              },
            }
          );
          res.send(result);
        } catch (error) {
          console.error(error);
          res.status(500).send({ message: "Server error" });
        }
      }
    );

    // reject loan application
    app.patch(
      "/loan-applications/:id/reject",
      verificationToken,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await loanApplicationCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                status: "Rejected",
                approvedAt: new Date(),
              },
            }
          );
          res.send(result);
        } catch (error) {
          console.error(error);
          res.status(500).send({ message: "Server error" });
        }
      }
    );
    // pending Loans
    app.get("/pendingLoan", verificationToken, async (req, res) => {
      try {
        const email = req.query.email;
        const result = await loanApplicationCollection
          .find({ Officer_email: email, status: "pending" })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    //  approved Loan
    app.get("/approvedLoan", verificationToken, async (req, res) => {
      try {
        const email = req.query.email;
        const result = await loanApplicationCollection
          .find({ Officer_email: email, status: "Approved" })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
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
