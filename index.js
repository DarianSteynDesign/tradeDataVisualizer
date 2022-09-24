var winData = [];
var lossData = [];
var winDataLabels = [];
var lossDataLabels = [];
var allTextLines = [];
var combinedWinData = [];
var combinedLossData = [];
var combinedWinLoss = [];
var winLossPercentages = [];
var winPercentages = [];
var lossPercentages = [];
var winLossPercLabels = [];
var dailyTotals = [];
// var groupedWins = [];
// var groupedLoss = [];

var totalProfit = 0;
var totalLoss = 0;
var loss = 0;
var win = 0;
var dataCount = 0;
var commissionTotal = 0;

var currentDay = "";

var isLightTheme = false;

function init() {
    $.ajax({
        type: "GET",
        url: "./dataSets/data2.csv",
        dataType: "text",
        success: function(data) {processData(data);}
    });

    registerEventListeners();
}

function registerEventListeners() {
    $("#switchTheme").click(() => {
        switchTheme();
    });
}

function switchTheme() {
    console.log(isLightTheme);
    if(isLightTheme) {
        $('body').addClass("dark");
        isLightTheme = false;
    } else {
        $('body').removeClass("dark");
        isLightTheme = true;
    }
}

function processData(allText) {
    allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var rawData = [];
    var chartHeadings = [];
    var profitData = [];
    
    for (var i = 1; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        dataCount++;

        if(!data[4].includes('Commission')) {
            rawData.push(data[0] + "|" + headers[3] + ":" + data[3]);
            profitData.push(parseFloat(data[3].replace(/\s/g, "")));
            chartHeadings.push(data[0]);
            createDataList(data[0], data[3]);
        } else {
            processCommissionData(parseFloat(data[3].replace(/\s/g, "")));
        }
    }

    profitData.reverse();
    chartHeadings.reverse();

    updateSummaryText();
    createBarChart('barChart', chartHeadings, profitData, 'Trades Over Time');
}

function processCommissionData(data) {
    commissionTotal += data;
}

function updateSummaryText() {
    // totalLoss += commissionTotal;
    // totalProfit += commissionTotal;
    // $('#profit').text("Total Win Amount: " + totalProfit.toFixed(2).toString());
    // $('#loss').text("Total Profit Amount: " + totalLoss.toFixed(2).toString());

    $('#commissionFees').text("Total commission fees: " + commissionTotal.toFixed(2).toString());
    $('#totalProfit').text("Total Profit: " + (totalProfit + totalLoss).toString());
    $('#afterCommission').text("Profit after comm: " + ((totalProfit + totalLoss) + commissionTotal).toFixed(2).toString());
}

function createDataList(date, value) {
    var rawDataString = "";
    var formattedValue = parseFloat(value.replace(/\s/g, ""));
    var winLossRatio = 0;

    if (formattedValue >= 0) {
        var formattedDate = date.split(' ')[0]
        totalProfit += parseFloat(formattedValue);

        rawDataString += "<li class='raw-data-list-item'>"
        + "<p class='list-date'>" + date + "</p>" + "<p class='list-value profit'>Profit: " + formattedValue + "</p>" + "</li>";

        proccessWinLossData(formattedDate, formattedValue);
    } else {
        var formattedDate = date.split(' ')[0]
        totalLoss += parseFloat(formattedValue);

        rawDataString += "<li class='raw-data-list-item'>"
        + "<p class='list-date'>" + date + "</p>" + "<p class='list-value loss'>Loss: " + formattedValue + "</p>" + "</li>";

        proccessWinLossData(formattedDate, formattedValue);
    }

    winLossRatio = (win / loss).toFixed(2);
    console.log(date, value, totalProfit);
    $('.raw-data-list').append(rawDataString);
    $('#ratio').text("W/L Ratio: " + winLossRatio.toString());
}

function proccessWinLossData(date, data) {
    if(data >= 0) {
        winData.push(data);
        winDataLabels.push(date);
        combinedWinData.push({date: date, data: data});
        win++;
    } else {
        lossData.push(Math.abs(data));
        lossDataLabels.push(date);
        combinedLossData.push({date: date, data: data});
        loss++;
    }

    combinedWinData.reverse();
    combinedLossData.reverse();

    if(dataCount == (allTextLines.length - 1)){
        //console.log(combinedWinData);
        createDailyData(combinedWinData, combinedLossData);
    }
}

function groupData(winLossData) {
    var group = winLossData.reduce((groups, game, index) => {
        const date = winLossData[index].date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(game);
        return groups;
    }, {});

    return group;
}

function createDailyData(winData, lossData) {
    var groupedWins = groupData(winData);
    var groupedLoss = groupData(lossData);

    //checkForNoLossProfit(groupedWins, groupedLoss);
    combineDailyWinLossRate(groupedWins, groupedLoss);
    calculateProfitPerDay(groupedWins, groupedLoss);
}

