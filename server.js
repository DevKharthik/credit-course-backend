const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3002;


mongoose.connect('mongodb+srv://dev:devkharthik@credex.e268kiq.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

const studentSchema = new mongoose.Schema({
  email: String,
  name: String,
  rollno: String,
  year: String,
  department: String,
  phone: String,
  academicYear: String, 
  course: String,
});

const Prefinal = mongoose.model('Prefinal', studentSchema);

// Get course data endpoint
app.get('/getCourseData', async (req, res) => {
  try {
    const courses = ['Ethical Hacking', 'Devops'];
    const courseData = {};
    for (const course of courses) {
      const courseCount = await Prefinal.countDocuments({ course: course });
      courseData[course] = courseCount;
    }
    res.json(courseData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting course data');
  }
});
// Middleware and routes
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());



app.post('/submit', async (req, res) => {
  const { email, name, rollno, year, department, phone, academicYear, course } = req.body;

  try {
     const existingStudentByRoll = await Prefinal.findOne({ rollno: rollno });
     if (existingStudentByRoll) {
       const alertMessage = "Roll number is already Registered. Thank You.";
       return res.send(`<script>alert('${alertMessage}'); window.location.href='https://clinquant-baklava-cb7e9c.netlify.app/';</script>`);
     }
     
     
  
     // Check if Email is available, then proceed with the registration logic
     const existingStudentByEmail = await Prefinal.findOne({ email: email });
     if (existingStudentByEmail) {
      const alertMessage = "You are already registered for a course. Thank You.";
      return res.send(`<script>alert('${alertMessage}'); window.location.href='https://clinquant-baklava-cb7e9c.netlify.app/';</script>`);
     }      

    const courseCounts = await Prefinal.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]);
    courseCounts.forEach((courseCount) => {
      console.log(`${courseCount._id}: ${courseCount.count}`);
    });

    const maxCapacity = 60; 

    for (const courseCount of courseCounts) {
      if (courseCount._id.toString() === course && courseCount.count >= maxCapacity) {
        const reason = encodeURIComponent(
          `${course} has reached the maximum limit. Please consider selecting another course soon.`
        );
        const alertMessage = "Registration failed: " + decodeURIComponent(reason);
        console.log(alertMessage);
        return res.send(`<script>alert('${alertMessage}'); window.location.href='https://clinquant-baklava-cb7e9c.netlify.app/';</script>`
        );
      }
    }
    const newStudent = new Prefinal({ email, name, rollno, year, department, phone, academicYear, course });
    await newStudent.save();

    const updatedCourseCounts = await Prefinal.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]);
    updatedCourseCounts.forEach(({ _id, count }) => console.log(`${_id}: ${count}`));

    
    
    const alertMessage = "Course registration successful. Thank You.";
    return res.send(`<script>alert('${alertMessage}'); window.location.href='https://clinquant-baklava-cb7e9c.netlify.app/';</script>`);
  } catch (error) {
    console.error(error);
    const alertMessage = "Error saving to the database. Please try again later.";
    return res.send(`<script>alert('${alertMessage}'); window.location.href='https://clinquant-baklava-cb7e9c.netlify.app/';</script>`);
  }
});

app.get('/getTotalEnrollment', async (req, res) => {
  try {
    const courseCounts = await Prefinal.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]);
    res.json(courseCounts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting total enrollment data');
  }
});

app.post('/confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    const registration = await Prefinal.findOne({ email });

    if (registration) {
      console.log('Registration details fetched successfully:', registration);
      res.json({
        registered: true,
        ...registration._doc,
      });
    } else {
      console.log('No registration details found for email:', email);
      res.json({ registered: false });
    }
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
