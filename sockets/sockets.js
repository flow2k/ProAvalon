//sockets

var currentPlayers = [];
var allSockets = [];

var avalonRoom = require("../gameplay/avalonRoom");

var rooms = [];
var nextRoomId = 1;


var updateCurrentGamesList = function(io){
	//prepare room data to send to players. 
	var gamesList = [];
	for(var i = 0; i < rooms.length; i++){
		//If the game exists
		if(rooms[i]){
			//create new array to send
			gamesList[i] = {};
			//get status of game
			gamesList[i].status = rooms[i].getStatus();
			//get room ID
			gamesList[i].roomId = rooms[i].getRoomId();
		}
	}


	// console.log(gamesList);


	io.in("allChat").emit("update-current-games-list", gamesList);
}





module.exports = function(io){
	//SOCKETS for each connection
	io.sockets.on("connection", function(socket){

		if(socket.request.isAuthenticated()){
			console.log("User is authenticated");
		} else{
			console.log("User is not authenticated");
		}

		//if user is already logged in
		var i = currentPlayers.indexOf(socket.request.user.username);
		if(i !== -1){
			allSockets[socket.request.user.username].emit("alert", "You've been disconnected");
			allSockets[socket.request.user.username].disconnect();
			currentPlayers.splice(i, 1);
			console.log("User was logged in already, killed last session and socket.")
		}

		console.log(socket.request.user.username + " has connected under socket ID: " + socket.id);

		//automatically join the all chat
		socket.join("allChat");
		currentPlayers.push(socket.request.user.username);
		allSockets[socket.request.user.username] = socket;

		//socket sends to all except the user of this socket
		socket.in("allChat").emit("player-joined-lobby", socket.request.user.username);
		
		//io sends to everyone in the room, including the current user of this socket
		io.in("allChat").emit("update-current-players-list", currentPlayers);

		updateCurrentGamesList(io);








		//when a user tries to send a message to all chat
		socket.on("allChatFromClient", function(data){
			socket.emit("danger-alert", "test alert asdf");
			//debugging
			console.log("incoming message at " + data.date + ": " + data.message + " by: " + socket.request.user);
			//get the username and put it into the data object
			data.username = socket.request.user.username;
			//send out that data object to all other clients (except the one who sent the message)
			socket.in("allChat").emit("allChatToClient", data);
		});

		//when a user disconnects/leaves the whole website
		socket.on("disconnect",function(data){
			//debugging
			console.log(socket.request.user.username + " has left.");
			//get the index of the player in the array list
			var i = currentPlayers.indexOf(socket.request.user.username);
			//in case they already dont exist, dont crash server
			if(i === -1){return;}
			//remove that single player who left
			currentPlayers.splice(i, 1);
			//send out the new updated current player list
			socket.in("allChat").emit("update-current-players-list", currentPlayers);
			//tell all clients that the user has left
			socket.in("allChat").emit("player-left-lobby", socket.request.user.username);
		});



		//when a new room is created
		//INCOMPLETE
		socket.on("newRoom", function(){
			//create new room
			rooms[nextRoomId] = new avalonRoom(socket.request.user.username, nextRoomId);
			console.log("new room request");

			//broadcast to all chat
			var str =  "Room " + nextRoomId + " has been created! Go join!";
			console.log(str);
			console.log(rooms);
			//send to allChat including the host of the game
			io.in("allChat").emit("new-game-created", str);
			//send back room id to host so they can auto connect
			socket.emit("autoJoinRoomID", nextRoomId);

			// sending to individual socketid (private message)
  			//socket.to(<socketid>).emit('hey', 'I just met you');

  			//increment index for next game
  			nextRoomId++;

  			updateCurrentGamesList(io);
  		});

		socket.on("joinRoom", function(roomId){
			var ToF = rooms[roomId].playerJoinGame(socket);
			console.log(socket.request.user.username + "has joined room " + roomId + ": " + ToF)
		});

		
	});
}