function checkForNoLossProfit(winData, lossData) {
    var i = 0;

    for (var value in winData) {
        i++;
        if(lossData[value] == undefined) {
            groupedLoss[value] = [{date: value, data: 0}];
            console.log("Look at you, no losses on - ", value, groupedLoss, groupedWins);
        }
    }
    if(i == Object.keys(winData).length){
        combineDailyWinLossRate(groupedWins, groupedLoss);
        calculateProfitPerDay(groupedWins, groupedLoss);
    }
}

function combineDailyWinLossRate(winData, lossData) {
    var dailyWins = [];
    var dailyLosses = [];

    for (var value1 in winData) {
        dailyWins.push({date: value1, amount: winData[value1].length});
    } 

    for (var value2 in lossData) {
        dailyLosses.push({date: value2, amount: lossData[value2].length});
    }

    for(var i = 0; i < dailyWins.length; i++) {
        if(dailyLosses[i].date == dailyWins[i].date) {
            combinedWinLoss.push({date: dailyLosses[i].date, win: dailyWins[i].amount, loss: dailyLosses[i].amount});
        }
    }

    calculateWinLossRate(combinedWinLoss);
}

function calculateWinLossRate(data) {
    var totalTrades = 0;

    for(var i = 0; i < data.length; i++) {
        totalTrades = data[i].win + data[i].loss;
        winPercentage = ((data[i].win / totalTrades) * 100).toFixed(2);
        lossPercentage = ((data[i].loss / totalTrades) * 100).toFixed(2);
        winLossPercentages.push({date: data[i].date, winPercentage: parseFloat(winPercentage), lossPercentage: parseFloat(lossPercentage)});
        winPercentages.push(parseFloat(winPercentage));
        lossPercentages.push(parseFloat(lossPercentage));
        winLossPercLabels.push(data[i].date);
        currentDay = data[0].date;
    }

    calculateAverageWinRate(winPercentages);
    createLineChart("winPercChart", winLossPercLabels, winPercentages, "Win Percentages", 'rgb(16, 212, 98)');
    createLineChart("lossPercChart", winLossPercLabels, lossPercentages, "Loss Percentages", 'rgb(212, 16, 16)');
    createPolarChart("polarChart", winLossPercLabels, winPercentages, "Win Percentages", 'rgb(16, 212, 98)');
}

function calculateAverageWinRate(winData) {
    var total = 0;
    console.log("WinData", winData);
    for(var i = 0; i < winData.length; i++) {
        total += winData[i];
    }

    var avg = (total / winData.length).toFixed(2);
    $('#averageWinPerc').text("Avg Win %: " + avg.toString());
}

function calculateProfitPerDay(profit, loss) {
    var totalProfit = 0;
    var totalLoss = 0;
    
    for(var i = 0; i < winLossPercLabels.length; i++){
        totalLoss = processProfitLoss(loss[winLossPercLabels[i]]);
        totalProfit = processProfitLoss(profit[winLossPercLabels[i]]);
        dailyTotals.push(totalLoss + totalProfit);
    }
    
    calcAvgProfitOverTime(dailyTotals);
    createBarChart("profitPerDay", winLossPercLabels, dailyTotals, 'Profit Per Day');
    createLineChart("equityCurve", winLossPercLabels, dailyTotals, 'Equity Curve', 'rgb(16, 150, 212)');
}

function calcAvgProfitOverTime(profitPerDay) {
    var avgProfitOverTime = 0;
    var totalProfit = 0;

    for(var i = 0; i < profitPerDay.length; i++) {
        totalProfit += profitPerDay[i];
    }

    avgProfitOverTime = totalProfit / profitPerDay.length;
    $('#avgProfit').text("AVG Profit: " + avgProfitOverTime.toFixed(2).toString());
    console.log("Avg profit", avgProfitOverTime);
}

function processProfitLoss(data) {
    var total = 0;

    for(var i = 0; i < data.length; i++) {

        if(currentDay == data[i].date) {
            total += data[i].data
        } else {
            currentDay = data[i].date;
            total += data[i].data
        }
    }

    return total;
}

function createPolarChart(elementId, dates, data, chartHeading, chartColor) {
     //console.log("I have my dates - ", dates);
     //console.log("I have my data - ", data);

    const ctx = document.getElementById(elementId).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: dates,
            datasets: [{
                label: chartHeading,
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            layout: {
                padding: {
                    left: 0
                }
            }
        }
    });
}

function createBarChart(elementId, dates, data, chartHeading) {
    //console.log("I have my dates - ", dates);
    // console.log("I have my data - ", data);

    const ctx = document.getElementById(elementId).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: chartHeading,
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            layout: {
                padding: {
                    left: 0
                }
            }
        }
    });
}

function createLineChart(elementId, dates, data, chartHeading, chartColor) {
    // console.log("I have my dates - ", dates);
    // console.log("I have my data - ", data);

    const ctx = document.getElementById(elementId).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: chartHeading,
                data: data,
                backgroundColor: [
                    chartColor
                ],
                borderColor: [
                    chartColor
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            layout: {
                padding: {
                    left: 0
                }
            }
        }
    });
}

init();