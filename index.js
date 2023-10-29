// Import required modules
//v3.0
//audio added
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
import argon2 from 'argon2';

dotenv.config();

//defining constants
const apiKey = process.env.API_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iv = Buffer.from(process.env.IV, 'hex');
const secretKey = Buffer.from(process.env.ENCRYPT_KEY, 'hex');
const legalDocuments = ['legal_1.md', 'legal_2.md', 'legal_3.md'];
const PORT = process.env.PORT;
const validCharacters = 'qwertyuiopaqsdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*():<>,./?~|1234567890';
//make sure to change hasInvalidCharacters() function as well^^^

/*
defining 
roomId: room
username: user 
data maps
*/
let roomMap = {};
let usersMap = {};

// Create instances
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const maxSecurity = true; // ok encryption is on and working
let onlineClients = {};

//defining security functions

async function argonHash(password) {
  try {
    const hash = await argon2.hash(password);
    return hash;
   } catch (err) {
    console.log("ERROR HASHING: " + err);
   }
}

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
} // ha ha nice

//defining database/sql functions
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

async function recordMessage(room_name_id, sender, target = null, content) {
  var response;
  if (room_name_id.split("_")[0] === "DM") {
    response = await executeSQL(`INSERT INTO atlantic.direct_messages (\`to\`, \`from\`, content, name) VALUES ('${target}', '${sender}', '${content}', '${room_name_id}');`);
  } else {
    response = await executeSQL(`INSERT INTO atlantic.messages (\`from\`, content, roomId) VALUES ('${sender}', '${content}', '${room_name_id}');`);
  }
}

async function getActiveDms(username) {
  let directMessages = await executeSQL(`SELECT * FROM atlantic.direct_messages;`);
  let results = [];
  for (const message of directMessages) {
    if (message.name.split("_").includes(username)) {
      results.push(message.name);
    }
  }
  if (results.length <= 0) {
    return false;
  } else {
    return results;
  }
}

async function addRoom(name, password) {
  let response = await executeSQL(`INSERT INTO atlantic.rooms (name, password) VALUES ('${name}', '${password}');`)
  return response;
}

async function addUser(username, password, theme) {
  let hashedPass = await argonHash(password);
  let response = await executeSQL(`INSERT INTO atlantic.users (username, password, theme, admin, owner) VALUES ('${username}', '${hashedPass}', '${theme}', false, false)`);
  return response;
}

async function removeRoom(roomId) {
  let response = await executeSQL(`DELETE FROM atlantic.rooms WHERE id="${roomId}"`);
  let response2 = await executeSQL(`DELETE FROM atlantic.messages WHERE roomId="${roomId}"`);
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

async function getPreviousMessages(room_id_name) {
  let isDm;
  let messages;
  try {
    isDm = room_id_name.split("_")[0]
  } catch (error) {
    isDm = false;
  }
  if (isDm == "DM") {
    let roomName = room_id_name;
    messages = await executeSQL(`SELECT * FROM atlantic.direct_messages WHERE name="${roomName}";`);
  } else {
    let roomId = room_id_name;
    messages = await executeSQL(`SELECT * FROM atlantic.messages WHERE roomId="${roomId}";`);
  }
  return messages;
}

async function getUsers() {
  let response = await executeSQL("SELECT * FROM atlantic.users");
  return response;
}

async function getRooms() {
  let response = await executeSQL("SELECT * FROM atlantic.rooms");
  return response;
}

//defining helper functions

async function updateRoomMap() {
  let rooms = await getRooms();
  roomMap = {};
  for(let room of rooms) {
    roomMap[room.id] = room;
  }
}

async function updateUserMap() {
  let users = await getUsers();
  usersMap = {};
  for(let user of users) {
    usersMap[user.username] = user;
  }
}


function removeDuplicates(arr) {
  return arr.filter((item,
      index) => arr.indexOf(item) === index);
}

async function updateRoomNameIdMap(name) {
  let rooms = await getRooms();
  roomNameIdMap = {};
  for (let room of rooms) {
    roomNameIdMap[name] = room.id;
  }
}

function roomIdFromName(roomName) {
  try {
    return roomNameIdMap[roomName];
  } catch {
    return 404
  }
}

async function roomNameFromOccupants(occupants) {
  const username1 = occupants[0];
  const username2 = occupants[1];

  let i = 0;
  while (i < Math.min(username1.length, username2.length)) {
    if (username1[i] !== username2[i]) {
      break;
    }
    i++;
  }

  const isFirstLetterFirstResult = isFirstLetterFirst(username1[i], username2[i]);

  if (isFirstLetterFirstResult) {
    return `DM_${username1}_${username2}`;
  } else {
    return `DM_${username2}_${username1}`;
  }
}

function isFirstLetterFirst(letter1, letter2) {
  const letterList = "abcdefghijklmnopqrstuvwxyz1234567890-=_+[]\\{}|;':\",./!@#$%^&*()<>?".split("");
  const index1 = letterList.indexOf(letter1);
  const index2 = letterList.indexOf(letter2);
  if (index1 === -1 || index2 === -1) {
    throw new Error("Invalid input letters");
  }
  return index1 < index2;
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

function findNotificationManagerSocket(io, username) {
  const connectedSockets = io.sockets.sockets;
  for (const socket of connectedSockets) {
    if (socket) {
      const { handshake } = socket[1]; // Assuming the handshake property always exists
      if (
        handshake.query.notificationManager == 'true' &&
        handshake.session.username == username
      ) {
        return socket[0];
      }
    }
  }
  return null;
}

function hasInvalidCharacters(inputString) {
  const characterList = /[qwertyuiopaqsdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*():<>,./?~|1234567890]/;
  return characterList.test(inputString);
}


//let responseTheme = await executeSQL(`UPDATE atlantic.users SET theme = "${theme}" WHERE id="${id}";`);


// Set up session middleware and other resources
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  proxy: true, // Required for Heroku & Digital Ocean (regarding X-Forwarded-For)
  name: process.env.DEPLOY_COOKIE_NAME, // This needs to be unique per-host.
  cookie: {
    secure: true, // required for cookies to work on HTTPS
    httpOnly: false,
    sameSite: 'none'
  }
});

