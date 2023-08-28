// Import required modules
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import request from 'request';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { marked } from 'marked';
import fs from 'fs';
import dotenv from 'dotenv';
import expressSocketIO from 'express-socket.io-session'; // Import express-socket.io-session
dotenv.config();

const apiKey = process.env.API_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iv = Buffer.from(process.env.IV, 'hex');
const secretKey = Buffer.from(process.env.ENCRYPT_KEY, 'hex');
const legalDocuments = ['legal_1.md', 'legal_2.md', 'legal_3.md'];

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

function encrypt(data) {
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
  let encryptedData = cipher.update(data, 'utf-8', 'base64');
  encryptedData += cipher.final('base64');
  return encryptedData;
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
  let decryptedData = decipher.update(encryptedData, 'base64', 'utf-8');
  decryptedData += decipher.final('utf-8');
  return decryptedData;
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

async function idFromName(name) {
  let rooms = await getRooms();
  for (let room of rooms) {
    if (room.name == name) {
      return room.id;
    }
  }
  return 404;
}

async function locationFromIp(ipAddress) {
  try {
    const response = await fetch(`http://ipinfo.io/${ipAddress}/json`);
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        location: data.loc,
        organization: data.org,
      };
    } else {
      throw new Error('Response not OK');
    }
  } catch (error) {
    console.error('Error fetching location:', error.message);
    return null;
  }
}

async function addRoom(name, password) {
  let response = await executeSQL(`INSERT INTO atlantic.rooms (name, password) VALUES ('${name}', '${password}');`)
  return response;
}

async function addUser(username, password, theme) {
  let hashedPass = hash(password);
  let response = await executeSQL(`INSERT INTO atlantic.users (username, password, theme, admin, owner) VALUES ('${username}', '${hashedPass}', '${theme}', false, false)`);
  return response;
}

async function removeRoom(roomId) {
  let response = await executeSQL(`DELETE FROM atlantic.rooms WHERE id="${roomId}"`)
  return response;
}

async function updateUser(id, username, password, theme, session) {
  let localUsername;
  let localPassword;
  let localTheme
  localUsername = (username === "") ? session.username : username;
  localPassword = (password === "") ? session.hashedPassword : hash(password);
  localTheme = (theme === "") ? session.theme : theme;
  let response = executeSQL(`UPDATE atlantic.users SET username = "${localUsername}", password = "${localPassword}", theme = "${localTheme}" WHERE id="${id}";`);
  return "idk";
}
//let responseTheme = await executeSQL(`UPDATE atlantic.users SET theme = "${theme}" WHERE id="${id}";`);

async function getUsers() {
  let response = await executeSQL("SELECT * FROM atlantic.users");
  return response;
}

async function getRooms() {
  let response = await executeSQL("SELECT * FROM atlantic.rooms");
  return response;
}

// Set up session middleware
const sessionMiddleware = session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
});

app.use(sessionMiddleware);
io.use(expressSocketIO(sessionMiddleware));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Handle routes
app.get('/', async (req, res) => {
  if (req.session.username) {
    let rooms = await getRooms();
    if (req.session.admin) {
      res.render('main_admin', {rooms: rooms, username: req.session.username, theme: req.session.theme});
    } else {
      res.render('main', {rooms: rooms, username: req.session.username, theme: req.session.theme});
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
    res.render('login'); // Render the 'login.ejs' file from the 'views' directory
});

app.get('/create_room', (req, res) => {
  if (req.session.admin) {
    res.render('create_room_admin', {theme: req.session.theme, username: req.session.username});
  } else {
    res.render('create_room', {theme: req.session.theme, username: req.session.username});
  }
});

app.post('/executeCreateRoom', async (req, res) => {
  if (req.session.admin) {
    let { roomName, roomPassword} = req.body;
    console.log(roomName, roomPassword);
    await addRoom(roomName, roomPassword);
    //let roomId = await idFromName(name);
    res.redirect("/")
  } else{
    let { roomName, roomPassword } = req.body;
    await addRoom(roomName, roomPassword);
    let roomId = await idFromName(roomName);
    res.redirect('/room?roomId'+roomId)
  }
});

app.get('/deleteRoom', async (req, res) => {
  if (req.session.admin) {
    let response = await removeRoom(req.query.roomId);
    console.log(`deleted ${req.query.roomId}: ${JSON.stringify(response, null, 2)}`)
    res.redirect("/")
  } else{
    res.redirect("/")
  }
});

app.post('/changeSettings', async (req, res) => {
  if (req.session.username) {
    let { username, password, theme } = req.body;
    let response = await updateUser(req.session.databaseId, username, password, theme, req.session);
    console.log(`updated ${req.session.databaseId}: ${username}, ${password}, ${theme}: ${response}`);
    req.session.destroy();
    res.redirect("/");
  } else {
    res.redirect("/login");
  }

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
              if (req.session.admin) {
                res.render('room_admin', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
                return;
              } else {
                res.render('room', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
                return;
              }
            }
          }
          res.redirect('/room_password_entry?roomId='+req.query.roomId);
          return;
        } else {
          if (req.session.admin) {
            console.log("rendering admin for "+req.session.username)
            res.render('room_admin', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
            return;
          } else {
            res.render('room', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
            return;
          }
        }
      }
    }
    res.sendStatus(404);
  } else {
    res.redirect('/login');
  }
});

