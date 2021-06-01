//ici c'est une sorte de boîte à outil, avec plusieurs fonctions utiles dont on se sert dans plusieurs fonctions
module.exports = { dateCreator, startDateCalculator, unixToDate, hexaDecoder, arraySumCalculation, energyConsumptionCalculation, remainingTimeCalculator, plotlyDateFormatConversion }

const milliSecondsInWeek = 604800000; //number of milliseconds in a week
const BULBPOWERCONSUMPTION = 0.021; //power of the bulb in kw
const CIRCUITPOWERCONSUMPTION = 0.0002475//kw
const POLLINTERVALL = 0.25;//intervall between each message from the microcontroller in hours
const LIFEEXPECTANCYBULB = 15000;//hours

function dateCreator() {
  var date = new Date();
  return date
}

function startDateCalculator() {//calculates the first date of the given time range
  var dateNow = dateCreator();
  var timeDifference = (dateNow.getTime()) - milliSecondsInWeek;
  var startDate = unixToDate(timeDifference);
  return startDate;
}

function unixToDate(unixTimestamp) {
  var unixDate = new Date(unixTimestamp);
  var year = unixDate.getFullYear();
  var month = unixDate.getMonth();
  var day = unixDate.getDate();
  var hour = unixDate.getHours();
  var minute = unixDate.getMinutes();
  var date = new Date(year, month, day, hour, minute);
  return date;
}

function plotlyDateFormatConversion(date) {//convert to a string readable by plotly as a date
  var timestamp = date.getTime();
  var unixDate = new Date(timestamp);
  var year = unixDate.getFullYear();
  var month = unixDate.getMonth() + 1;
  var day = unixDate.getDate();
  var hour = unixDate.getHours();
  var minute = unixDate.getMinutes();
  var plotlyDate = year.toString() + '-' + month.toString() + '-' + day.toString() + ' ' + hour.toString() + ':' + minute.toString();
  return plotlyDate;
}

function hexaDecoder(buffer) {
  // Decode an uplink message from a buffer
  var decimal = (buffer[0] << 8) + buffer[1];
  return decimal;
}

function arraySumCalculation(array) {
  var sum = 0;
  array.forEach(element => {
    sum += element;
  });
  return sum;
}

function energyConsumptionCalculation(usedTime) {
  var usedTimeHours = (usedTime / 3600).toFixed(2); //converti le temps d'utilisation (secondes) en heures
  var unusedTime = POLLINTERVALL - usedTimeHours; //calcul le temps pendant lequel l'ampoule est à 20 pourcent (pas de mouvement detecté)
  var totalBulbConsumption = usedTime * 0.8 * BULBPOWERCONSUMPTION + unusedTime * 0.2 * BULBPOWERCONSUMPTION;//l'énergie consommée par l'ampoule est égale à sa puissance max*l'intervalle de temps où un mouvement est detecté + sa puissance à 20% * l'intervalle de temps ou aucun mouvement n'est detecté kwh
  var totalCircuitConsumption = CIRCUITPOWERCONSUMPTION * POLLINTERVALL;//consommation du circuit kwh
  var totalConsumption = totalCircuitConsumption + totalBulbConsumption;//kwh
  return totalConsumption.toFixed(2);//retourne la consommation totale du système en kwh
}

function remainingTimeCalculator(usedTime) {
  var remainingTime = LIFEEXPECTANCYBULB - usedTime;
  return remainingTime;
}