
const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

dotenv.config();


const uri = process.env.MONGODB_URI
const port = process.env.URI_PORT 

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
 

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
 
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" }); 
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" }); 
  }
};

const librarianVerify = async (req, res, next) => {
  const user = req.user;  
  if (user.role !== "librarian" || user.plan != "free") {
    return res.status(403).json({ msg: "Forbidden" });
  }
  next();
};




// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();

client.connect(() => {
  console.log('connecting to Mongo db')
}).catch(console.dir)



    const db = client.db("BiblioDrop"); 
    const bookpostCollection = db.collection("bookpost");
    const userCollection = db.collection("user")
const deliveryRequestCollection =db.collection("delivery-request");





//admin
 app.get("/bookpost", async(req,res) => {
const result = await bookpostCollection.find().toArray();
  res.json(result);
})

app.get("/user", async(req,res ) => {
  const result = await userCollection.find().toArray();
  res.json(result);
})
app.delete("/user/:id", async (req, res) => {
  const { id } = req.params;
  const result = await userCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.json(result);
});
app.patch("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { role } }
  );
  res.json(result);
});



//librarian
 app.post("/bookpost", verifyToken, librarianVerify, async (req, res) => {
      const requestData = req.body;
      // console.log(requestData);
      const result = await bookpostCollection.insertOne(requestData);      
      res.json(result); 
    });  


app.get("/bookpost/email/:email", async (req, res) => {
  const email = req.params.email;

  const result = await bookpostCollection
    .find({ email: email })
    .toArray();
  res.send(result);
});


 
app.patch("/bookpost/:id", async (req, res) => {
  const {id} = req.params
  const updateData = req.body
  
  const result = await bookpostCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set: updateData}
  )
  res.json(result) 
})
 

app.delete("/bookpost/:id", async(req, res) => {
  const id = req.params
  const result = await bookpostCollection.deleteOne({_id: new ObjectId(id)}) 
  res.json(result)
});


app.get("/librarians", async (req, res) => {
  try {
    const librarians = await userCollection
      .find({ role: "librarian" })
      .limit(3)
      .toArray();

    res.json(librarians);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch librarians" });
  }
});


// user 

app.get("/bookpost/published",  async (req, res) => {
  const { page = 1, limit = 8 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const result = await bookpostCollection
    .find({ status: "publish" })
    .skip(skip)
    .limit(Number(limit))
    .toArray();

  const totalData = await bookpostCollection.countDocuments({
    status: "publish",
  });

  const totalPage = Math.ceil(totalData / Number(limit));
console.log({
   data: result,
    page: Number(page),
    totalPage,
    totalData,
});
  res.send({
    data: result,
    page: Number(page),
    totalPage,
    totalData,
  });
});



app.get("/bookpost/published/six", async (req, res) => {
  const result = await bookpostCollection
    .find({ status: "publish" })
    .limit(6)
    .toArray();

  res.json(result);
});


app.get("/bookpost/published/:id",  async (req, res) => {
  const id = req.params.id;

  const result = await bookpostCollection.findOne({
    _id: new ObjectId(id),
    status: "publish",
  });

  res.json(result); 
});




app.post("/delivery-request", async (req, res) => {
  try {
    const deliveryInfo = req.body;

    const result = await deliveryRequestCollection.insertOne(
      deliveryInfo
    );

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Failed to create delivery request",
    });
  }
});

// librian manage deliveries
app.get("/delivery-request/email/:email", async (req, res) => {
  const email = req.params.email;

  const result = await deliveryRequestCollection 
    .find({ email: email })
    .toArray();
  res.send(result);
});


// user side manage delivery
app.get("/delivery-requests/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const result = await deliveryRequestCollection
      .find({ requesterEmail: email })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server Error" });
  }
});



app.patch("/delivery-request/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await deliveryRequestCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        status,
      },
    }
  );
  res.send(result);  
});



// GET all delivered requests
app.get("/delivery-request/delivered", async (req, res) => {
  try {
    const result = await deliveryRequestCollection
      .find({ status: "delivered" })
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch delivered requests",
      error: error.message,
    });
  }
});






    // await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});


module.exports = app;