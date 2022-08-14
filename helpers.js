/**
 ** Helper function
*/

const getUserByEmail = (email,database) => {
  for (let userId in database) {
    if (database[userId]['email'] === email) {
      return userId;
    }
  }
  return false;
};


const urlsForUser = (id,database) =>{
  for (let key in database) {
    if (id === database[key]['userID'])
      return database[key]['longURL'];
  }
};




module.exports = {getUserByEmail, urlsForUser};