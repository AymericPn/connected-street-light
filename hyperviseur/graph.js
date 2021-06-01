const { dataStorage, dbQuery } = require('./database');
const {energyConsumptionCalculation, plotlyDateFormatConversion } = require('./utilities');
module.exports = graphOrganization;

function graphOrganization(data) {
    var organizedData = dataOrganization(data);// we prepare the data to send it over to the ejs template
    return organizedData;
}

function dataOrganization(data) {
    var xAxis = new Array();
    var yAxis = new Array();
    var durationArray = new Array();
    var consumptionArray = new Array();
    for (var i in data) {
        xAxis.push(plotlyDateFormatConversion(data[i].time));//creates the x axis with timestamps 
        yAxis.push(data[i].soundLevel);//the y axis with decibel level
        durationArray.push(data[i].usedDuration);//this array stores the time during which the light is on
    };
    for (var i = 0; i < durationArray.length; i++) {
        consumptionArray[i] = energyConsumptionCalculation(durationArray[i]);//calculate the consumption for each time period
    }
    return { xAxis, yAxis, consumptionArray };
}