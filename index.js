// Import required modules
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import request from 'request';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
console.log(apiKey)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create instances
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

function hash(inputString) {
  const sha256Hash = crypto.createHash('sha256');
  sha256Hash.update(inputString);
  return sha256Hash.digest('hex');
}

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      url: 'https://pacific-posydon.harperdbcloud.com',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({
        operation: 'sql',
        sql: sql
      })
    };

    request(options, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(response.body));
      }
    });
  });
}

async function addRoom(name, password) {
  let response = await executeSQL(`INSERT INTO atlantic.rooms (name, password) VALUES ('${name}', '${password}');`)
  return response;
}

async function addUser(username, password) {
  let hashedPass = hash(password);
  let response = await executeSQL(`INSERT INTO atlantic.users (username, password) VALUES ('${username}', '${hashedPass}')`);
  return response;
}

async function getUsers() {
  let response = await executeSQL("SELECT * FROM atlantic.users");
  return response;
}

async function getRooms() {
  let response = await executeSQL("SELECT * FROM atlantic.rooms");
  return response;
}

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Handle routes
app.get('/', async (req, res) => {
  if (req.session.username) {
    let rooms = await getRooms();
    res.render('main', {rooms: rooms, username: req.session.username});
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
    res.render('login'); // Render the 'login.ejs' file from the 'views' directory
});

app.get('/room', async (req, res) => {
  if (req.session.username) {
    let rooms = await getRooms();
    /*
    if the room exisits:
      if the room is private:
        if you have authentication to enter the room:
          join room
        else:
          redirect to authentication
      else:
        join the room
    else:
      send 404
    */
    for (const room of rooms) {
      console.log(room)
      if (room.id == req.query.roomId) {
        if (room.password != "none") {
          for (const room of req.session.authenticatedFor) {
            if (room.id = req.query.roomId) {
              res.render('room', {username: req.session.username, roomId:req.query.roomId});
              return;
            }
          }
          res.redirect('/room_password_entry?roomId='+req.query.roomId);
          return;
        } else {
          res.render('room', {username: req.session.username, roomId:req.query.roomId});
          return;
        }
      }
    }
    res.sendStatus(404);
  } else {
    res.redirect('/login');
  }
});

app.get('/room_password_entry', (req, res) => {
  let roomId = req.query.roomId
  res.render('password_entry', { roomId });
});

app.post('/verify_room_password', async (req, res) => {
  let { password } = req.body;
  let rooms = await getRooms()
  for (const room of rooms) {
    if (room.id == req.query.roomId) {
      if (room.password == password) {
        req.session.authenticatedFor.push(room);
        res.redirect('/room?roomId='+req.query.roomId);
        return;
      } else {
        res.redirect('/room_password_entry?roomId='+req.query.roomId);
        return;
      }
    }
  }
  res.sendStatus(404);
})

app.post('/executeLogin', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    const users = await getUsers();
    console.log(users)
    for (const user of users) {
      let currentUserHashedPass = hash(password)
      if (user.username == username) {
        console.log('usernames match')
        if (user.password == currentUserHashedPass) {
          console.log('passwrds match')
          req.session.username = username;
          req.session.authenticatedFor = [];
          res.redirect('/');
          return;
        } else {
          res.redirect('/login');
          return;
        }
      }
    }
});

app.post('/executeCreateAccount', (req, res) => {
  let { username, password } = req.body;
  addUser(username, password);
  res.redirect('/login');
});

app.get('/create_account', (req, res) => {
  res.render('create_account');
})

// Set up socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('establish', (data) => {
      console.log(data);
      socket.join(data.room);
    });

    socket.on('newMessage', (data) => {
      // Broadcast the message to all clients in the room
      console.log(data);
      io.to(data.roomId).emit('newMessage', {message:data.message, sender: data.username});
    });
});

// Start the server
server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
