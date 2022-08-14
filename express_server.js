/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Configuration
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const express = require('express');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Internal Modules
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const {getUserByEmail} = require('./helpers');
const {urlsForUser} = require('./helpers');
const {urlDatabase} = require('./database');
const {users} = require('./database');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Template engines (Ejs)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.set('view engine','ejs');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Middleware
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['HILHL'],
  maxAge: 24 * 60 * 60 * 1000
})
);
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Generate ID
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const generateRandomString = () => {
  let result = '';
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 6; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Get Requests
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////// Routes
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/urls',(req,res) => {

  const userId = req.session.user_id;
  if (!userId) {
    res.send(`<div><h1>You have to login</h1>
    <p>You can use one of these links:</p>
    <a href='/register'>Register</a>
    <a href='/login'>Login</a><div>`);
  }

  const user = users[userId];

  const templateVars = { urls: urlDatabase, user};
  return  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  const userId = req.session.user_id;
  if (userId) {
    const user = users[userId];
    let countNew = user['numVisitNew'] += 1;
    const templateVars = {
      user,
      countNew
    };
    return res.render("urls_new", templateVars);
  }
  return res.redirect('/login');
});

/**
 ** Get requests to the endpoint "/u/:id" will redirect to its longURL
*/

app.get("/u/:id", (req, res) => {

  const longURL = urlDatabase[req.params.id];

  if (!longURL) {
    return res.send(`<h2>This url was not added</h2>`);
  }
  return res.redirect(longURL['longURL']);
});

/**
 ** Get particular URL to update (showing the user their newly created short url on the app)
*/

app.get("/urls/:id", (req, res) => {

  const userId = req.session.user_id;

  const urlUser = urlsForUser(userId,urlDatabase);
  if (!userId) {
    return  res.send('<h2>Please signin</h2>');
  }
  if (urlUser) {
    const user = users[userId];
    let countEdit = user['numVisitEdit'] += 1;
    const id = req.params.id;
    const templateVars = { id, longURL:urlUser, user, countEdit};
    return  res.render("urls_show", templateVars);
  }
  return  res.send(`<h2>You haven't added this url</h2>`);
});

/**
 ** Get register
*/

app.get('/register',(req,res)=>{

  const userId = req.session.user_id;

  if (userId) {
    return  res.redirect('/urls');
  }
  const user = users[userId];
  const templateVars = {
    user
  };
  return res.render("urls-registration",templateVars);
});

/**
 ** Get Login
*/

app.get('/login',(req,res)=>{

  const userId = req.session.user_id;

  if (userId) {
    return  res.redirect('/urls');
  }
  const user = users[userId];
  const templateVars = {
    user
  };
  return res.render("urls-login",templateVars);
});

/**
 **POST NEW URLs
*/

app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  if (!userId) {
    return res.send(`<h1>You must be login</h1>`);
  }
  const newId = generateRandomString();
  urlDatabase[newId] = {longURL:req.body.longURL,
    userID:userId};
  return res.redirect(`/urls/${newId}`);
});

/**
 **POST Edit URLs
*/

app.put('/urls/:id',(req,res)=>{

  const userId = req.session.user_id;
  const urlUser = urlsForUser(userId,urlDatabase);
  if (urlUser) {
    const id = req.params.id;
    urlDatabase[id] = {longURL:req.body.newURL,userID:userId};
    return  res.redirect('/urls');
  }
  return res.send(`<h2>You can not edit this URL</h2>`);
});

/**
 **POST Delete URLs
*/

app.delete('/urls/:id',(req,res)=>{

  const userId = req.session.user_id;
  const urlUser = urlsForUser(userId,urlDatabase);
  if (urlUser) {
    const id = req.params.id;
    delete urlDatabase[id];
    return  res.redirect('/urls');
  }
  return res.send(`<h2>You can not delete this URL</h2>`);
});

/**
 ** Post Login
 */

app.post('/login',(req,res)=>{
  const email = req.body.email;
  const password = req.body.password;
  const generateId = generateRandomString();
  const userId = req.session.user_id = generateId;


  
  const value = {
    id : generateId,
    email,
    password :  bcrypt.hashSync(password , salt),
    userId,
    numVisitNew : 0,
    numVisitEdit :0
  };

  users[generateId] = value;
 
  //using helper function
  const user = getUserByEmail(email,users);


  //cheking if the user has registerd befor (using helper function)
  if (!user) {
    return res.status(403).send('You are not registered yet');
  }

  //checking if the username and pasword match
  if (user) {
    if (password === users[user]['password']) {

      req.session['user_id'] = generateId;
      return  res.redirect('/urls');
    }
  }
  return res.status(403).send('email or password doesn\'t match');
});

/**
 ** Logout routes
 */

app.post('/logout',(req,res)=>{
  req.session = null;
  return  res.redirect('/urls');
});

/**
 ** Post register
*/

app.post('/register',(req,res)=>{
  const generateId = generateRandomString();
  const id = generateId;
  const email = req.body.email;
  const password = req.body.password;
  const userId = req.session['user_id'] = generateId;

  //collecting id, email and password as a value to assign it to users database
  const value = {
    id,
    email,
    password :  bcrypt.hashSync(password , salt),
    userId,
    numVisitNew : 0,
    numVisitEdit :0
  };


  //checking if email or password is not inserted.
  if (value.email === '' || value.password === '') {
    return  res.status(404).send("Email or Password is missed");
  }

  //checking if you have registerd before(your data is in the db).
  const findEmail = getUserByEmail(value.email,users);

  if (findEmail) {
    return  res.status(400).send("Email exists");
  }
  
  users[generateId] = value;

  req.session['user_id'] = generateId;
  return res.redirect('/urls');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Listener
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT,()=>{
  console.log(`Example app listening on port ${PORT}!`);
});