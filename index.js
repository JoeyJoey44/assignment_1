// Index.js File For Assignment #1
// Joseph Jahanshahi
// A01384174

// Requires/Imports
require("./utils.js");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const Joi = require("joi");

const port = process.env.PORT || 3000;
const app = express();
const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

// Declares Constants From The .env (enviorment) File
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

console.log(mongodb_password);
var {database} = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

console.log(`mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`);

// Connects To Mongo DataBase Using URL
var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore,  
	saveUninitialized: false, 
	resave: true
}
));

// Ensure This Line Is Before Your Routes
app.use(express.static(__dirname + "/public")); 

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Create Login Form
app.get('/login', (req,res) => {
    var html = `
    log in
    <form action='/loggingin' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    <br>
    <a href="/createUser">Create a new account</a>
    `;
    res.send(html);
});

// Create New User Form
app.get('/createUser', (req,res) => {
    var html = `
    create user
    <form action='/submitUser' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

// Throw New User Data Into Console
app.post('/submitUser', async (req,res) => {
    var username = req.body.username;
    var password = req.body.password;

	const schema = Joi.object(
		{
			username: Joi.string().alphanum().max(20).required(),
			password: Joi.string().max(20).required()
		});
	
	const validationResult = schema.validate({username, password});
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/createUser");
	   return;
   }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
	
	await userCollection.insertOne({username: username, password: hashedPassword});
	console.log("Inserted user");

    res.redirect('/login');
});

app.post('/loggingin', async (req,res) => {
    var username = req.body.username;
    var password = req.body.password;

	const schema = Joi.string().max(20).required();
	const validationResult = schema.validate(username);
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/login");
	   return;
	}

	const result = await userCollection.find({username: username}).project({username: 1, password: 1, _id: 1}).toArray();

	console.log(result);
	if (result.length != 1) {
		console.log("user not found");
		res.redirect("/login");
		return;
	}
	if (await bcrypt.compare(password, result[0].password)) {
		console.log("correct password");
		req.session.authenticated = true;
		req.session.username = username;
		req.session.cookie.maxAge = expireTime;

        // Redirect To Welcome Page After Successful Login
		res.redirect('/welcome'); 
		return;
	}
	else {
		console.log("incorrect password");
		res.redirect("/login");
		return;
	}
});

app.get('/welcome', (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        console.log('Session ID:', req.sessionID); // Log The Session ID
        res.send(`
            <h1>Welcome, ${req.session.username}!</h1>
            <a href="/members">Members Area</a><br>
            <a href="/logout">Logout</a>
        `);
    }
});

app.get('/members', async (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        const result = await userCollection.find({username: req.session.username}).project({username: 1, _id: 0}).toArray();
        
        // Array of image names
        const images = ['image_1', 'image_2', 'image_3'];
        
        // Select a random image from the array
        const randomImage = images[Math.floor(Math.random() * images.length)];
        
        
    }
});

app.get('/logout', (req,res) => {
	req.session.destroy();
    res.redirect('/login');
});

app.get("*", (req,res) => {
	res.status(404);
	res.send("Error 404 - Page Not Found :(");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
});
console.log(`mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`);
