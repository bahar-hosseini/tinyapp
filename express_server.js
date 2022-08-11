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
  // if (user) {
  //   templateVars.user = user;
  // }
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
 ** Login Route that is a post request
 */

// app.post('/login',(req,res)=>{
//   const value = req.body.username;
//   res.cookie('username',value);
//   res.redirect('/urls');
// });

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
    password: req.body.password
  };
  if (value.email === '' || value.password === '') {
    return  res.status(404).send("Email or Password is missed");
  }
  for (let user in users) {
    if (value.email === users[user]['email']) {
      return  res.status(400).send("Email exists");
    }
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