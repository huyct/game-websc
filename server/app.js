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
