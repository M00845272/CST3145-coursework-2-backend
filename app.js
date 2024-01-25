var express = require("express"); // Requires the Express module
const bodyParser = require('body-parser');
const path = require('path');
var http = require('http');
const cors = require("cors");

// Calls the express function to start a new Express application
var app = express();
app.use(bodyParser.json());
app.use(cors());

let lessons = [
    {
        "id": 1001,
        "subject": "Math",
        "location": "London",
        "price": 3500,
        "image": "math_icon_256px.png",
        "availableInventory": 5,
        "rating": 1
    },
    {
        "id": 1002,
        "subject": "Math",
        "location": "Oxford",
        "price": 3500,
        "image": "math_icon_256px.png",
        "availableInventory": 10,
        "rating": 3
    },
    {
        "id": 1003,
        "subject": "Science",
        "location": "London",
        "price": 2500,
        "image": "science_icon_256px.png",
        "availableInventory": 5,
        "rating": 3
    },
    {
        "id": 1004,
        "subject": "Science",
        "location": "Oxford",
        "price": 2500,
        "image": "science_icon_256px.png",
        "availableInventory": 10,
        "rating": 4
    },
    {
        "id": 1005,
        "subject": "Music",
        "location": "London",
        "price": 3000,
        "image": "music_icon_256px.png",
        "availableInventory": 5,
        "rating": 2
    },
    {
        "id": 1006,
        "subject": "Music",
        "location": "Oxford",
        "price": 3000,
        "image": "music_icon_256px.png",
        "availableInventory": 10,
        "rating": 5
    },
    {
        "id": 1007,
        "subject": "English",
        "location": "London",
        "price": 2500,
        "image": "english_icon_256px.png",
        "availableInventory": 5,
        "rating": 2
    },
    {
        "id": 1008,
        "subject": "English",
        "location": "Oxford",
        "price": 2500,
        "image": "english_icon_256px.png",
        "availableInventory": 10,
        "rating": 3
    },
    {
        "id": 1009,
        "subject": "English",
        "location": "York",
        "price": 2500,
        "image": "english_icon_256px.png",
        "availableInventory": 5,
        "rating": 3
    },
    {
        "id": 1010,
        "subject": "Math",
        "location": "York",
        "price": 3500,
        "image": "math_icon_256px.png",
        "availableInventory": 5,
        "rating": 4
    },
    {
        "id": 1011,
        "subject": "Science",
        "location": "York",
        "price": 2500,
        "image": "science_icon_256px.png",
        "availableInventory": 5,
        "rating": 5
    },
    {
        "id": 1012,
        "subject": "Music",
        "location": "York",
        "price": 3000,
        "image": "music_icon_256px.png",
        "availableInventory": 5,
        "rating": 5
    }
];

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware for serving static files (lesson images)
app.use('/lesson/images', express.static(path.join(__dirname, 'lesson_images')));


// Get list of lessons
app.get('/lessons', (req, res) => {
    console.log("lessons API called...");
    res.json(lessons);
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

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("App started on port: " + port);
});