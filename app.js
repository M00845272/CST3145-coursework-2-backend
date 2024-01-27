var express = require("express"); // Requires the Express module
const bodyParser = require('body-parser');
const path = require('path');
var http = require('http');
const cors = require("cors");
let propertiesReader = require("properties-reader");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


// Calls the express function to start a new Express application
var app = express();
app.use(express.json())
app.use(cors());


let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);
let dbPprefix = properties.get("db.prefix");
//URL-Encoding of User and PWD
//for potential special characters
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");
const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

app.param('collectionName', function (req, res, next, collectionName) {
    req.collection = db.collection(collectionName);
    return next();
});

// Get list of lessons
app.get('/:collectionName', async function (req, res, next) {
    console.log('lessions API');

    let results = await req.collection.find({}).toArray();
    res.send(results);
});


// Update a lesson's available spaces
// API always reduces available spaces by 1
app.put('/lesson/update_availability', (req, res) => {
    const cart = req.body;
    console.log('update_availability API called. Cart=' + JSON.stringify(cart));
    let success = true;
    let message = "Successfully updated available spaces."
    for (const lessonId in cart) {
        console.log('lessonId=' + lessonId);
        // Find the lesson by ID
        const index = lessons.findIndex((lesson) => lesson.id === parseInt(lessonId));

        if (index == -1) {
            success = false;
            message = 'Lesson not found';
            break;
        }
        console.log('Available spaces before update: ', lessons[index]);

        let currentAvailableSPaces = lessons[index]['availableInventory'];
        // return error if not enough available spaces
        if (currentAvailableSPaces < cart[lessonId]) {
            success = false;
            message = 'Can\'t update, not enough available spaces.';
            break;
        }

        if (index !== -1) {
            // Update the lesson available count
            lessons[index]['availableInventory'] = currentAvailableSPaces - cart[lessonId];
            console.log('Available spaces after successfull update', lessons[index]);
        }
    }
    console.log(message);
    if (success) {
        res.json({ message: message });
    } else {
        res.status(404).json({ message: message });
    }
});

let orders = [];
// Create an order
app.post('/order', (req, res) => {
    const orderDetails = req.body;
    console.log('order API called. OrderDetails:' + JSON.stringify(orderDetails));

    // Add the order to the orders array
    orders.push(orderDetails);
    res.json({ message: 'Order created successfully', order: orderDetails });
});

// Search for lessons by subject or location
app.get('/search', (req, res) => {
    const searchKeyword = req.query.searchKeyword;

    if (!searchKeyword) {
        return res.json(lessons);
    }

    const searchResults = lessons.filter((lesson) => {
        return lesson.subject.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            lesson.location.toLowerCase().includes(searchKeyword.toLowerCase());
    });

    res.json(searchResults);
});

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware for serving static files (lesson images)
app.use('/lesson/images', express.static(path.join(__dirname, 'lesson_images')));


const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("App started on port: " + port);
});