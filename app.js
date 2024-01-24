var express = require("express"); // Requires the Express module
const bodyParser = require('body-parser');
var http = require('http');
// Calls the express function to start a new Express application
var app = express();
app.use(bodyParser.json());

let lessons = [
      {
        "id": 1001,
        "subject": "Math",
        "location": "London",
        "price": 3500,
        "image": "assets/images/math_icon_256px.png",
        "availableInventory": 5,
        "rating": 1
      },
      {
        "id": 1002,
        "subject": "Math",
        "location": "Oxford",
        "price": 3500,
        "image": "assets/images/math_icon_256px.png",
        "availableInventory": 10,
        "rating": 3
      },
      {
        "id": 1003,
        "subject": "Science",
        "location": "London",
        "price": 2500,
        "image": "assets/images/science_icon_256px.png",
        "availableInventory": 5,
        "rating": 3
      },
      {
        "id": 1004,
        "subject": "Science",
        "location": "Oxford",
        "price": 2500,
        "image": "assets/images/science_icon_256px.png",
        "availableInventory": 10,
        "rating": 4
      },
      {
        "id": 1005,
        "subject": "Music",
        "location": "London",
        "price": 3000,
        "image": "assets/images/music_icon_256px.png",
        "availableInventory": 5,
        "rating": 2
      },
      {
        "id": 1006,
        "subject": "Music",
        "location": "Oxford",
        "price": 3000,
        "image": "assets/images/music_icon_256px.png",
        "availableInventory": 10,
        "rating": 5
      },
      {
        "id": 1007,
        "subject": "English",
        "location": "London",
        "price": 2500,
        "image": "assets/images/english_icon_256px.png",
        "availableInventory": 5,
        "rating": 2
      },
      {
        "id": 1008,
        "subject": "English",
        "location": "Oxford",
        "price": 2500,
        "image": "assets/images/english_icon_256px.png",
        "availableInventory": 10,
        "rating": 3
      },
      {
        "id": 1009,
        "subject": "English",
        "location": "York",
        "price": 2500,
        "image": "assets/images/english_icon_256px.png",
        "availableInventory": 5,
        "rating": 3
      },
      {
        "id": 1010,
        "subject": "Math",
        "location": "York",
        "price": 3500,
        "image": "assets/images/math_icon_256px.png",
        "availableInventory": 5,
        "rating": 4
      },
      {
        "id": 1011,
        "subject": "Science",
        "location": "York",
        "price": 2500,
        "image": "assets/images/science_icon_256px.png",
        "availableInventory": 5,
        "rating": 5
      },
      {
        "id": 1012,
        "subject": "Music",
        "location": "York",
        "price": 3000,
        "image": "assets/images/music_icon_256px.png",
        "availableInventory": 5,
        "rating": 5
      }
    ];

// Get list of lessons
app.get('/lessons', (req, res) => {
    console.log("lessons API called...");
    res.json(lessons);
});

// Update a lesson's available spaces
// API always reduces available spaces by 1
app.put('/lesson/update_availability/:id', (req, res) => {
    const lessonId = parseInt(req.params.id);
    console.log('update_availability API called. LessonId='+lessonId);

    // Find the lesson by ID
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);
    console.log('Available spaces before update: ', lessons[index] );

    let currentAvailableSPaces = lessons[index]['availableInventory'] ;

    // return error if not enough available spaces
    if(currentAvailableSPaces < 1){
        res.status(404).json({ message: 'Can\'t update, not enough available spaces.' });
        return;
    }
  

    if (index !== -1) {
      // Update the lesson available count
      lessons[index]['availableInventory'] = currentAvailableSPaces - 1;
      console.log('Available spaces updated successfully for', lessons[index] );

      res.json({ message: 'Available spaces after successfull update: ', lesson: lessons[index] });
    } else {
      res.status(404).json({ message: 'Lesson not found' });
    }
  });


http.createServer(app).listen(3000); // start the server