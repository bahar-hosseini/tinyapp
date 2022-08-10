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
///////Mock Database
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL:urlDatabase[req.params.id] ,username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

/**
 ** Get register
*/

app.get('/register',(req,res)=>{
  res.render("urls-registration");
});


/**
 **POST NEW UR
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

app.post('/login',(req,res)=>{
  const value = req.body.username;
  res.cookie('username',value);
  res.redirect('/urls');
});

/**
 ** Logout routes
 */

app.post('/logout',(req,res)=>{
  res.clearCookie('username');
  res.redirect('/urls');
});

/**
 ** Post register
*/




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Listener
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT,()=>{
  console.log(`Example app listening on port ${PORT}!`);
});