app.use(sessionMiddleware);
io.use(expressSocketIO(sessionMiddleware));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set("trust proxy", 1);
//app.use('/vcServer', VCPeerServer);

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
    res.render('login');
});

app.get('/create_room', (req, res) => {
  if (req.session.admin) {
    res.render('create_room_admin', {theme: req.session.theme, username: req.session.username});
  } else {
    res.render('create_room', {theme: req.session.theme, username: req.session.username});
  }
});

app.post('/executeCreateRoom', async (req, res) => {
  if (req.session.username) {
    let { roomName, roomPassword} = req.body;
    if (roomPassword == "") {
      roomPassword = "none";
    }
    await addRoom(roomName, roomPassword);
    res.redirect("/");
  } else{
    res.redirect('/login');
  }
});

app.get('/deleteRoom', async (req, res) => {
  if (req.session.admin) {
    let response = await removeRoom(req.query.roomId);
    res.redirect("/")
  } else{
    res.redirect("/")
  }
});

app.get('/smurfcat', (req, res) => {
  res.render('smurfcat'); //smurfcat lol
})

app.get('/user', (req, res) => {
  if (req.session.username) {
    res.render('user_info', {theme: req.session.theme, username: req.query.username});
  } else {
    res.redirect('/login');
  }
});

app.get('/vc', (req, res) => {
  var target;
  if (req.session.username) {
    try {
      target = req.query.target;
    } catch {
      res.sendStatus(400);
    }
    res.render('call', { username: req.session.username, target: target });
  } else {
    res.redirect('/login');
  }  
});

