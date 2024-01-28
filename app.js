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

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware for serving static files (lesson images)
app.use('/lesson/images', express.static(path.join(__dirname, 'lesson_images')));

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
app.get('/:collectionName/:max/:sortAspect/:sortAscDesc', async function (req, res, next) {
    console.log('lessons API');
    var max = parseInt(req.params.max, 10); // base 10
    let sortDirection = 1;
    if (req.params.sortAscDesc === "des") {
        sortDirection = -1;
    }
    let sortAspect = req.params.sortAspect;
    if(sortAspect == 'availableinventory') sortAspect = 'availableInventory';

    console.log('max=' + max, ',sortAspect=' + sortAspect + ',sortDirection=' + sortDirection);

    let results = await req.collection.find({}, {
        limit: max, sort: [[sortAspect, sortDirection]]
    }).toArray();

    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');


    res.send(results);
});

// Search for lessons by subject or location
app.get('/:collectionName/search/:searchKeyword/:max/:sortAspect/:sortAscDesc', async (req, res) => {
    const searchKeyword = req.params.searchKeyword;

    var max = parseInt(req.params.max, 10); // base 10
    let sortDirection = 1;
    if (req.params.sortAscDesc == "des") {
        sortDirection = -1;
    }
    let sortAspect = req.params.sortAspect;
    if(sortAspect == 'availableinventory') sortAspect = 'availableInventory';

    console.log('searchKeyword=' + searchKeyword + ',max=' + max, ',sortAspect=' + sortAspect + ',sortDirection=' + sortDirection);

    if (!searchKeyword) {
        let results = await req.collection.find({}, {
            limit: max, sort: [[sortAspect, sortDirection]]
        }).toArray();
        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.send(results);
    }

    // define pipeline
    const agg = [
        {
            $search: {
                index: 'location-subject-autocomplete',
                compound: {
                    should: [
                        {
                            "wildcard": {
                                "query": searchKeyword + '*',
                                "path": "subject",
                                "allowAnalyzedField": true,
                            }
                        },
                        {
                            "wildcard": {
                                "query": searchKeyword + '*',
                                "path": "location",
                                "allowAnalyzedField": true,
                            }
                        },
                    ],
                },
                "sort": {
                    sortAspect: sortDirection
                }
            }
        },
        { $limit: max },
        {
            $sort: {
                sortAspect: sortDirection
            }
        }
    ];

    let db = client.db(dbName);
    const coll = db.collection("lessons");
    let results = await coll.aggregate(agg).toArray();
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(results);
});


// Update a lesson's available spaces
// API always reduces available spaces by 1
app.put('/lesson/update_availability', async (req, res) => {
    const cart = req.body;
    console.log('update_availability API called. Cart=' + JSON.stringify(cart));
    let success = true;
    let message = "Successfully updated available spaces."
    let db = client.db(dbName);
    const coll = db.collection("lessons");

    for (const lessonId in cart) {
        console.log('lessonId=' + lessonId);
        // Find the lesson by ID
        let lesson = await coll.findOne({ id: parseInt(lessonId) });
        if (lesson == null) {
            success = false;
            message = 'Lesson not found';
            break;
        }
        console.log('Available spaces before update: ', JSON.stringify(lesson));

        let currentAvailableSPaces = lesson['availableInventory'];
        // return error if not enough available spaces
        if (currentAvailableSPaces < cart[lessonId]) {
            success = false;
            message = 'Can\'t update, not enough available spaces.';
            break;
        }

        if (lesson != null) {
            // Update the lesson available count
            lesson['availableInventory'] = currentAvailableSPaces - cart[lessonId];
            let result = await coll.updateOne({ id: parseInt(lessonId) },
                { $set: lesson },
                { safe: true, multi: false }
            );
            if (result.matchedCount !== 1) success = false;
            console.log('Available spaces updated successfully.');
        }
    }
    console.log(message);
    if (success) {
        res.json({ message: message });
    } else {
        res.status(404).json({ message: 'error' });
    }
});

// Create an order
app.post('/:collectionName', async (req, res) => {
    const orderDetails = req.body;
    console.log('orders API called. OrderDetails:' + JSON.stringify(orderDetails));

    await req.collection.insertOne(req.body, function (err, results) {
        if (err) {
            return next(err);
        }
        res.send(results);
    });
    res.json({ message: 'Order created successfully', order: orderDetails });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("App started on port: " + port);
});