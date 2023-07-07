const express = require('express');
const app = express();

app.use(express.json());
app.use(cors());

let ADMINS = [];
let USERS = [];
let COURSES = [];

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
    return res.status(201).json({ message: 'Admin created successfully' });
  }

});

app.post('/admin/login',adminAuthentication, (req, res) => {
  // logic to log in admin
 res.status(200).json({ message: 'Logged in successfully' });
});

app.post('/admin/courses', adminAuthentication , (req, res) => {
  // logic to create a course
  const { title, description, price, imageLink, published } = req.body;
  if (!title || !description || !price || !imageLink || !published) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  else {
    // const courseId =Math.floor(Math.random()*1000);
    const courseId = Date.now();
    if(COURSES.find(course => course.title === title)){
      return res.status(400).json({ message: 'Course already exists' });
    }
    else
    {
    COURSES.push({ id: courseId, title, description, price, imageLink, published });
    return res.status(201).json({ message: 'Course created successfully', courseId });
  }
  }
});

app.put('/admin/courses/:courseId', adminAuthentication,(req, res) => {
  // logic to edit a course
  const courseId = parseInt(req.params.courseId);
  const { title, description, price, imageLink, published } = req.body;
    if (!(COURSES.find(course => course.id ===courseId))) {
      return res.status(400).json({ message: 'Course does not exist' });
    }
    else {
      const course = COURSES.find(course => course.id === parseInt(courseId));
      course.id = courseId;
      course.title = title;
      course.description = description;
      course.price = price;
      course.imageLink = imageLink;
      course.published = published;
      return res.status(200).json({ message: 'Course updated successfully' });
  }
});

app.get('/admin/courses',adminAuthentication, (req, res) => {
  // logic to get all courses
  return res.status(200).json({ courses: COURSES });
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const { username, password,courses={} } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (USERS.find(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  else {
    USERS.push({ username, password,purchasedCourses:[] });
    return res.status(201).json({ message: 'User created successfully' });
  }
});

app.post('/users/login',userAuthentication, (req, res) => {
  // logic to log in user
  res.status(200).json({ message: 'Logged in successfully' });
});

app.get('/users/courses',userAuthentication, (req, res) => {
  // logic to list all courses
  return res.status(200).json({ courses: COURSES });
});

app.post('/users/courses/:courseId',userAuthentication, (req, res) => {
  // logic to purchase a course
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find(course => course.id === courseId);
  if (!course) {
    return res.status(400).json({ message: 'Course does not exist' });
  }
  else {
    const user = USERS.find(user => user.username === req.headers.username);
    if (user.purchasedCourses.find(course => course.id === courseId)) {
      return res.status(400).json({ message: 'Course already purchased' });
    }
    else {
      user.purchasedCourses.push({id:courseId});
      return res.status(200).json({ message: 'Course purchased successfully' });
    }
  }
}
);

app.get('/users/purchasedCourses',userAuthentication, (req, res) => {
  // logic to view purchased courses
  const user = USERS.find(user => user.username === req.headers.username);
  const courses=COURSES.filter(course => user.purchasedCourses.find(purchasedCourse => purchasedCourse.id === course.id));
  return res.status(200).json({ courses});
});

app.get('/' , (req, res) => {
  res.status(200).json({ message: 'Welcome to the course app' });
});
// Authentication middleware
function adminAuthentication(req, res, next) {
  // logic to authenticate admin
  const { username, password } = req.headers;
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (!ADMINS.find(admin => admin.username === username)) {
    return res.status(400).json({ message: 'Admin does not exist' });
  }
  else {
    const admin = ADMINS.find(admin => admin.username === username);
    if (admin.password === password) {
      next();
    }
    else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  }
}

function userAuthentication(req, res, next) {
  // logic to authenticate user
  const { username, password } = req.headers;
  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (!USERS.find(user => user.username === username)) {
    return res.status(400).json({ message: 'User does not exist' });
  }
  else {
    const user = USERS.find(user => user.username === username);
    if (user.password === password) {
      next();
    }
    else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  }
}


const port =3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});