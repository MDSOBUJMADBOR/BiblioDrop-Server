
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


// const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

// const verifyToken = async (req, res, next) => {
//   const authHeader = req?.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" }); 
//   }

//   try {
//     const { payload } = await jwtVerify(token, JWKS);
//     console.log(payload);
//     next();
//   } catch (error) {
//     return res.status(403).json({ message: "Forbidden" }); 
//   }
// };



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("BiblioDrop"); 
    const bookpostCollection = db.collection("bookpost");
    const userCollection = db.collection("user")





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
// app.patch("/bookpost/:id", async (req, res) => {
//   const { id } = req.params;
//   const updateData = req.body;

//   const result = await bookpostCollection.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: updateData }
//   );

//   res.json(result);
// });



//librarian
 app.post("/bookpost", async (req, res) => {
      const requestData = req.body;
      // console.log(requestData);
      const result = await bookpostCollection.insertOne(requestData);      
      res.json(result); 
    });  



// app.get("/bookpost", async (req, res) => {
//   const email = req.query.email;
//   const result = await bookpostCollection
//     .find({ email: email })
//     .toArray();
//   res.send(result); 
// });
app.get("/bookpost/email/:email", async (req, res) => {
  const email = req.params.email;

  const result = await bookpostCollection
    .find({ email: email })
    .toArray();
  res.send(result);
});

// http://localhost:8080/bookpost/email/sathi@gmail.com
 
app.patch("/bookpost/:id", async (req, res) => {
  const {id} = req.params
  const updateData = req.body
  // console.log(updateData,'updateData');
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


// user 

app.get("/bookpost/published", async (req, res) => {
  const result = await bookpostCollection
    .find({ status: "publish" }) // ✅ FILTER
    .toArray();

  res.json(result);
});
// http://localhost:8080/bookpost/published













    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});
