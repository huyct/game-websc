const express = require("express");
const { sortListPlayer, handleScore, randomListWord } = require("./handleQuiz");
const app = express();

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

server.listen(process.env.PORT || 8000);

const listRoom = {};
const listClient = {};

const randomId = () => {
  const listChar = "abcdefghijklmnopqrstuvwxyz0123456789";
  while (true) {
    let roomId = "";
    const lengthList = listChar.length;
    for (let i = 0; i < 6; i++) {
      roomId += listChar[Math.floor(Math.random() * lengthList)];
    }
    if (!listRoom[roomId]) {
      return roomId;
    }
  }
};

io.on("connection", async (socket) => {
  console.log("new user connected");
  if (socket.handshake.query.type === "create") {
    const roomId = randomId().toString();
    listRoom[roomId] = {
      masterId: socket.id,
      indexPlayed: -1,
      listPlayer: [],
      listPlayerInGame: [],
      countAnswer: 0,
      isPlayed: false,
      listQuiz: [],
    };
    socket.emit("create", roomId);
    listClient[socket.id] = { type: "create", roomId };
  }
  if (socket.handshake.query.type === "join") {
    const name = socket.handshake.query.name;
    const avatar = socket.handshake.query.avatar;
    const roomId = socket.handshake.query.roomId;
    listClient[socket.id] = { type: "join", name: name, roomId: roomId };
    if (listRoom[roomId] && !listRoom[roomId].isPlayed) {
      socket.join(roomId);
      socket.emit("join", { roomId: roomId, socketId: socket.id });
      listRoom[roomId]?.listPlayer?.push({
        name: name,
        avatar: avatar,
        socketId: socket.id,
      });
      io.to(listRoom[roomId].masterId).emit(
        "playerJoin",
        listRoom[roomId].listPlayer
      );
    } else {
      socket.emit("join", "error");
    }
  }

  socket.on("newquiz", async (args) => {
    const { roomId, category } = args;
    if (socket.id !== listRoom[roomId].masterId) {
      return;
    }
    if (!listRoom[roomId].isPlayed) {
      listRoom[roomId].listPlayerInGame = listRoom[roomId].listPlayer.map(
        (a) => ({ ...a, isAnswer: false, isPaint: false, score: 0 })
      );
      listRoom[roomId].isPlayed = true;
      listRoom[roomId].countAnswer = 0;
      listRoom[roomId].listQuiz = await randomListWord(
        category,
        listRoom[roomId].listPlayerInGame.length
      );
    }

    const indexPlayed = ++listRoom[roomId].indexPlayed;
    if (indexPlayed === listRoom[roomId].listPlayer.length) {
      listRoom[roomId].isPlayed = false;
      io.to(listRoom[roomId].masterId).emit("endgame", {
        summaryList: listRoom[roomId].listPlayerInGame,
        listPlayer: listRoom[roomId].listPlayer,
      });
      io.to(roomId).emit("endgame", true);
      listRoom[roomId].indexPlayed = -1;
    } else {
      listRoom[roomId].countAnswer = 0;

      const paintId = listRoom[roomId].listPlayer[indexPlayed].socketId;
      const paintName = listRoom[roomId].listPlayer[indexPlayed].name;
      handleResetNewQuiz(listRoom[roomId].listPlayerInGame, paintId);
      io.to(listRoom[roomId].masterId).emit("newquiz", {
        paintId: paintId,
        word: listRoom[roomId].listQuiz[indexPlayed],
        paintName: paintName,
        listPlayer: listRoom[roomId].listPlayerInGame,
      });
      io.to(roomId).emit("newquiz", {
        paintId: paintId,
        quiz: listRoom[roomId].listQuiz[indexPlayed],
      });
    }
  });

  socket.on("paint", (args) => {
    const { roomId, base64 } = args;
    if (listRoom[roomId]) {
      io.to(listRoom[roomId].masterId).emit("paint", base64);
    }
  });
});
