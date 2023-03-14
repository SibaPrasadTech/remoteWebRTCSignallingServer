const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server} = require('socket.io');
const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET","POST"]
    }
});

const handleJoinUserChannel = (io,socket,msg) => {
    console.log(`Socket ID : ${socket.id} joined User channel : user-${msg.userid}`)
    socket.join(`user-${msg.userid}`);
    io.to(`user-${msg.userid}`).emit('user-joined',{userid: msg.userid});
}

const handleRequestRemoteAccess = (io,socket,msg) => {
    console.log(`SE : ${msg.userid} requesting access from BE : ${msg.beid}`)
    io.to(`user-${msg.beid}`).emit('remote-access-request',{userid: msg.userid});
}
const handleRemoteAccessAck = (io,socket,msg) => {
    console.log(`BE : ${msg.userid} ack ${msg.res} to SE: ${msg.seid}`)
    io.to(`user-${msg.seid}`).emit('remote-access-ack',{res: msg.res,userid: msg.userid});
    if(msg.res){
        console.log(`BE : ${msg.userid} joining Remote Channel : remote-${msg.seid}-${msg.userid}`)
        socket.join(`remote-${msg.seid}-${msg.userid}`);
        io.to(`remote-${msg.seid}-${msg.userid}`).emit("remote-user-joined",{beid: msg.userid})
    }
}

const handleJoinRemoteChannel = (io,socket,msg) => {
    console.log(`SE : ${msg.userid} joining Remote Channel : remote-${msg.userid}-${msg.beid}`)
    socket.join(`remote-${msg.userid}-${msg.beid}`)
    socket.broadcast.to(`remote-${msg.userid}-${msg.beid}`).emit("remote-user-joined",{seid: msg.userid})
}

// const handleRemoteStream = (io,socket,msg) => {
//     console.log(`remote-${msg.seid}-${msg.userid}`);
//     io.to(`remote-${msg.seid}-${msg.userid}`).emit("remote-stream",{stream: msg.stream})
// }

const handleRemoteOffer = (io,socket,msg) => {
    console.log(`BE : ${msg.userid} sending offer to : remote-${msg.seid}-${msg.userid}`)
    socket.broadcast.to(`remote-${msg.seid}-${msg.userid}`).emit("remote-offer",{offer: msg.offer, beid: msg.userid})
}

const handleRemoteAnswer = (io,socket,msg) => {
    console.log(`SE : ${msg.userid} sending answer to : remote-${msg.userid}-${msg.beid}`)
    socket.broadcast.to(`remote-${msg.userid}-${msg.beid}`).emit("remote-answer",{answer: msg.answer})
}

const handleRemoteICECandidate = (io,socket,msg) => {
    console.log(`BE : ${msg.userid} sending ICE Candaidate to : remote-${msg.seid}-${msg.userid}`);
    socket.broadcast.to(`remote-${msg.seid}-${msg.userid}`).emit("remote-ice-candidate",{candidate: msg.candidate})
}

const handleMouseClick = (io,socket,msg) => {
    socket.broadcast.to(`remote-${msg.userid}-${msg.beid}`).emit("remote-mouse-click",{})
}

const handleMouseMove = (io,socket,msg) => {
    const { clientX,clientY, clientWidth,clientHeight,userid, beid} = msg;
    console.log(`${clientX} ${clientY} ${clientWidth} ${clientHeight} from ${userid} to ${beid}`)
    socket.broadcast.to(`remote-${userid}-${beid}`).emit("remote-mouse-move",{
        clientX,clientY, clientWidth,clientHeight,seid : userid
    })
}

io.on("connection", (socket) => {
    console.log(`User connected with socket ID : ${socket.id}`)
    socket.on("join-user-channel",(msg) => handleJoinUserChannel(io,socket,msg))
    socket.on("remote-access-request",(msg) => handleRequestRemoteAccess(io,socket,msg))
    socket.on("remote-access-ack",(msg) => handleRemoteAccessAck(io,socket,msg))
    socket.on("join-remote-channel",(msg) => handleJoinRemoteChannel(io,socket,msg))
    socket.on("remote-offer",(msg) => handleRemoteOffer(io,socket,msg))
    socket.on("remote-answer",(msg) => handleRemoteAnswer(io,socket,msg))
    socket.on("remote-ice-candidate",(msg) => handleRemoteICECandidate(io,socket,msg))
    socket.on("remote-mouse-move",(msg) => handleMouseMove(io,socket,msg))
    socket.on("remote-mouse-click",(msg) => handleMouseClick(io,socket,msg))
    //socket.on("remote-stream",(msg) => handleRemoteStream(io,socket,msg))
})

server.listen(3002,()=>{
    console.log("Socket IO Server listening on port 3002")
})