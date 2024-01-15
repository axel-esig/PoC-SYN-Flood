const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pcap = require('pcap');
const net = require('net');

const app = express();
const server = http.createServer(app);

// Middleware pour servir des fichiers statiques (images, CSS)
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/image1', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'image1.html'));
});

app.get('/image2', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'image2.html'));
});

app.get('/image3', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'image3.html'));
});

const pcapSession = pcap.createSession('lo', 'tcp');

pcapSession.on('packet', function (rawPacket) {
  const packet = pcap.decode.packet(rawPacket);

  if (packet.payload && packet.payload.payload && packet.payload.payload.payload) {
    const ethPacket = packet.payload;
    const ipPacket = ethPacket.payload;
    const tcpPacket = ipPacket.payload;

    if (tcpPacket.flags.syn && !tcpPacket.flags.ack) {
      console.log('SYN request received');
      console.log('Source IP:', ipPacket.saddr.toString());
      console.log('Source port:', tcpPacket.sport);
      console.log('---------------');
    }
  }
});

// Création du serveur TCP
const tcpServer = net.createServer((socket) => {
  console.log('Client TCP connecté');

  // Gestion des données reçues du client TCP
  socket.on('data', (data) => {
    console.log('Données reçues du client TCP:', data.toString());
    // Vous pouvez ajouter ici la logique pour traiter les données reçues
  });

  // Gestion de la déconnexion du client TCP
  socket.on('end', () => {
    console.log('Client TCP déconnecté');
  });
});
  

// Écoute du serveur TCP sur le port 3002
tcpServer.listen(3002, () => {
  console.log('Serveur TCP en écoute sur le port 3002');
});

// Gestion des requêtes HTTP
app.get('/', (req, res) => {
  // Obtenez le chemin complet du fichier HTML
  const filePath = path.join(__dirname, 'static', 'index.html');

  // Lisez le contenu du fichier HTML
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur de lecture du fichier HTML:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erreur interne du serveur');
      return;
    }

    // Envoyez le contenu du fichier HTML en réponse
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// Écoute du serveur HTTP sur le port 3000
const httpPort = process.env.PORT || 3000;
server.listen(httpPort, () => {
  console.log(`Le serveur HTTP est en cours d'écoute sur le port ${httpPort}`);
});