const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r1nyd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// backend work 
async function run() {
    try {
        await client.connect();
        const database = client.db('watchShop');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');
        //product post api
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result)
        });
        //product get api
        app.get("/products", async (req, res) => {
            const limit = +req.query.limit;
            let result;
            if (limit) {
                result = await productsCollection
                    .find({})
                    .sort({ _id: -1 })
                    .limit(limit)
                    .toArray();
            } else {
                result = await productsCollection.find({}).sort({ _id: -1 }).toArray();
            }
            res.json(result);
        });
        // get bookorders api 
        app.get('/orders/:orderID', async (req, res) => {
            const orderId = req.params.orderID;
            const query = { _id: ObjectId(orderId) };
            const order = await productsCollection.findOne(query);
            res.send(order);
        });
        // PlaceOrder api 
        app.post('/placeorders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result)
        });
        // get all placeorders
        app.get('/placeorders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const allOrder = await cursor.toArray();
            res.json(allOrder);
        });
        // get my orders
        app.get("/myorders/:email", async (req, res) => {
            const result = await ordersCollection.find({
                email: req.params.email,
            }).toArray();
            res.send(result);
        });
        // delete api 
        app.delete("/deleteorder/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        });
        // delete product api 
        app.delete("/deleteproduct/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        });
        //order status update api
        app.put('/placeorders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const statusUpdate = {
                $set: {
                    status: 'shipped'
                }
            };
            const result = await ordersCollection.updateOne(filter, statusUpdate, options);
            res.json(result)
        });
        // Review api
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result)
        });
        // get all review
        app.get('/review', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const allReview = await cursor.toArray();
            res.json(allReview);
        });
        // get admin
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // save user in database
        app.post("/users", async (req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.json(result);
        });
        // get all user
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const allUser = await cursor.toArray();
            res.json(allUser);
        });
        // google user and upsert user 
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateUser = { $set: user };
            const result = await usersCollection.updateOne(
                filter,
                updateUser,
                options
            );
            res.json(result);
        });
        //make admin role
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const roleUpdate = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await usersCollection.updateOne(filter, roleUpdate, options);
            res.json(result)
        });
        // check admin role 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

// default api check run server
app.get('/', (req, res) => {
    res.send('Running Node Servers')
});
app.listen(port, () => {
    console.log('Watch Server port', port)
})