app.get('/room_password_entry', (req, res) => {
  if (req.session.username) {
    let roomId = req.query.roomId;
    res.render('password_entry', {roomId:roomId, theme:req.session.theme});
  } else {
    res.redirect("/login");
  }

});

app.post('/verifyRoomPassword', async (req, res) => {
  if (req.session.username) {
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
  } else {
    res.redirect("/login")
  }
});

app.post('/executeLogin', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    const users = await getUsers();
    for (const user of users) {
      let currentUserHashedPass = hash(password)
      if (user.username == username) {
        if (user.password == currentUserHashedPass) {
          req.session.username = username;
          req.session.authenticatedFor = [];
          req.session.theme = user.theme;
          req.session.databaseId = user.id;
          req.session.hashedPassword = user.password;
          req.session.encryptedPassword = encrypt(user.password);
          req.session.admin = user.admin
          try {
            req.session.ip = req.headers['x-forwarded-for'].split(", ")[0]; 
          } catch (error) {
            console.log( `error with ip getting: \n ${error}`);
          }
          req.session.nick = username;
          req.session.owner = user.owner;
          console.log("ip: "+req.session.ip)
          res.redirect('/');
          return;
        } else {
          res.redirect('/login');
          return;
        }
      }
    }
    res.redirect("/login")
});


app.post('/executeCreateAccount', (req, res) => {
  let { username, password } = req.body;
  addUser(username, password, 'light');
  res.redirect('/login');
});

app.get('/create_account', (req, res) => {
  res.render('create_account');
});

app.get('/help', (req, res) => {
  const markdownFilePath = path.join(__dirname, 'public', 'views', 'help.md');
  fs.readFile(markdownFilePath, 'utf-8', (err, markdownContent) => {
    if (err) {
      console.error('Error reading markdown file:', err);
      res.sendStatus(500);
    } else {
      const htmlContent = marked(markdownContent);
      res.send(htmlContent);
    }
  });
});

app.get('/legal', (req, res) => {
  const randomLegalIndex = Math.floor(Math.random() * legalDocuments.length);
  const legalFilePath = path.join(__dirname, 'public', 'views', legalDocuments[randomLegalIndex]);
  fs.readFile(legalFilePath, 'utf-8', (err, legalContent) => {
    if (err) {
      console.error('Error reading legal file:', err);
      res.sendStatus(500);
    } else {
      const htmlContent = marked(legalContent);
      res.send(htmlContent);
    }
  });
});


// Set up socket.io connections
io.on('connection', async (socket) => {
    console.log('A user connected');
    socket.join(socket.handshake.query.roomId);
    socket.emit('established', { message: 'Room joined successfully' });

    var clientIp = socket.handshake.remoteAddress;
    var isAdmin = socket.handshake.session.admin;
    var username = socket.handshake.session.username;
    var authenticatedFor = JSON.stringify(socket.handshake.session.authenticatedFor);
    var theme = socket.handshake.session.theme;
    var databaseId = socket.handshake.session.databaseId;
    var owner = socket.handshake.session.owner;
    
    try{
      var password = decrypt(socket.handshake.session.encryptedPassword);
    } catch {
      // req.session.destroy()
      // res.redirect("/login")
      var password = undefined;
    }
    
    var ip = socket.handshake.session.ip;
    var location = await locationFromIp(ip);
    //socket.handshake.session.admin;
    

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('establish', (data) => {
      console.log("establish: \n"+JSON.stringify(data));
      socket.join(data.roomId);
      socket.emit('established', { message: 'Room joined successfully' });
    });

    socket.on('newMessage', async (data) => {
      // Broadcast the message to all clients in the room
      console.log(data);
      const senderData = {
        clientIp,
        isAdmin,
        username,
        authenticatedFor,
        theme,
        databaseId,
        password,
        ip,
        location
      };
      
      const room = io.sockets.adapter.rooms.get(data.roomId);
      if (room) {
        for (const clientId of room) {
          const clientSocket = io.sockets.sockets.get(clientId);
          const clientIsAdmin = clientSocket.handshake.session.admin;
    
          const messageData = {
            message: data.message,
            sender: data.username,
            admin: isAdmin,
            owner: owner
          };
    
          if (clientIsAdmin) {
            messageData.senderData = senderData;
          }
          clientSocket.emit('newMessageForwarding', messageData);
        }
      }
    });
    
    // socket.on('newMessage', (data) => {
    //   // Broadcast the message to all clients in the room
    //   console.log(data);
    //   let senderData = { clientIp, isAdmin, username, authenticatedFor, theme, databaseId, password, ip, location }
    //   console.log(data.roomId)
    //   io.to(data.roomId).emit('newMessageForwarding', {message:data.message, sender: data.username, admin: isAdmin});
    // });
});

// Start the server
server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
