const { dataStorage, bulbQuery, dataQuery } = require('./database');
const { remainingTimeCalculator } = require('./utilities');
const graphOrganization = require('./graph');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const port = process.env.PORT;
const mqttsPort = 8883;
const app = express();
const ejs = require('ejs');
var mqtt = require('mqtt');

var options = {//option pour le client MQTT.js
  port: mqttsPort,
  host: 'eu1.cloud.thethings.network:8883',//adresse du broker de The things network
  protocol: 'mqtts',//connexion mqtt sécurisée
  rejectUnauthorized: false,
  username: process.env.MQTT_USERNAME,//voir le fichier.env pour les ids et mots de passe de connexion
  password: process.env.MQTT_PASSWORD,
  qos: 0// qualité de service minimale
}

const topicList = ['v3/lampadaire@ttn/devices/mkrwan1/up', 'v3/lampadaire@ttn/devices/mkrwan2/up', 'v3/lampadaire@ttn/devices/mkrwan3/up'];//chaque topic correspond à un lampadaire

var client = mqtt.connect(process.env.MQTT_URI, options);//initialisation du client MQTT

client.on('connect', () => {
  console.log('connected  ' + client.connected);
  client.subscribe(topicList, options);// le client s'abonne à chaque topic pour pouvoir recuperer les messages qui arrivent dessus
})

client.on('message', (topic, message) => {//lorqu'un message arrive, on le converti en JSON pour en extraire les informations
  var payload = JSON.parse(message.toString());
  dataStorage(payload.uplink_message.decoded_payload.bytes[0], payload.uplink_message.decoded_payload.bytes[1], payload.end_device_ids.device_id);// lorsqu'un message arrive sur le broker on le stocke dans la bdd
});

app.use(express.static(process.cwd() + '/public'));

app.set('views', __dirname + '/views');//on déclare le répertoire views comme étant le repertoire pour le moteur ejs

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/index.html')// la page d'accueil est la page avec la carte des lampadaires
})

/*
Cette fonction recupère les requêtes vers le endpoint lampadaire et renvoie une page html (graph.ejs) dont le contenu change
en fonction de l'identifiant du lampadaire, qui est précisé dans la requête
*/
app.get('/lampadaire', async (req, res) => {
  const bulbData = await bulbQuery(req.query.devID);//récupération des données concernant la durée de vie total des ampoules
  const mainData = await dataQuery(req.query.devID);//récupération des données concernant les niveaux sonores et la consommation d'énergie relevés à chaque lampadaire
  const preparedGeneralData = graphOrganization(mainData);//modification du format d'envoi des données 
  console.log(preparedGeneralData.xAxis);
  res.render('graphs.ejs', {//utilise le template graph.ejs pour y envoyer les données
    time: preparedGeneralData.xAxis,// on fait des relevés suivant un certain intervalle de temps
    soundValue: preparedGeneralData.yAxis,// valeur de l'intensité sonore en dB
    bulbUsage: remainingTimeCalculator(bulbData[0].usedTime),// durée de vie restante de l'ampoule du lampadaire
    energyConsumption: preparedGeneralData.consumptionArray,// tableau contenant la consommation par intervalle de temps du lampadaire 
    id: req.query.devID.replace('mkrwan', 'lampadaire n°')// on change juste l'id pour adapter les titres du doc ejs au lampadaire
  });
})

app.listen(port, () => {// on démarre le serveur node.js pour pouvoir gérer les requêtes
  console.log('Server running !');
});