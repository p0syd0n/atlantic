# Atlantic Chat App Documentation
## About
 This next bit will be about how Atlantic works, so you are here for help, please go [here](#Help). 
Atlantic is written in Node.Js, and is rendered through ejs. The chat messaging system uses a socket-IO server to emit chat messages to all clients in a room. The connection is established in the room.js file, and on establishment the server joins your socket object to the room that you have requested. From then out, messages under the event name `newMessage` will be emitted to you as soon as they are sent to the server. 
## On the saving of messages
Messages are saved in the database, but without the statistics collected at the time they were sent.


## Help/Navigation
Once you create an account, you will be welcomed with the main page. This includes a list of open rooms, and an option for creating a room.
### The main page (lobby)
The lobby will greet you with a list of open rooms. To join a room, click on its name. Private rooms are displayed red. When you hover over a room, its name will turn blue and you will see a small tooltip to its right showing if it is private or public. If it is private, you will be prompted to give the room's password before being allowed to join it. At the top of the screen, there is a small black bar. To the right of this bar, you will see your username in blue. If you click this username, a settings UI will appear. Here, you can change your username and password, as well as dark/light mode settings. Notice: Dark mode may not look quite as visually appealing as light mode, because I hate spending time on css.
### Creating a room
To create a room, you can select the Add Room option at the top left of the main lobby. You will be redirected to a room creation page, where you will be prompted to enter the rooms details. If you want your room to be private, set the password to `none`. After submitting the room creation form, you will be redirected to the lobby. The name of your new room should appear, but you might need to wait a little bit if there are a lot of people online, because this may cause server speed to decline. Please note that creating a room does not make you a "room owner" or anything of that sort, and you do not have jurisdiction over what is said or who is allowed. However, this may change in a future update.

## Other Topics
### Moderation
There is no moderation and are no restrictions on Altantic. I promote security, anonymity, and not only the right to opinions but also the right to express them, no matter how they may affect others.

The following will not be tolerated:

[intentionally left blank]

If you would like to create a space for clean conversation, I encourage you to create a private room and share the password amoung your aquaintances or, as an alternative, create a public room and discourage profanity within it.

### Bans
There is no banning system implemented. You may, however, contact me through a dm to posydon and request that a certain account be deleted, and multiple good reasons to do so. I will review the user and make a decision accordingly.

### Account heirarchy
The account heirarchy is quite simple - there is Owner status, Admin status, and no status. Owner and Admin status accounts, apart from getting prefixes in rooms ([ADMIN] adminAccountUsername : message), they have a slightly different UI, which allows them to view information pertaining to the users in a room. This information includes session data such as theme (dark/light), username, status, and internet protocol address. However, if a party contacts me via Atlantic dm and requests a change in the data visibility, this will be reworked.