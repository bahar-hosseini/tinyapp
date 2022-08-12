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

module.exports = getUserByEmail;