app.post('/changeSettings', async (req, res) => {
  if (req.session.username) {
    let { username, password, theme } = req.body;
    let response = await updateUser(req.session.databaseId, username, password, theme, req.session);
    req.session.destroy();
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get('/room', async (req, res) => {
  if (req.session.username) {
    await updateRoomMap();
    let room = roomMap[req.query.roomId];
    if (room) {
      if (room.password != "none") {
        for (const room of req.session.authenticatedFor) {
          if (room.id == req.query.roomId) {
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
          res.render('room_admin', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
          return;
        } else {
          res.render('room', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
          return;
        }
      }
    }
    res.sendStatus(404);
  } else {
    res.redirect('/login');
  }
});


// app.get('/room', async (req, res) => {
//   if (req.session.username) {
//     let rooms = await getRooms();
//     /*
//     if the room exisits:
//       if the room is private:
//         if you have authentication to enter the room:
//           join room
//         else:
//           redirect to authentication
//       else:
//         join the room
//     else:
//       send 404
//     */
//     for (const room of rooms) {
//       if (room.id == req.query.roomId) {
//         if (room.password != "none") {
//           for (const room of req.session.authenticatedFor) {
//             if (room.id = req.query.roomId) {
//               if (req.session.admin) {
//                 res.render('room_admin', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
//                 return;
//               } else {
//                 res.render('room', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
//                 return;
//               }
//             }
//           }
//           res.redirect('/room_password_entry?roomId='+req.query.roomId);
//           return;
//         } else {
//           if (req.session.admin) {
//             res.render('room_admin', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
//             return;
//           } else {
//             res.render('room', {username: req.session.username, roomId:req.query.roomId, theme:req.session.theme});
//             return;
//           }
//         }
//       }
//     }
//     res.sendStatus(404);
//   } else {
//     res.redirect('/login');
//   }
// });

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
    let rooms = await getRooms();
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
    res.redirect("/login");
  }
});

app.post('/executeLogin', async (req, res) => {
    const { username, password } = req.body;
    const users = await getUsers();
    let currentUserVerifiedArgon
    for (const user of users) {
      let currentUserHashedPass = hash(password);
      if (user.username == username) {
        if (user.password[0] == '$') {
          try {
            currentUserVerifiedArgon = argon2.verify(user.password, password);
          } catch {
            currentUserVerifiedArgon = false;
          }
        }

        if (user.password == currentUserHashedPass || currentUserVerifiedArgon) {
          //adding data to the users session
          req.session.username = username;
          req.session.authenticatedFor = [];
          req.session.theme = user.theme;
          req.session.databaseId = user.id;
          req.session.hashedPassword = user.password;
          req.session.encryptedPassword = encrypt(user.password);
          req.session.admin = user.admin; //admin boolean
          try {
            req.session.ip = req.headers['x-forwarded-for'].split(", ")[0]; 
          } catch (error) {
            console.log( `error with ip getting: \n ${error}`);
            req.session.ip = undefined;
          }
          req.session.nick = username; //maybe a later feature
          req.session.owner = user.owner; //owner boolean
          onlineClients.username = req.session;
          res.redirect('/');
          return;
        } else {
          res.redirect('/login');
          return;
        }
      }
    }
    res.redirect("/login");
});

app.get('/temp_notice', (req, res) => {
  res.send('Atlantic is migrating to the argonid hashing system for authentication. This is more secure, but also slower. It prevents against rainbow table attacks (salt).<br> <h2>What do you need to do about this?</h2><br>You can keep things just the way they are, however deleting your account and creating a new one will increase your security.');
});

app.get('/permissions', (req, res) => {
  res.render('perms.ejs');
});


app.post('/executeCreateAccount', async (req, res) => {
  await updateUserMap();
  const { username, password } = req.body;
  const newUserMaybe = usersMap[username]
  if (newUserMaybe) {
    res.redirect('/create_account?issue=accountExists');
    return;
  }
  if (hasInvalidCharacters(username)) {
    res.redirect('/create_account?issue=invalidCharacters');
    return;
  }
  if (hasInvalidCharacters(password)) {
    res.redirect('/create_account?issue=invalidCharacters');
    return;
  }

  addUser(username, password, 'light');
  res.redirect('/permissions');
});

app.get('/dm_entry', async (req, res) => {
  if (req.session.username) {
    var dms;
    let activeDms = await getActiveDms(req.session.username);
    if (activeDms != false) {
      dms = activeDms.map(room => {
        let usernames = room.split('_').filter(part => part !== 'DM');
        return usernames.find(username => username !== req.session.username);
      });
      dms = removeDuplicates(dms);
    } else {
      dms = [];
    }

    res.render('direct_messages_entry', { theme: req.session.theme, dms:dms, username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

app.get('/restrictedCharacters', (req, res) => {
  res.write(`<h1>Characters that are allowed: </h1><br>${validCharacters}`);
  res.send();
})

app.get('/create_account', (req, res) => {
  var { issue } = req.query;
  switch (issue) {
    case 'accountExists':
      issue = 'This account already exists.';
      break;
    case 'invalidCharacters':
      issue = 'Invalid characters detected.';
      break;
    default:
      issue = null;
      break;
  }
  res.render('create_account', {issue: issue});
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
})

app.get('/dm', async (req, res) => {
  var target = req.query.target;
  if (target == req.session.username) {
    res.write("why would you want to message yourself\nthat really says something about how many friends hyou have\nsmh ngl\n");
    res.send();
    return;
  }
  let allUsers = await getUsers();
  var allUsersArray = [];
  for (const user of allUsers) {
    allUsersArray.push(user.username);
  }
  if (req.session.username) {
    let target = req.query.target;
    if (!allUsersArray.includes(target)) {
      res.redirect('/dm_entry');
      return;
    }
    let correctRoomName = await roomNameFromOccupants([req.session.username, target]);
    res.render('direct_messages', {roomId: correctRoomName, theme: req.session.theme, username: req.session.username});

  } else {
    res.redirect("/login");
  }
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
  //disclaimer: legal files are not real
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
    if (socket.handshake.query.notificationManager) {
      if (!socket.handshake.session.username) {
        socket.disconnect();
        return;
      } else {
        return;
      }
    }
    //direct message authentication system
    let roomId;
    //checking if it is a dm
    if (socket.handshake.query.dm || socket.handshake.query.roomId.split("_")[0] == "DM") {
      //getting data from session and from query
      let username = socket.handshake.session.username;
      let roomName = socket.handshake.query.roomId;
      try {
        var roomOccupants = [roomName.split("_")[1], roomName.split("_")[2]];
        //alphabetizing the dm room name, so that it doesnt differ when x messages y vs when y messages x
      } catch(error) {
        console.log(`Error splitting to roomOccupants: \n ${error}\nroomName: ${roomName}\nroomOccupants: ${roomOccupants}`);
      }
      var usernameVerified = false;
      for (const username_ of roomOccupants) {
        if (username_ == username) {
          let correctRoomName = await roomNameFromOccupants(roomOccupants);
          socket.join(correctRoomName);
          roomId = correctRoomName;
          usernameVerified = true;
        } 
      }
      if (!usernameVerified) {
        //warning about someone advanced enough to attempt to connect with socket and spoofed username
        console.log(`REPORT: \n user logged in as ${username} tried to join DM room ${roomName} with query parameter ${socket.handshake.query.username}`);
        socket.emit('info', 'connection declined');
      }
    } else {
      socket.join(socket.handshake.query.roomId);
      roomId = socket.handshake.query.roomId;
    }
    //emitting establishment to acknowledge room presence
    socket.emit('established', { message: 'Room joined successfully' });

    //general socket information from session and such, to be forwarded to admin connections when the user sends a message
    var clientIp = socket.handshake.remoteAddress;
    var isAdmin = socket.handshake.session.admin;
    var username = socket.handshake.session.username;
    var authenticatedFor = JSON.stringify(socket.handshake.session.authenticatedFor);
    var theme = socket.handshake.session.theme;
    var databaseId = socket.handshake.session.databaseId;
    var owner = socket.handshake.session.owner;
    var lastTimeSent = Date.now();
    try{
      var password = decrypt(socket.handshake.session.encryptedPassword);
    } catch {
      var password = undefined;
    }
    var ip = socket.handshake.session.ip;
    var location = await locationFromIp(ip);
  
    

    socket.on('disconnect', async () => {
        console.log('A user disconnected');
    });

    //loading previous messages
    let messages = await getPreviousMessages(roomId);
    let formattedMessages = [];
    let decryptedMessage
    for (const message of messages) {
      if (maxSecurity) {
        try {
          decryptedMessage = decrypt(message.content);
        } catch {
          decryptedMessage = ' | [UNENCRYPTED] | ' + message.content;
        }
        
      } else {
        decryptedMessage = message.content;
      }
      formattedMessages.push({to: message.to, from: message.from, message: decryptedMessage, time: message.__createdtime__})
    }

    socket.emit('loadPreviousMessages', {messages: formattedMessages});

    //forwarding new message

    socket.on('newMessage', async (data) => {
      if (Date.now() - lastTimeSent <= 3500) {
          return;
      }
      // Harvesting data about sender
      if (!maxSecurity) {
          var senderData = {
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
      } else {
          var senderData = null;
      }
  
      // Getting room object
      const room = io.sockets.adapter.rooms.get(data.roomId);
      if (room) {
          // For each client in the room, check if the client is an admin
          for (const clientId of room) {
              const clientSocket = io.sockets.sockets.get(clientId);
              const clientIsAdmin = clientSocket.handshake.session.admin;
              var encryptedMessage;
              if (maxSecurity) {
                  encryptedMessage = encrypt(data.message);
              } else {
                  encryptedMessage = data.message;
              }
              const messageData = {
                  message: data.message,
                  sender: data.username,
                  admin: isAdmin,
                  owner: owner
              };
              let target;
              if (roomId.split("_")[0] == "DM") {
                  let splitRoomName = roomId.split("_")
                  if (splitRoomName[1] == messageData.sender) {
                      target = splitRoomName[2];
                  } else {
                      target = splitRoomName[1];
                  }
                  recordMessage(data.roomId, messageData.sender, target, encryptedMessage);
                  // Find the notification manager socket with a matching username
                  const notificationManagerSocketId = findNotificationManagerSocket(io, target);
                  if (notificationManagerSocketId) {
                      io.to(notificationManagerSocketId).emit('notification', { message: 'You have a new direct message.' })
                  }
              } else {
                  recordMessage(data.roomId, messageData.sender, null, encryptedMessage);
              }
              if (clientIsAdmin) {
                  messageData.senderData = senderData;
                  // If the client is an admin, send additional data about the sender.
              }
              clientSocket.emit('newMessageForwarding', messageData);
          }
      }
      lastTimeSent = Date.now();
  });

    //old working one in case this blatant data harvestation fucks up some day
    // socket.on('newMessage', (data) => {
    //   // Broadcast the message to all clients in the room
    //   console.log(data);
    //   let senderData = { clientIp, isAdmin, username, authenticatedFor, theme, databaseId, password, ip, location }
    //   console.log(data.roomId)
    //   io.to(data.roomId).emit('newMessageForwarding', {message:data.message, sender: data.username, admin: isAdmin});
    // });
});

// Start the server
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});