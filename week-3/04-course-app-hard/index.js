const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

app.use(express.json());

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: "courses" });


const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
      type: String,
      required: true
  }
});

const Admin = mongoose.model('Admin', adminSchema);

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  imageLink: String,
  published: Boolean
});

const Course = mongoose.model('Course', courseSchema);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
      type: String,
      required: true
  },
  purchasedCourses: [courseSchema]
});

const User = mongoose.model('User', userSchema);


const userSecret = 'usersecret';
const adminSecret= 'adminsecret';

const generateUserToken = (user) => {
  // logic to generate token
  return jwt.sign(user, userSecret, { expiresIn: '1h' });
};

const generateAdminToken = (admin) => {
  // logic to generate token
  return jwt.sign(admin, adminSecret, { expiresIn: '1h' });
};

const authenticateUser = (req, res, next) => {
  // logic to authenticate user
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, userSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  // logic to authenticate admin
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, adminSecret, (err, admin) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.admin = admin;
    next();
  });
};





// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const { username, password } = req.body;
  function callback(admin) {
    if (admin) {
      return res.status(403).json({ message: 'Admin already exists' });
    }
    Admin.create({ username, password });
    const token = generateAdminToken({ username });
    res.status(201).json({ message: 'Admin created successfully', token });
  }
  Admin.findOne({ username }).then(callback);
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  function callback(admin) {
    if (!admin) {
      return res.status(403).json({ message: 'Invalid username or password' });
    }
    if (admin.password !== password) {
      return res.status(403).json({ message: 'Invalid username or password' });
    }
    const token = generateAdminToken({ username });
    res.status(200).json({ message: 'Logged in successfully', token });
  }
  Admin.findOne({ username }).then(callback);
});

app.post('/admin/courses',authenticateAdmin, (req, res) => {
  // logic to create a course
  const { title, description, price, imageLink, published } = req.body;
  function callback(course) {
    if (course) {
      return res.status(400).json({ message: 'Course already exists' });
    }
    Course.create({ title, description, price, imageLink, published });
    res.status(201).json({ message: 'Course created successfully' });
  }
  Course.findOne({ title }).then(callback);
});

app.put('/admin/courses/:courseId',authenticateAdmin, (req, res) => {
  // logic to edit a course
  const { title, description, price, imageLink, published } = req.body;
  const { courseId } = req.params;
  function callback(course) {
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    course.title = title;
    course.description = description;
    course.price = price;
    course.imageLink = imageLink;
    course.published = published;
    course.save();
    res.status(200).json({ message: 'Course updated successfully' });
  }
  Course.findOne({ _id: courseId }).then(callback);
});

app.get('/admin/courses',authenticateAdmin, (req, res) => {
  // logic to get all courses
  function callback(courses) {
    res.status(200).json({ courses });
  }
  Course.find({}).then(callback);
});
// User routes

app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  function callback(user) {
    if(user){
      return res.status(403).json({ message: 'User already exists' });
    }
    User.create({ username, password, purchasedCourses: [] }
    );
    const token = generateUserToken({ username });
    res.status(201).json({ message: 'User created successfully', token });
  }
  User.findOne({ username }).then(callback);
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  function callback(user) {
    if(!user){
      return res.status(403).json({ message: 'Invalid username or password' });
    }
    if(user.password !== password){
      return res.status(403).json({ message: 'Invalid username or password' });
    }
    const token = generateUserToken({ username });
    res.status(200).json({ message: 'Logged in successfully', token }); 
  }
  User.findOne({ username }).then(callback);
});

app.get('/users/courses',authenticateUser, (req, res) => {
  // logic to list all courses
  function callback(courses) {
    res.status(200).json({ courses });
  }
  Course.find({}).then(callback);
});

app.post('/users/courses/:courseId',authenticateUser, (req, res) => {
  // logic to purchase a course
  const course_Id=req.params.courseId;
  function callback(course) {
    if(!course){
      return res.status(404).json({ message: 'Course not found' });
    }
    User.findOne({ username: req.user.username }).then(user => {
      if(user.purchasedCourses.find(course => course._id === course_Id)){
        return res.status(400).json({ message: 'Course already purchased' });
      }
      user.purchasedCourses.push(course);
      user.save();
      res.status(200).json({ message: 'Course purchased successfully' });
    });
  }
  Course.findOne({ _id: course_Id }).then(callback);
});



app.get('/users/purchasedCourses',authenticateUser, (req, res) => {
  // logic to view purchased courses
  function callback(user) {
    res.status(200).json({ purchasedCourses: user.purchasedCourses });
  }
  User.findOne({ username: req.user.username }).then(callback);
});

app.listen(3000, () => console.log('Server listening on port 3000'));
