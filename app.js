const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
app.use(express.json());
const bcrypt = require("bcrypt");
let dbpath = path.join(__dirname, "userData.db");
let db = null;

let initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db error ${e.message}`);
  }
};

initializationDbAndServer();

// post user
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let usercheck = `SELECT * FROM user WHERE username = '${username}';`;
  let checkingResponse = await db.get(usercheck);
  if (checkingResponse === undefined) {
    if (password.length < 5) {
      response.status(400);
      return response.send("Password is too short");
    } else {
      let hashedpassword = await bcrypt.hash(password, 10);
      let addquery = `INSERT INTO user
           VALUES('${username}','${name}','${hashedpassword}','${gender}','${location}');`;
      let dbresponse = await db.run(addquery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//user login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  let usercheck = `SELECT * FROM user 
    WHERE username = '${username}';`;
  let checkingResponse = await db.get(usercheck);
  if (checkingResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let passwordcheck = await bcrypt.compare(
      password,
      checkingResponse.password
    );
    if (passwordcheck === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//user change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  let usercheck = `SELECT * FROM user 
    WHERE username = '${username}';`;
  let checkingResponse = await db.get(usercheck);
  let passwordcheck = await bcrypt.compare(
    oldPassword,
    checkingResponse.password
  );
  if (passwordcheck === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedpassword = await bcrypt.hash(newPassword, 10);
      let updatequery = `UPDATE user 
                SET password = '${hashedpassword}';`;
      let updateresponse = await db.run(updatequery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
