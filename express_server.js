/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Configuration
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Template engines (Ejs)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.set('view engine','ejs');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Middleware
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(cookieParser());
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
  "b2xVn2":{longURL:"http://www.lighthouselabs.ca",userID: "aJ48lW"} ,
  "9sm5xK":{longURL:"http://www.google.com",userID: "aJ48lW"} ,
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
  return false;
};


const urlsForUser = (id) =>{
  for (let key in urlDatabase) {
    if (id === urlDatabase[key]['userID'])
      return urlDatabase[key]['longURL'];
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
  if (!userId) {
    res.send(`<h1>You have to login</h1>`);
  }



  const user = users[userId];

  const templateVars = { urls: urlDatabase,user
  };
  return  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  if (userId) {
    const user = users[userId];
    const templateVars = {
      user
    };
    return res.render("urls_new", templateVars);
  }
  res.redirect('/login');
});

/**
 ** Get requests to the endpoint "/u/:id" will redirect to its longURL
*/
app.get("/u/:id", (req, res) => {

  const longURL = urlDatabase[req.params.id]['longURL'];

  if (!longURL) {
    res.send(`<h2>This url was not added</h2>`);
  }
  res.redirect(longURL);
});
/**
 ** Get particular URL to update (showing the user their newly created short url on the app)
*/
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies['user_id'];

  const urlUser = urlsForUser(userId);
  if (!userId) {
    return  res.send('<h2>Please signin</h2>');
  }
  if (urlUser) {
    const user = users[userId];
    const id = req.params.id;
    const templateVars = { id, longURL:urlUser,user};
    return  res.render("urls_show", templateVars);
  }

  return  res.send(`<h2>You haven't added this url</h2>`);
});

/**
 ** Get register
*/

app.get('/register',(req,res)=>{
  const userId = req.cookies['user_id'];
  if (userId) {
    res.redirect('/urls');
  }
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
  if (userId) {
    res.redirect('/urls');
  }
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
  const userId = req.cookies['user_id'];
  if (!userId) {
    return res.send(`<h1>You must be login</h1>`);
  }
  const newId = generateRandomString();
  urlDatabase[newId] = {longURL:req.body.longURL,
    userID:userId};
  res.redirect(`/urls/${newId}`);
});

/**
 **POST Edit URLs
*/

app.post('/urls/edit/:id',(req,res)=>{
  const userId = req.cookies['user_id'];
  const urlUser = urlsForUser(userId);
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

app.post('/urls/:id/delete',(req,res)=>{
  const userId = req.cookies['user_id'];
  const urlUser = urlsForUser(userId);
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


  const value = {
    id : generateId,
    email,
    password :  bcrypt.hashSync(password , salt),
    userId : req.cookies['user_id'],
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
  const id = generateId;
  const email = req.body.email;
  const password = req.body.password;
  const userId = res.cookie('user_id',generateId);

  const value = {
    id,
    email,
    password :  bcrypt.hashSync(password , salt),
    userId,
  };

  //checking if email or password is not inserted.
  if (value.email === '' || value.password === '') {
    return  res.status(404).send("Email or Password is missed");
  }

  //checking if you have registerd before(your data is in the db).
  const findEmail = findUserByEmail(value.email);

  if (findEmail) {
    return  res.status(400).send("Email exists");
  }
  
  users[generateId] = value;
  res.cookie('user_id',generateId);
  res.redirect('/urls');
});

/**
 ** 404 error
*/





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Listener
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT,()=>{
  console.log(`Example app listening on port ${PORT}!`);
});