/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Configuration
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
app.use(cookieParser());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Template engines (Ejs)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.set('view engine','ejs');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Middleware
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
///////Mock Databases
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  UZtT4V: {
    id: "UZtT4V",
    email: "bahar.h@gmail.com",
    password: "qazwsx",
  },
  NxFM3y: {
    id: "NxFM3y",
    email: "bahar_hssn@example.com",
    password: "edcrfv",
  },
};


/**
 ** Helper function
*/

const findUserByEmail = (email) => {
  for (let userId in users) {
    if (users[userId]['email'] === email) {
      return users[userId];
    }
  }
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
  const userId = req.cookies['user_id'];
  const user = users[userId];

  const templateVars = { urls: urlDatabase,user
  };
  return  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = {
    user
  };
  return  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = { id: req.params.id, longURL:urlDatabase[req.params.id],user};

  res.render("urls_show", templateVars);

});

/**
 ** Get register
*/

app.get('/register',(req,res)=>{

  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = {
    user
  };
  res.render("urls-registration",templateVars);
});

/**
 ** Get Login
*/

app.get('/login',(req,res)=>{
  
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = {
    user
  };
  res.render("urls-login",templateVars);
});

/**
 **POST NEW URLs
*/

app.post("/urls", (req, res) => {
  const newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;
  res.redirect(`/urls/${newId}`);
});

/**
 **POST Edit URLs
*/

app.post('/urls/edit/:id',(req,res)=>{
  const id = req.params.id;
  urlDatabase[id] = req.body.newURL;
  res.redirect('/urls');
});

/**
 **POST Delete URLs
*/

app.post('/urls/:id/delete',(req,res)=>{
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

/**
 ** Post Login
 */

app.post('/login',(req,res)=>{
  const email = req.body.email;
  const password = req.body.password;
  const generateId = generateRandomString();
  const value = {
    id : generateId,
    email : req.body.email,
    password: req.body.password,
  };
  users[generateId] = value;
  
  const user = findUserByEmail(value.email);

  if (!user) {
    return res.status(403).send('You are not registered yet');
  }

  for (let user in users) {
    if (email === users[user]['email']) {
      if (password === users[user]['password']) {
        res.cookie('user_id',generateId);
        res.redirect('/urls');
      }
    }
    return res.status(403).send('email or password doesn\'t match');
  }

});

/**
 ** Logout routes
 */

app.post('/logout',(req,res)=>{
  res.clearCookie('user_id');
  res.redirect('/urls');
});

/**
 ** Post register
*/

app.post('/register',(req,res)=>{
  const generateId = generateRandomString();
  const value = {
    id : generateId,
    email : req.body.email,
    password: req.body.password,
    userId : res.cookie('user_id',generateId)
  };
  //check if email or password is not inserted.
  if (value.email === '' || value.password === '') {
    return  res.status(404).send("Email or Password is missed");
  }

  //check if you have registerd before(your data is in the db).
  const findEmail = findUserByEmail(value.email);
  if (findEmail) {
    return  res.status(400).send("Email exists");
  }
  
  users[generateId] = value;
  res.cookie('user_id',generateId);
  res.redirect('/urls');
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Listener
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT,()=>{
  console.log(`Example app listening on port ${PORT}!`);
});