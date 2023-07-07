const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const fs = require('fs');

app.use(express.json());
let ADMINS = fs.readFileSync('./ADMINS.json', 'utf-8');
ADMINS = JSON.parse(ADMINS);
let USERS = fs.readFileSync('./USERS.json', 'utf-8');
USERS = JSON.parse(USERS);
let COURSES = fs.readFileSync('./COURSES.json', 'utf-8');
COURSES = JSON.parse(COURSES);

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
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (ADMINS.find(admin => admin.username === username)) {
    return res.status(400).json({ message: 'Admin already exists' });
  }
  else {
    ADMINS.push({ username, password });
    fs.writeFileSync('./ADMINS.json', JSON.stringify(ADMINS));
    const token = generateAdminToken({ username });
    return res.status(201).json({ message: 'Admin created successfully', token });
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  const admin = ADMINS.find(admin => admin.username === username);
  if (!admin) {
    return res.status(400).json({ message: 'Admin does not exist' });
  }
  if (admin.password !== password) {
    return res.status(400).json({ message: 'Invalid password' });
  }
  const token = generateAdminToken({ username });
  return res.status(200).json({ message: 'Logged in successfully', token });
});

app.post('/admin/courses',authenticateAdmin, (req, res) => {
  // logic to create a course
  const { title, description, price, imageLink, published } = req.body;
  if (!title || !description || !price || !imageLink || !published) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  const courseId = COURSES.length + 1;
  COURSES.push({ course_id: courseId, title, description, price, imageLink, published });
  fs.writeFileSync('./COURSES.json', JSON.stringify(COURSES));
  return res.status(201).json({ message: 'Course created successfully', courseId });
});

app.put('/admin/courses/:courseId',authenticateAdmin, (req, res) => {
  // logic to edit a course
  const { title, description, price, imageLink, published } = req.body;
  const { courseId } = req.params;
  const course = COURSES.find(course => course.course_id === parseInt(courseId));
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }
  course.title = title;
  course.description = description;
  course.price = price;
  course.imageLink = imageLink;
  course.published = published;
  fs.writeFileSync('./COURSES.json', JSON.stringify(COURSES));
  return res.status(200).json({ message: 'Course updated successfully' });
});

app.get('/admin/courses',authenticateAdmin, (req, res) => {
  // logic to get all courses
  return res.status(200).json({ courses: COURSES });
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (USERS.find(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  else {
    USERS.push({ username, password, purchasedCourses: [] });
    fs.writeFileSync('./USERS.json', JSON.stringify(USERS));
    return res.status(201).json({ message: 'User created successfully', token: generateUserToken({ username }) });
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  const user = USERS.find(user => user.username === username);
  if (!user) {
    return res.status(400).json({ message: 'User does not exist' });
  }
  if (user.password !== password) {
    return res.status(400).json({ message: 'Invalid password' });
  }
  return res.status(200).json({ message: 'Logged in successfully', token: generateUserToken({ username }) });
});

app.get('/users/courses',authenticateUser, (req, res) => {
  // logic to list all courses
  return res.status(200).json({courses:COURSES.filter(course=>course.published)});
});

app.post('/users/courses/:courseId',authenticateUser, (req, res) => {
  // logic to purchase a course
  const { courseId } = req.params;
  const course = COURSES.find(course => course.course_id === parseInt(courseId));
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }
  const user = USERS.find(user => user.username === req.user.username);
  if (user.purchasedCourses.includes(courseId)) {
    fs.writeFileSync('./USERS.json', JSON.stringify(USERS));
    return res.status(400).json({ message: 'Course already purchased' });
  }
  user.purchasedCourses.push(courseId);
  return res.status(200).json({ message: 'Course purchased successfully' });
});

app.get('/users/purchasedCourses',authenticateUser, (req, res) => {
  // logic to view purchased courses
  const user = USERS.find(user => user.username === req.user.username);
  const purchasedCourses = COURSES.filter(course => user.purchasedCourses.includes(course.course_id));
  return res.status(200).json({ purchasedCourses });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});