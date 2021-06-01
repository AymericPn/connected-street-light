const { dateCreator, startDateCalculator, hexaDecoder } = require('./utilities');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
module.exports = { dataStorage, bulbQuery, dataQuery };

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });//on se connecte à la base de données
const generalDataSchema = mongoose.Schema({//créé un schéma de données pour enregistrer les informations de son et de consommation énergétique de chaque lampadaire
  devId: String,
  time: Date,
  soundLevel: Number,
  usedDuration: Number
})

const usedBulbTimeSchema = mongoose.Schema({// créé un autre schéma de données pour enregistrer les données concernant la durée de vie restante des ampoules de chaque lampadaire
  devId: String,
  usedTime : Number
})

const dataModel = mongoose.model('dataModel', generalDataSchema);//crée un modèle pour chaque schéma pour pouvoir interagir avec les bases de données
const bulbModel = mongoose.model('bulbModel', usedBulbTimeSchema);

function bulbUsageUpdating(devID, duration) {
  if (duration == -1) {//si l'ampoule a été changée, cela modifie son temps 
    bulbModel.findOneAndUpdate({ devId: devID }, { usedTime: 0 }, { upsert: true }, (err, data) => {
      if (err) throw err;
    })
  }
  else {
    var durationHours = duration / 60;
    bulbModel.findOneAndUpdate({ devId: devID }, { $inc: { usedTime: durationHours } }, { upsert: true }, (err, data) => {
      if (err) throw err;
    })
  }
}

function dataStorage(sound, duration, devID) {//this function updates the light bulb associated with the light's duration and stores the data
  var date = dateCreator();//create a date here because the gateway's timestamps are not very precise
  bulbUsageUpdating(devID, duration);
  dbStorage(devID, date, sound, duration);
}

function dbStorage(devID, timestamp, soundValue, duration) {//saves the data in the data collection
  const entry = new dataModel({
    devId: devID,
    time: timestamp,
    soundLevel: soundValue,
    usedDuration: duration
  });
  entry.save(function (err, data) {
    if (err) return console.error(err);
    console.log('saved !');
  })
}

function bulbQuery(devID) {
  return bulbModel.find({ devId: devID }).exec();
}

function dataQuery(devID) {
  var startDate = startDateCalculator();
  var dateNow = dateCreator();
  return dataModel.find({ devId: devID, time: { $gt: startDate, $lt: dateNow } }).sort({ time: 1 });//mongodb queries return promises, which are objects that are likely to produce a single value in the future
}