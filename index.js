const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yvqsm.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('bike_buddies').collection('products');
        const orderCollection = client.db('bike_buddies').collection('orders');
        const usersCollection = client.db('bike_buddies').collection('users');

        //JWT token
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        });

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        //get product by id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });

        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const result = await orderCollection.insertOne(newProduct);
            res.send(result);
        });

        // search one's order by email
        app.get('/order', async (req, res) => {
            const email = req.query;
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        // show one's order in dashboard
        app.get('/order', async (req, res) => {
            const email = req.query;
            const query = { email: email };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        // collecting all users data
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, token });
        });

        // getting all users
        app.get('/user', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        });

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server Running');
});

app.listen(port, () => {
    console.log('CRUD Server Running');
})