
console.log(`%cIn-Tab Values ${chrome.runtime.getManifest().version} has started!`, "color: orange")
async function getGlobalData() {
    return await fetch(chrome.runtime.getURL("data.json")).then(response => response.json());
}

function darkMode() {
    let darkmode = false
    if (realBackgroundColor(document.body) == "rgb(35, 37, 39)") {
        darkmode = true
    }
    return darkmode
}

icons = {
    "rolimons": chrome.runtime.getURL("icons/rolimons.png"),
    "rolimons-specific": chrome.runtime.getURL("icons/rolimons-specific.png"),
    "rblx.trade": chrome.runtime.getURL("icons/rblx.trade.png"),
    "rblx.trade-specific": chrome.runtime.getURL("icons/rblx.trade-specific.png"),
    "raren": chrome.runtime.getURL("icons/raren.png"),
    "primary": chrome.runtime.getURL("icons/primary.png"),
    "primary-with-arrow": chrome.runtime.getURL("icons/primary-with-arrow.png")
}

if (!darkMode()) {
    icons["rolimons-specific"] = chrome.runtime.getURL("icons/rolimons-specific-light.png")
    icons["rblx.trade"] = chrome.runtime.getURL("icons/rblx.trade-light.png")
}

iconMouseOverText = {
    "projected": "This item is flagged as projected on rolimons.com",
    "proofbased": "This item is proof based according to rolimons.com",
    "rare": "This item is rare according to rolimons.com",
    "underrap": "This item is below rolimons.com's RAP requirements( it may drop in value soon )",
    "overrap": "This item is above rolimons.com's RAP requirements( it may raise in value soon )",
    "totalWin": "This trade's total win amount",
    "tradelistvaluesequal": "The Trade List Values preview of this trade's total values( grey signifying equal ).",
    "tradelistvalueswin": "The Trade List Values preview of this trade's total values( green signifying a win )",
    "tradelistvaluesloss": "The Trade List Values preview of this trade's total values( red signifying a loss )"
}

icons = {
    "rolimons": chrome.runtime.getURL("icons/rolimons.png"),
    "rolimons-specific": chrome.runtime.getURL("icons/rolimons-specific.png"),
    "rblx.trade": chrome.runtime.getURL("icons/rblx.trade.png"),
    "rblx.trade-specific": chrome.runtime.getURL("icons/rblx.trade-specific.png"),
    "raren": chrome.runtime.getURL("icons/raren.png"),
    "primary": chrome.runtime.getURL("icons/primary.png"),
    "primary-with-arrow": chrome.runtime.getURL("icons/primary-with-arrow.png"),
    "transparent-logo-with-sub-text": chrome.runtime.getURL("icons/transparent-logo-with-sub-text.png"),
    "discord": chrome.runtime.getURL("icons/discord.png"),
}

var sideValueBoxHTML;
fetch(chrome.runtime.getURL("sideValueBox.html")).then(async (response) => {
    sideValueBoxHTML = await response.text()
})

function saveLocal(name, value) {
    var items = {};
    items[name] = value
    chrome.storage.local.set(items, function () { });
}

async function getFromStorageLocal(name) {
    return new Promise((resolve) => {
        chrome.storage.local.get(name, async function (items) {
            value = items[name]
            if (value == undefined) {
                let globalData = await getGlobalData()
                for (let key in globalData) {
                    if (globalData.hasOwnProperty(key)) {
                        for (let thisKey in globalData[key]) {
                            if (thisKey == name) {
                                value = globalData[key][thisKey][1]
                                saveLocal(name, value)
                                resolve(value);
                            }
                            for (let thisThisKey in globalData[key][thisKey]) {
                                if (thisThisKey == name) {
                                    value = globalData[key][thisKey][thisThisKey][1]
                                    saveLocal(name, value);
                                    resolve(value);
                                }
                            }
                        }
                    }
                }
                if (name == "tradeCache") {
                    saveLocal(name, {})
                } else if (name == "New") {
                    saveLocal(name, true)
                } else if (name == "Decline Value Losses") {
                    saveLocal(name, true)
                    resolve(true)
                } else if (name == "Decline Threshold") {
                    saveLocal(name, .15)
                    resolve(.15)
                } else if (name == "Decline Projecteds") {
                    saveLocal(name, false)
                    resolve(false)
                } else if (name == "Don't Decline Rares") {
                    saveLocal(name, true)
                    resolve(true)
                } else if (name == "Max Decline Amount") {
                    saveLocal(name, 0)
                    resolve(0)
                } else if (name == "Whitelisted Users") {
                    saveLocal(name, "")
                    resolve("")
                } else if (name == "Max Remove Amount") {
                    saveLocal(name, 100)
                    resolve(100)
                }
            }
            resolve(value)
        });
    })
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

async function sendGETRequest(url) {
    try {
        let response = await fetch(url, {
            method: "GET",
            credentials: "include",
        })
        if (response.ok) {
            let json = await response.json();
            return json
        } else {
            return null
        }
    } catch {
        return null
    }
}

function parseForTable(string) {
    let pos = string.indexOf("chart_data")
    string = string.substr(pos, string.length)
    pos = string.indexOf("{")
    let pos2 = string.indexOf("}")
    string = string.substr(pos, pos2 - pos + 1)

    let json = JSON.parse(string)
    return json

}

async function checkChart(user_id) {
    return new Promise(function (resolve, reject) {
        let sus = false
        $.get('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.rolimons.com/player/' + String(user_id)), function (data) {
            let text = data.contents
            let json = parseForTable(text)
            let num_points = json.num_points
            let valuedata = json.value

            let current_value = valuedata[valuedata.length - 1]

            let getMean = function (data) {
                return data.reduce(function (a, b) {
                    return Number(a) + Number(b);
                }) / data.length;
            };

            let getSD = function (data) {
                let m = getMean(data);
                return Math.sqrt(data.reduce(function (sq, n) {
                    return sq + Math.pow(n - m, 2);
                }, 0) / (data.length - 1));
            };

            let SD = getSD(valuedata)

            let m = getMean(valuedata);
            let previous = null
            valuedata.forEach(value => {
                if (previous != null) {
                    let difference = Math.abs(value - previous)
                    let rate = Math.abs(difference / m)
                    if (rate > 3) {

                        resolve(true)
                        return
                    }

                }
                previous = value
            })
            resolve(false)
        });
        return sus

    })
}

//adds commas to number
String.prototype.commafy = function () {
    return this.replace(/(^|[^\w.])(\d{4,})/g, function ($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    });
};

async function chart(item_id) {

    let darkmode = darkMode()
    if (darkmode == true) {
        generalFontColor = "#FFFFFF"
        generalBackgroundColor = "#161616"
    } else {
        generalFontColor = "#393B3D"
        generalBackgroundColor = "#FFFFFF"
    }

    playSound()


    if (document.getElementById("myChart") != null) {

        document.getElementById("myChart").parentElement.remove()
    }
    document.getElementsByClassName("content")[0].style.paddingBottom = "0px"

    salesData = await sendGETRequest("https://economy.roblox.com/v1/assets/" + item_id + "/resale-data")
    priceDataPoints = salesData.priceDataPoints.slice(0, 999);

    thisdata = []

    for (i = 0; i < priceDataPoints.length; i++) {
        let date = new Date(priceDataPoints[i].date)

        table = {
            t: date,
            y: priceDataPoints[i].value
        }

        thisdata.push(table)
    }
    let div = document.createElement("div")
    div.style.height = "350px"
    div.style.width = "80%"
    div.style.margin = "auto"
    div.style.position = "relative"
    document.body.appendChild(div)

    let canvas = document.createElement("canvas")
    canvas.id = "myChart"
    div.appendChild(canvas);
    //SCROLL
    window.scrollTo(0, document.body.scrollHeight);
    let myChart = document.getElementById('myChart').getContext('2d');
    // Global Options
    Chart.defaults.global.defaultFontFamily = 'HCo Gotham SSm,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif';
    Chart.defaults.global.defaultFontSize = 9;
    Chart.defaults.global.defaultFontColor = generalFontColor;

    let massPopChart = new Chart(myChart, {
        type: 'line', // bar, horizontalBar, pie, line, doughnut, radar, polarArea
        data: {

            datasets: [{
                label: 'Sale Price',
                data: thisdata,
                //backgroundColor:'green',


                borderWidth: 1,
                borderColor: '#4CBC51',
                hoverBorderWidth: 3,
                hoverBorderColor: '#161616',
                pointBackgroundColor: "#4CBC51"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'RAP Data',
                fontSize: 25,
                fontColor: generalFontColor
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: 10,
                        unit: 'day',
                        displayFormats: {
                            'day': 'MMM D'
                        },
                        tooltipFormat: 'MMM DD YYYY'

                    },

                    gridLines: {
                        display: true,
                        color: "#161616"
                    },
                }],
                yAxes: [{
                    gridLines: {
                        display: true,
                        color: "#161616"
                    },
                    ticks: {
                        beginAtZero: true,
                        userCallback: function (value, index, values) {
                            value = value.toString();

                            return value.commafy()
                        }
                    }
                }]
            },
            legend: {
                display: false,
                position: 'right',
                labels: {
                    fontColor: generalFontColor
                }
            },
            layout: {
                padding: {
                    left: 50,
                    right: 0,
                    bottom: 0,
                    top: 0
                }
            },

            tooltips: {
                enabled: true,
                displayColors: false,
                titleFontSize: 25,
                bodyFontSize: 30,
                backgroundColor: generalBackgroundColor,
                bodyFontColor: generalFontColor,
                titleFontColor: generalFontColor,
                callbacks: {
                    label: function (tooltipItem, data) {
                        var tooltipValue = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

                        return "Sale price: " + String(tooltipValue.y).commafy()
                    }
                }
            }
        }
    });

    url = await sendGETRequest("https://thumbnails.roblox.com/v1/assets?assetIds=" + String(item_id) + "&size=150x150&format=Png&isCircular=false")

    url = url.data[0].imageUrl

    var a = document.createElement("a");
    let href = "https://www.roblox.com/catalog/" + String(item_id)

    a.href = href
    a.target = "_blank"
    a.style.position = 'absolute'
    a.style.height = '100px'
    a.style.width = '100px'
    a.style.top = "50px"
    a.style.left = "100px"
    a.className = "canvasDisplayImage"

    div.appendChild(a);


    var img = document.createElement("input");
    img.type = "image"
    img.src = chrome.runtime.getURL("icons/close.png");
    img.style.position = 'absolute'
    img.style.height = '40px'
    img.style.width = '40px'
    img.style.top = "0px"
    img.style.right = "20px"
    img.className = "RAPChartClose"
    img.style.backgroundColor = "#ffffff"
    img.style.borderRadius = "50%"
    img.style.outline = "none"

    div.appendChild(img);


    img.addEventListener("click", function () {
        if (document.getElementById("myChart") != null) {

            document.getElementById("myChart").parentElement.remove()
        }
        document.getElementsByClassName("content")[0].style.paddingBottom = undefined
    })

    var img = document.createElement("img");
    img.src = url

    img.style.position = 'absolute'
    img.style.height = '90px'
    img.style.width = '90px'

    img.className = "canvasDisplayImage"

    a.appendChild(img);

}


function sort_object(obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {

        result[String(key)] = obj[key];
        return result;
    }, {});
}



// this is needed to sort values as integers
function sortNumber(a, b) {
    return a - b;
}

const timer = ms => new Promise(res => setTimeout(res, ms))

function retrieveCSRFToken() {
    var scriptContent = "";
    scriptContent += "$('body').attr('tmp_token',  Roblox.XsrfToken.getToken());\n"
    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    let ret = $("body").attr("tmp_token");
    $("body").removeAttr('tmp_token');
    $("#tmpScript").remove();
    return ret;
}
var canCleanTrades = true

async function declineTrade(tradeId) {
    return await new Promise(async (resolve, reject) => {
        fetch(`https://trades.roblox.com/v1/trades/${tradeId}/decline`, {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CSRF-TOKEN": retrieveCSRFToken()
            }
        }).then((res) => {
            console.log(res)
            if (res.status == 200) {
                chrome.runtime.sendMessage({
                    command: "tradeDeclined",
                    data: tradeId
                })
                resolve(true)
            } else {
                resolve(false)
            }
        }).catch((error) => {
            console.log(error)
            resolve(false)
        });
    })
}

function isInbound() {
    return $(document.querySelector("#trades-container > div > div.ng-scope > div > div > div.col-xs-12.col-sm-8.trades-list-detail > div > div.trade-buttons > button:nth-child(2)")).is(":visible");
}
function cleanTrades(declineValueLosses, declineThreshold, declineProjecteds, dontDeclineRares, maxDeclineAmount, whitelistedUsers) {
    const waitTime = 200
    let values = window.values

    let automationWidget = document.getElementById("automationwidget")
    let startDecline = document.getElementById("declineButton")

    return new Promise(async (resolve, reject) => {
        if (canCleanTrades == true) {
            canCleanTrades = false
            let declined = 0

            function updateStatus(processed, declined) {
                startDecline.innerHTML = `Trades scanned: ${processed} Trades declined: ${declined}`
            }
            updateStatus(0, 0)

            var item_data = values.items
            const tradeCache = await getFromStorageLocal("tradeCache")
            let retries = 0
            const keys = Object.keys(tradeCache)
            async function cacheLoop(index) {
                if ((index === Object.keys(tradeCache).length || index === Number(maxDeclineAmount)) && index !== 0) { //not index + because we want it to scan the last trade
                    //all trades have been scanned, finish
                    let dropdown = document.getElementsByClassName("input-group-btn group-dropdown trade-list-dropdown open")[0]
                    if (dropdown == undefined) {
                        //not open
                        dropdown = document.getElementsByClassName("input-group-btn group-dropdown trade-list-dropdown")[0]
                        let dropdownButton = dropdown.getElementsByClassName('input-dropdown-btn')[0]
                        dropdownButton.click();
                        let inboundButton = document.getElementById("tab-Inbound")
                        inboundButton.getElementsByTagName("a")[0].click();
                    } else {
                        //open
                        let inboundButton = document.getElementById("tab-Inbound")
                        inboundButton.getElementsByTagName("a")[0].click();
                    }
                    startDecline.innerHTML += "<br>Completed!"
                    return resolve()
                } else {
                    let cachedTrade = tradeCache[keys[index]]
                    if (cachedTrade !== null) {
                        let data = cachedTrade
                        let total1 = 0
                        let total2 = 0
                        let myUserId = getMeta("data-userid")
                        if (data.offers[1].user.id == myUserId) {
                            myAssets = data.offers[1].userAssets
                            myRobux = Math.round(data.offers[1].robux * .7)
                            theirAssets = data.offers[0].userAssets
                            theirRobux = Math.round(data.offers[0].robux * .7)
                        } else {
                            myAssets = data.offers[0].userAssets
                            myRobux = Math.round(data.offers[0].robux * .7)
                            theirAssets = data.offers[1].userAssets
                            theirRobux = Math.round(data.offers[1].robux * .7)
                        }
                        for (let n2 = 0; n2 < myAssets.length; n2++) {
                            let assetId = myAssets[n2].assetId
                            let value = item_data[assetId][4]
                            total1 += value
                        }
                        let isProjected = false
                        let isRare = false
                        for (let n2 = 0; n2 < theirAssets.length; n2++) {
                            let assetId = theirAssets[n2].assetId
                            let value = item_data[assetId][4]
                            let thisprojected = item_data[assetId][7]
                            let thisrare = item_data[assetId][9]
                            if (thisprojected == 1) {
                                isProjected = true
                            }
                            if (thisrare == 1) {
                                isRare = true
                            }
                            total2 += value
                        }
                        if (whitelistedUsers.indexOf(String(data.user.id)) == -1 && whitelistedUsers.indexOf(String(data.user.name)) == -1 && whitelistedUsers.indexOf(String(data.user.displayName)) == -1) {
                            let minimumLossNumber = (total1 + myRobux) * declineThreshold
                            if ((((total1 + myRobux) - minimumLossNumber > (total2 + theirRobux) && declineValueLosses == true) || (declineProjecteds == true && isProjected)) && !(dontDeclineRares && isRare)) {
                                let response = await declineTrade(cachedTrade.id)
                                if (response) {
                                    console.log("declined trade: " + total1 + " : " + total2)
                                    declined++
                                    index++
                                    retries = 0
                                    updateStatus(index, declined)
                                    setTimeout(function () {
                                        cacheLoop(index)
                                    }, waitTime)
                                } else {
                                    if (retries < 3) {
                                        retries++
                                        updateStatus(index, declined)
                                        setTimeout(function () {
                                            cacheLoop(index)
                                        }, waitTime * 5)
                                    } else {
                                        index++
                                        updateStatus(index, declined)
                                        setTimeout(function () {
                                            cacheLoop(index)
                                        }, waitTime)
                                    }
                                }
                            } else {
                                //trade doesn't need to be declined, continue
                                setTimeout(function () {
                                    index++
                                    updateStatus(index, declined)
                                    cacheLoop(index)
                                }, waitTime)
                            }
                        } else {
                            //current trade is null, continue
                            setTimeout(function () {
                                index++
                                updateStatus(index, declined)
                                cacheLoop(index)
                            }, waitTime)
                        }
                    }
                }
            }
            cacheLoop(0)
        }
    })
}

function declineAllTrades() {
    return new Promise(async resolve => {
        let tradeCount = await sendGETRequest('https://trades.roblox.com/v1/trades/Inbound/count')
        tradeCount = tradeCount.count

        let startAllDecline = document.getElementById("declineAllButton")
        let declined = 0;
        function updateStatus() {
            startAllDecline.innerHTML = `Trades declined: ${declined}/${tradeCount}`
        }
        updateStatus()
        canCleanTrades = false
        let pageCursor = ""

        async function run() {
            data = await sendGETRequest(`https://trades.roblox.com/v1/trades/Inbound?sortOrder=Asc&limit=100&cursor=${pageCursor}`)
            if (data != null) {
                tradesData = data.data;
                pageCursor = data.nextPageCursor;
                for (var key in tradesData) {
                    if (tradesData.hasOwnProperty(key)) {
                        await declineTrade(tradesData[key].id)
                        console.log('declined trade')
                        declined++
                        updateStatus()
                    }
                }
                console.log('done')
                if (pageCursor !== null) {
                    run();
                } else {
                    startAllDecline.innerHTML += "<br>Completed!"

                    let dropdown = document.getElementsByClassName("input-group-btn group-dropdown trade-list-dropdown open")[0]
                    if (dropdown == undefined) {
                        //not open
                        dropdown = document.getElementsByClassName("input-group-btn group-dropdown trade-list-dropdown")[0]
                        let dropdownButton = dropdown.getElementsByClassName('input-dropdown-btn')[0]
                        dropdownButton.click();
                        let inboundButton = document.getElementById("tab-Inbound")
                        inboundButton.getElementsByTagName("a")[0].click();
                    } else {
                        //open
                        let inboundButton = document.getElementById("tab-Inbound")
                        inboundButton.getElementsByTagName("a")[0].click();
                    }

                    setTimeout(() => {
                        startAllDecline.innerHTML = "Start Declining All Inbound Trades"
                        canCleanTrades = true
                        resolve()
                    }, 3000);
                }
            } else {
                waitTime = 7000;
                await timer(waitTime);
                canCleanTrades = true;
                run();
            }
        }
        run()
    });
}
function getFilterModeNumber(filterMode) {
    if (filterMode == 0) {
        filterMode = 0
        return filterMode
    }
    if (filterMode == 1) {
        filterMode = -9999999999
        return filterMode
    }
    if (filterMode == 2) {
        filterMode = 0.05
        return filterMode
    }
    if (filterMode == 3) {
        filterMode = 0.1
        return filterMode
    }
    if (filterMode == 4) {
        filterMode = 0.3
        return filterMode
    }

}
async function removeFollowing(maxRemoveAmount, whitelistedUsers) {
    let automationWidget = document.getElementById("automationwidget")
    let startRemove = document.getElementById("removeFollowing")
    let declined = 0
    let processed = 0

    function updateStatus(processed, declined) {
        startRemove.innerHTML = `Following scanned: ${processed} Following removed: ${declined}`
    }

    let nextPageCursor = null
    let first = true

    function run(nextPageCursor) {
        const myUserId = getMeta("data-userid")
        if (nextPageCursor != null || first == true) {
            first = false
            $.get(
                `https://friends.roblox.com/v1/users/${myUserId}/followings?sortOrder=Asc&limit=100&nextPageCursor=` + nextPageCursor, {},
                function (data) {
                    nextPageCursor = data.nextPageCursor
                    data = data.data
                    let i = 0

                    function loop() {
                        if (data[i] == undefined && (processed >= maxRemoveAmount && processed != 0)) {
                            if (nextPageCursor != null) {
                                setTimeout(function () { run(nextPageCursor) }, 5000);
                            } else {
                                startRemove.innerHTML += "<br>Completed!"
                            }
                            return
                        }
                        processed++

                        $.ajaxSetup({
                            headers: {
                                'X-CSRF-TOKEN': retrieveCSRFToken()
                            },
                            xhrFields: {
                                withCredentials: true
                            }
                        });
                        $.post('https://friends.roblox.com/v1/users/' + parseInt(data[i].id) + '/unfollow', {}, function (response, status) {
                            if (status == "success") {
                                declined++
                            }
                            i++
                            updateStatus(processed, declined)
                            loop()

                        })
                    }
                    loop()
                }
            );
        }
    }
    run("")
}

var x, y, target = null;

document.addEventListener('mousedown', function (e) {
    var clickedDragger = false;
    e.path = e.composedPath()
    for (var i = 0; e.path[i] !== document.body; i++) {
        if (e.path[i].classList.contains('dragger')) {
            clickedDragger = true;
        } else if (clickedDragger && e.path[i].classList.contains('draggable')) {
            target = e.path[i];
            target.classList.add('dragging');
            x = e.clientX - target.style.left.slice(0, -2);
            y = e.clientY - target.style.top.slice(0, -2);
            return;
        }
    }
});

document.addEventListener('mouseup', function () {
    if (target !== null) target.classList.remove('dragging');
    target = null;
});

document.addEventListener('mousemove', function (e) {
    if (target === null) return;
    target.style.left = e.clientX - x + 'px';
    target.style.top = e.clientY - y + 'px';
    var pRect = target.parentElement.getBoundingClientRect();
    var tgtRect = target.getBoundingClientRect();

    if (tgtRect.left < pRect.left) target.style.left = 0;
    if (tgtRect.top < pRect.top) target.style.top = 0;
    if (tgtRect.right > pRect.right) target.style.left = pRect.width - tgtRect.width + 'px';
    if (tgtRect.bottom > pRect.bottom) target.style.top = pRect.height - tgtRect.height + 'px';
});

//creates the "Trade Filterer" GUI, and injects it into the pages
let canSetUpGUI = true
async function setUpGUI() {
    let test = document.getElementById("automationwidget")
    if (test == null && document.URL.indexOf("/trades") != -1 && canSetUpGUI) {
        canSetUpGUI = false

        let mainframe = document.getElementById("container-main");
        let url = chrome.runtime.getURL("automationwidget.html")
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.send();

        xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                let finalInsertString = xhr.response
                mainframe.insertAdjacentHTML('afterbegin', finalInsertString);
                let automationWidget = document.getElementById("automationwidget")
                automationWidget.style.left = $(window).width() - automationWidget.clientWidth - 35 + "px"
                url = chrome.runtime.getURL("icons/primary.png");
                theseIcons = Array.from(automationWidget.getElementsByClassName("icons_ITV"))

                theseIcons.forEach(function (img) {
                    img.src = url
                })

                if (darkMode()) {
                    automationWidget.style.setProperty("background-color", "rgb(25, 27, 29)", "important");
                } else {
                    automationWidget.style.setProperty("background-color", "#f2f4f5", "important");
                }

                let automationHideBox = $("#automation-hide-box")
                let automationHideButton = $("#automation-hide-button")
                function toggleWidget() {
                    if (automationHideButton.html() == "-") {
                        automationHideButton.html("+");
                    } else {
                        automationHideButton.html("-");
                    }
                    automationHideBox.slideToggle();
                }
                automationHideButton.click(toggleWidget);
                toggleWidget();
                canSetUpGUI = true

                let startDecline = document.getElementById("declineButton")
                startDecline.addEventListener("click", async function () {
                    if (canCleanTrades == true) {
                        let declineValueLosses = automationWidget.getElementsByClassName("value")[0].checked
                        let declineThreshold = automationWidget.getElementsByClassName("value")[1].value
                        let declineProjecteds = automationWidget.getElementsByClassName("value")[2].checked
                        let dontDeclineRares = automationWidget.getElementsByClassName("value")[3].checked
                        let maxDeclineAmount = automationWidget.getElementsByClassName("value")[4].value
                        let whitelistedUsers = automationWidget.getElementsByClassName("value")[5].value
                        whitelistedUsers = whitelistedUsers.split(',');
                        whitelistedUsers.forEach((x, i) => whitelistedUsers[i] = x.replace(/\s+/g, ''));

                        if (declineValueLosses || declineProjecteds) {
                            await cleanTrades(declineValueLosses, declineThreshold, declineProjecteds, dontDeclineRares, maxDeclineAmount, whitelistedUsers)
                        }
                        setTimeout(() => {
                            startDecline.innerHTML = "Start Declining Inbound Trades"
                            canCleanTrades = true
                        }, 3000)
                        //set to a negative number to decline when any less that winning that much, set to a positive number to decline when you're losing at least less than that
                    }
                }, false);

                let startAllDecline = document.getElementById("declineAllButton")
                startAllDecline.addEventListener("click", async function () {
                    if (canCleanTrades) {
                        if (confirm('This will decline all of your inbound trades. Are you sure you would like to proceed?')) {
                            declineAllTrades().then(() => {
                                console.log('done')
                            })
                        }
                    }
                }, false)

                let startRemoveFollowing = document.getElementById("removeFollowing")
                startRemoveFollowing.addEventListener("click", async function () {
                    let maxRemoveAmount = automationWidget.getElementsByClassName("value")[6].value
                    removeFollowing(maxRemoveAmount)

                })
                Array.from(automationWidget.getElementsByClassName("row")).forEach(async function (row) {
                    let child = row.getElementsByTagName("input")[0]
                    if (child == undefined) {
                        child = row.getElementsByTagName("textarea")[0]
                    }
                    $(child).on('input', function () {
                        let name = child.parentElement.getElementsByTagName("span")[0].innerHTML
                        if (child.classList.contains("checkbox")) {
                            name = child.parentElement.parentElement.getElementsByTagName("span")[0].innerHTML
                        }
                        let value = child.value
                        if (child.classList.contains("checkbox")) {
                            value = child.checked
                        }
                        saveLocal(name, value)
                    });
                    if (child.classList.contains("checkbox")) {
                        let name = child.parentElement.parentElement.getElementsByTagName("span")[0].innerHTML
                        child.checked = await getFromStorageLocal(name)
                    } else {
                        let name = child.parentElement.getElementsByTagName("span")[0].innerHTML
                        child.value = await getFromStorageLocal(name)
                    }
                })
            }

        }
    };
};

//value handling
var values
var brackets
String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

//checks if child element is decendant
function isDescendant(parent, child) {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}
//play notification sound
async function playSound() {
    if (await getFromStorageLocal("Activation noise") == true) {
        url = chrome.runtime.getURL("audio/click.mp3")
        var audio = new Audio(url);
        audio.volume = 0.3;
        audio.play();
    }
}

function realBackgroundColor(elem) {
    var transparent = 'rgba(0, 0, 0, 0)';
    var transparentIE11 = 'transparent';
    if (!elem) return transparent;

    var bg = getComputedStyle(elem).backgroundColor;
    if (bg === transparent || bg === transparentIE11) {
        return realBackgroundColor(elem.parentElement);
    } else {
        return bg;
    }
}
var canSideValues = true

function findInCache(this_cache, id) {
    let value = false
    if (this_cache != []) {
        this_cache.forEach(function (trade, index) {
            if (trade['id'] == id) {
                value = trade
            }
        })
    }
    return value
}
let canSideValuePreview = null
async function run3() {
    canSideValuePreview = await getFromStorageLocal("Trade List Values")
}
run3()

function getMeta(metaName) {
    const metas = document.getElementsByTagName('meta');

    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute(metaName) != null) {
            return metas[i].getAttribute(metaName);
        }
    }

    return '';
}

let cursor = "";
let loadedTradeCount = 0
let loadingTrades = false
let tradesDeclinedSinceLastLoad = 0
let selectedId = null
let tradesType = 'inbound'

function tradeDeclined() {
    console.log(selectedId);
    chrome.runtime.sendMessage({
        command: "tradeDeclined",
        data: selectedId
    })
    tradesDeclinedSinceLastLoad++;
}

function fetchTrades(tradesType) {
    return new Promise(async resolve => {
        data = await sendGETRequest(`https://trades.roblox.com/v1/trades/${tradesType}?cursor=${cursor}&limit=10&sortOrder=Asc`);
        if (data != null) {
            if (data.nextPageCursor === null) {
                //cursor = "";
            } else {
                cursor = data.nextPageCursor;
            }
            resolve(data.data);
        } else {
            resolve(null);
        }
    })
}

function resetLoadTrades() {
    cursor = "";
    loadedTradeCount = 0;
}

async function addTradeListValues(tradeRowContainers) {
    const tradeCache = await getFromStorageLocal("tradeCache")
    const values = window.values.items
    const myUserId = getMeta("data-userid")

    Array.from(tradeRowContainers).forEach((tradeRowContainer, index) => {
        if (tradeRowContainer.hasAttribute('itvtradeid')) {
            const tradeid = Number(tradeRowContainer.getAttribute("itvtradeid"));
            const trade = tradeCache[tradeid] //get trade from cache
            if (trade) {
                if (trade.offers[1].user.id == myUserId) {
                    myAssets = trade.offers[1].userAssets
                    myRobux = Math.round(trade.offers[1].robux * .7)
                    theirAssets = trade.offers[0].userAssets
                    theirRobux = Math.round(trade.offers[0].robux * .7)
                } else {
                    myAssets = trade.offers[0].userAssets
                    myRobux = Math.round(trade.offers[0].robux * .7)
                    theirAssets = trade.offers[1].userAssets
                    theirRobux = Math.round(trade.offers[1].robux * .7)
                }

                function calculateTotal(assets, robux) {
                    let total = 0
                    for (let n = 0; n < assets.length; n++) {
                        const assetId = assets[n].assetId
                        const value = values[assetId][4]
                        total += value
                    }
                    total += robux
                    return total
                }
                const total1 = calculateTotal(myAssets, myRobux)
                const total2 = calculateTotal(theirAssets, theirRobux)
                const gain = Number(total2) - Number(total1)

                let tradeListValueBox = tradeRowContainer.getElementsByClassName("sideValueBox")[0]
                if (!tradeListValueBox) {
                    tradeRowContainer.insertAdjacentHTML('afterbegin', sideValueBoxHTML);
                    tradeListValueBox = tradeRowContainer.getElementsByClassName("sideValueBox")[0]

                    tradeRowContainer.getElementsByClassName("amount-1")[0].innerHTML = String(total1).commafy()
                    tradeRowContainer.getElementsByClassName("amount-2")[0].innerHTML = String(total2).commafy()

                    if (darkMode()) {
                        tradeListValueBox.style.setProperty("background-color", "rgb(52 54 56)");
                        tradeRowContainer.getElementsByClassName("amount-1")[0].style.setProperty("color", "#fff", "important");
                        tradeRowContainer.getElementsByClassName("amount-2")[0].style.setProperty("color", "#fff", "important");
                    } else {
                        tradeListValueBox.style.setProperty("background-color", "rgb(242 244 245)");
                        tradeRowContainer.getElementsByClassName("amount-1")[0].style.setProperty("color", "#393b3d", "important");
                        tradeRowContainer.getElementsByClassName("amount-2")[0].style.setProperty("color", "#393b3d", "important");
                    }
                    if (gain == 0) {
                        addMouseOver(tradeListValueBox, iconMouseOverText['tradelistvaluesequal'])
                    } else {
                        function setStyle(elem, propertyObject) {
                            for (var property in propertyObject) {
                                elem.style[property] = propertyObject[property];
                            }
                        }

                        if (gain > 0) {
                            let bar = tradeRowContainer.getElementsByClassName("glowBar")[0]
                            setStyle(bar, { '-webkit-box-shadow': 'rgb(46 255 53) 0px 0px 10px 1px', '-moz-box-shadow': 'rgb(46 255 53) 0px 0px 10px 1px', 'box-shadow': 'rgb(46 255 53) 0px 0px 10px 1px', 'background-color': 'rgb(122 255 88)' });
                            /*
                            $(bar).css("-webkit-box-shadow", "rgb(46 255 53) 0px 0px 10px 1px");
                            $(bar).css("-moz-box-shadow", "rgb(46 255 53) 0px 0px 10px 1px");
                            $(bar).css("box-shadow", "rgb(46 255 53) 0px 0px 10px 1px");
                            $(bar).css("background-color", "rgb(122 255 88)");
                            */
                            addMouseOver(tradeListValueBox, iconMouseOverText['tradelistvalueswin'])
                        }
                        if (gain < 0) {
                            let bar = tradeRowContainer.getElementsByClassName("glowBar")[0]
                            setStyle(bar, { '-webkit-box-shadow': 'rgb(255 0 0) 0px 0px 10px 1px', '-moz-box-shadow': 'rgb(255 0 0) 0px 0px 10px 1px', 'box-shadow': 'rgb(255 0 0) 0px 0px 10px 1px', 'background-color': 'rgb(255 60 60)' });
                            /*
                            $(bar).css("-webkit-box-shadow", "rgb(255 0 0) 0px 0px 10px 1px");
                            $(bar).css("-moz-box-shadow", "rgb(255 0 0) 0px 0px 10px 1px");
                            $(bar).css("box-shadow", "rgb(255 0 0) 0px 0px 10px 1px");
                            $(bar).css("background-color", "rgb(255 60 60) ");
                            */
                            addMouseOver(tradeListValueBox, iconMouseOverText['tradelistvaluesloss'])
                        }
                    }
                }
            }
        }
    })
}

async function loadTrades() {
    loadingTrades = true;
    const trades = await fetchTrades(tradesType);
    if (trades !== null) {
        const tradeRowContainers = document.getElementsByClassName("trade-row-container");
        for (let n = 0; n < trades.length; n++) { //load more trades
            let tradeRowContainer = tradeRowContainers[loadedTradeCount + n];
            if (typeof (tradeRowContainer) == "object") {
                tradeRowContainer.setAttribute("itvtradeid", trades[n].id);
            }
        }

        function findOffsetToId(tradeRowContainerIndex) { //tradeRowContainer is the first tradeRowContainer without itvtrade id attribute
            let x = 0
            for (let n = tradeRowContainerIndex; n < tradeRowContainers.length; n++) {
                let thisTradeRowContainer = tradeRowContainers[n]
                if (thisTradeRowContainer.hasAttribute('itvtradeid')) {
                    return [x, Number(thisTradeRowContainer.getAttribute('itvtradeid'))]
                }
                x++
            }
        }

        function findIndexOfIdInData(allTrades, id) {
            if (allTrades) {
                for (let n = 0; n < allTrades.length; n++) {
                    const trade = allTrades[n]
                    if (trade.id === id) {
                        return n
                    }
                }
            } else {
                return null
            }
        }
        if (tradeRowContainers[loadedTradeCount - tradesDeclinedSinceLastLoad] && !tradeRowContainers[loadedTradeCount - tradesDeclinedSinceLastLoad].hasAttribute('itvtradeid')) { //if the trade before newly loaded has not been loaded, if this is true then the tradeRowContainer at index loadedTradeCount - 1 is the first without itvtradeid attribute
            for (let n = loadedTradeCount - tradesDeclinedSinceLastLoad; n < tradeRowContainers.length; n++) { //loop through all trades starting at the one that could be unloaded because of decline offset
                const tradeRowContainer = tradeRowContainers[n]
                if (tradeRowContainer.hasAttribute('itvtradeid')) {
                    break;
                }
                const findOffsetToIdResult = findOffsetToId(n)
                const offset = findOffsetToIdResult[0]
                const id = findOffsetToIdResult[1]
                const allTrades = await getFromStorageLocal("allTrades")
                const indexOfOffsetIdInData = findIndexOfIdInData(allTrades, id)
                const tradeData = allTrades[indexOfOffsetIdInData - offset]
                tradeRowContainer.setAttribute("itvtradeid", tradeData.id);
            }
        }
        loadedTradeCount += trades.length;
        tradesDeclinedSinceLastLoad = 0
        addTradeListValues(tradeRowContainers)

        loadingTrades = false;
        sideValues()
    } else {
        setTimeout(() => {
            loadingTrades = false;
            sideValues()
        }, 10000)
    }
}

async function sideValues() {
    let sendmode = false
    let newdetectors = Array.from(document.getElementsByClassName("paired-name ng-binding"))
    if (newdetectors.length == 3) {
        sendmode = true //detects whether we are in counter / send trade mode, or not
    }
    if (await getFromStorageLocal("Trade List Values") === true && sendmode === false && isInbound()) {
        if ((document.getElementsByClassName("trade-row-container").length > loadedTradeCount) && loadingTrades === false) { //check if more trades have been added to DOM since last loadTrades()
            loadTrades(); //try to attach more itvtradeids
        }
        const tradeRowContainers = document.getElementsByClassName("trade-row-container");
        addTradeListValues(tradeRowContainers); //try to add trade list HTML using new itvtradeids
    }
}


//adds values to page( previous values should be wiped beforehand )

function isOverflown(e) {
    return (e.offsetWidth < e.scrollWidth);
}

function cloneAttributes(element, sourceNode) {
    let attr;
    let attributes = Array.prototype.slice.call(sourceNode.attributes);
    while (attr = attributes.pop()) {
        element.setAttribute(attr.nodeName, attr.nodeValue);
    }
}

function addMouseOver(element, text) {
    element.title = "ITV: " + text
}
var currentUsernamesPrevious = [];
var datePrevious = null
var serialsPrevious = [];
async function handleHiding(type) {
    let current_usernames = Array.from(document.querySelectorAll('.paired-name:not(.ng-hide)'))
    let current_username = null
    if (type == "Hide Serials") {
        if (await getFromStorageLocal("Hide Serials") == true) {
            serialsPrevious = [];
        }
    }
    if (type == "Hide Usernames") {
        if (await getFromStorageLocal("Hide Usernames") == true) {
            currentUsernamesPrevious = [];
        }
    }
    if (type == "Hide Dates") {
        if (await getFromStorageLocal("Hide Dates") == true) {
            datePrevious = null;
        }
    }
    current_usernames.forEach(async function (element, i) {
        if (await getFromStorageLocal("Hide Usernames") == true) {
            if (element.innerHTML.indexOf("__") == -1) {
                currentUsernamesPrevious = [];
                currentUsernamesPrevious.push(element.innerHTML);
                let current_username_elements = element.getElementsByTagName("span");

                current_username_element = current_username_elements[0];
                current_username = current_username_element.innerHTML;
                current_username_element.innerHTML = "_".repeat(current_username.length);
                current_username_element = current_username_elements[2];
                current_username = current_username_element.innerHTML;
                current_username_element.innerHTML = "_".repeat(current_username.length);

            }
        } else {
            if (element.innerHTML.indexOf("__") != -1) {
                element.innerHTML = currentUsernamesPrevious[i];
            }
        }
    })


    let dataTrade = document.querySelector('[ng-if="data.trade"]');
    if (dataTrade != null) {
        let element = dataTrade.querySelector('[ng-show="data.trade.isActive"]');
        if (element != null) {
            if (!element.classList.contains('ng-hide')) {
                if (await getFromStorageLocal("Hide Dates") == true) {
                    if (element.innerHTML.indexOf("_") == -1) {
                        datePrevious = element.innerHTML;
                        current_date = element.innerHTML.split(" ")[3];
                        element.innerHTML = " Expires on " + "_".repeat(current_date.length);
                    }
                } else {
                    if (element.innerHTML.indexOf("_") != -1) {
                        element.innerHTML = datePrevious;
                    }
                }
            }

        }
    }

    serials = []
    serialElements = document.getElementsByClassName("font-caption-header text-subheader limited-number ng-binding");
    for (i = 0; i < serialElements.length; i++) {
        if (await getFromStorageLocal("Hide Serials") == true) {
            serialsPrevious.push(serialElements[i].innerHTML);
            if (serialElements[i].innerHTML.indexOf("_") == -1) {

                if (serialElements[i].innerHTML != "") {
                    serials.push(serialElements[i].innerHTML);

                    serialElements[i].innerHTML = "_".repeat(String(serialElements[i].innerHTML).length);
                }
            }
        } else {
            if (serialElements[i] != undefined) {
                if (serialElements[i].innerHTML.indexOf("_") != -1) {
                    serialElements[i].innerHTML = serialsPrevious[i];
                }
            }
        }
    }
}

var intervalPadding = null;
async function update_func(response_data) {
    let valueProvider = await getFromStorageLocal("Value Provider")
    let darkmode = darkMode()
    if (darkmode == true) {
        generalFontColor = "#FFFFFF"
        generalBackgroundColor = "#393B3D"
        generalBackgroundColorLighter = "#2d2d2d"
    } else {
        generalFontColor = "#393B3D"
        generalBackgroundColor = "#FFFFFF"
        generalBackgroundColorLighter = "#E5E5E5"
    }

    handleHiding()

    //create automation widget
    let name = "Automation Widget"
    if (await getFromStorageLocal(name) == true) {
        setUpGUI()
    }

    var data = response_data
    if (data != undefined) {
        var item_data = data.items
        //get many needed elements from the page
        var names = Array.from(document.getElementsByClassName("item-card-name ng-binding"));
        var costs = document.getElementsByClassName("text-robux ng-binding");
        var costdivs = document.getElementsByClassName("item-card-price");
        var parent1 = document.getElementsByClassName("trade-list-detail-offer-header ng-binding")[0]
        var parent2 = document.getElementsByClassName("trade-list-detail-offer-header ng-binding")[1]
        var sendparent1 = document.getElementsByClassName("trade-request-window-offer")[0]
        var sendparent2 = document.getElementsByClassName("trade-request-window-offer")[1]
        var newdetectors = Array.from(document.getElementsByClassName("paired-name ng-binding"))

        var robuxadded1 = document.getElementsByClassName("text-label robux-line-value ng-binding")[0]
        var robuxadded2 = document.getElementsByClassName("text-label robux-line-value ng-binding")[1]
        var total1 = document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")[0]
        if (total1 == undefined) {
            return
        }
        var total2 = document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")[1]
        var sendmode = false

        if (newdetectors.length == 3) {
            sendmode = true //detects whether we are in counter / send trade mode, or not
        }

        if (sendmode == false) {
            totalValueElements = document.getElementsByClassName("trade-list-detail-offer ng-scope")
            let automationwidget = document.getElementById("automationwidget")
            if (automationwidget != null) {
                automationwidget.style.visibility = "visible"
            }
        } else {
            totalValueElements = document.getElementsByClassName("trade-request-window-offer")
            let automationwidget = document.getElementById("automationwidget")
            if (automationwidget != null) {
                automationwidget.style.visibility = "hidden"
            }
        }
        if (await getFromStorageLocal("Hide Usernames") == true) {
            let totalvalueElement = totalValueElements[0].getElementsByClassName("text-lead ng-binding")[0]
            let totalvalueElement1 = totalValueElements[1].getElementsByClassName("text-lead ng-binding")[0]
            if (valueProvider == "rolimons.com") {
                totalvalueElement.innerHTML = "Total Value: <br> Total Rolimons Value:"
                totalvalueElement1.innerHTML = "Total Value: <br> Total Rolimons Value:"
            }
            if (valueProvider == "rblx.trade") {
                totalvalueElement.innerHTML = "Total Value: <br> Total Rblx.Trade Value:"
                totalvalueElement1.innerHTML = "Total Value: <br> Total Rblx.Trade Value:"
            }
            if (valueProvider == "rbxcity.com") {
                totalvalueElement.innerHTML = "Total Value: <br> Total RbxCity Value:"
                totalvalueElement1.innerHTML = "Total Value: <br> Total RbxCity Value:"
            }
            totalvalueElement.style.position = "absolute"
            totalvalueElement.parentElement.style.height = "40px"
            totalvalueElement.parentElement.style.lineHeight = "25px"
            totalvalueElement1.style.position = "absolute"
            totalvalueElement1.parentElement.style.height = "40px"
            totalvalueElement1.parentElement.style.lineHeight = "25px"
        }

        var boxes = document.getElementsByClassName("hlist item-cards item-cards-stackable")
        if (sendmode == true) {
            var sendnames = Array.from(document.getElementsByClassName("text-lead item-name"));

            for (n = 0; n < boxes.length; n++) {
                //boxes[n].style.height = "460px" //bottom of panel clips  
                boxes[n].style.lineHeight = 16 //allows me to add over/under rap thing because of extra space
                boxes[n].style.paddingBottom = "30px"


            }
            names = names.concat(sendnames);
        }

        for (n = 0; n < boxes.length; n++) {
            boxes[n].style.padding = "13px"
        }
        var sendrobuxadded1 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[0]
        var sendrobuxadded2 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[1]
        var total_value1 = 0
        var total_value2 = 0
        var send_total_rap1 = 0
        var send_total_rap2 = 0

        let itemRapChart = await getFromStorageLocal("Item RAP Chart")

        for (let i = 0; i < names.length; i++) {
            let marginElement = names[i].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
            if (marginElement != null && sendmode) {
                marginElement.style.marginBottom = "50px"
            }
            let paddingElement = names[i].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
            if (paddingElement != null) {
                paddingElement.style.paddingBottom = "40px"
            }
        }
        for (let i = 0; i < names.length; i++) {
            if (names[i].parentElement.parentElement.parentElement != null) {
                var cost = names[i].parentElement.parentElement.parentElement.getElementsByClassName("text-overflow item-card-price")[0]

                if (cost == null) {
                    cost = names[i].parentElement.parentElement.getElementsByClassName("item-value ng-scope")[0]
                }
                cost = cost.getElementsByClassName("text-robux ng-binding")[0]

                if (cost != undefined) {
                    if (true) { //if previous value has been wiped
                        try {

                            if (names[i].className == "text-lead item-name") { //if element is counter added item element
                                var element = names[i].getElementsByClassName("ng-binding")[0]

                            } else { //if element is normal element
                                var element = names[i].parentElement.parentElement
                                var box = names[i].parentElement.parentElement.parentElement.parentElement.getElementsByClassName("item-card-link")[0]
                            }

                            var href = element.getAttribute("href");
                            href = href.substring(0, href.lastIndexOf("/"))
                            var id = href.match(/\d/g);
                            id = id.join("");
                            let uaid = names[i].parentElement.parentElement.parentElement.parentElement.getAttribute("data-userassetid")

                            let item = item_data[id]
                            let value = item[4]
                            let trend = item[6]
                            let rare = item[9]

                            let proofBased = false
                            let proofBasedFlagging = await getFromStorageLocal("Flag Proof Based")
                            if (item[10] == 1) {
                                proofBased = true
                            }

                            let RAP = item[2]


                            string = cost.innerHTML
                            if (string.indexOf('|') != -1) {
                                string = string.substring(0, string.indexOf('|'));
                            }


                            var thisindex = string.indexOf('>')
                            if (thisindex == -1) {
                                thisindex = string.indexOf('|')
                            }
                            if (thisindex != -1) {
                                string = string.substring(0, (string.indexOf('>')));

                            }
                            RAP = parseInt(string.replace(/,/g, ""))
                            let projected = item[7]
                            let isValued = item[3]

                            if (isValued == -1) {
                                isValued = false
                            } else {
                                isValued = true
                            }

                            let minRAP = null
                            let nextMinRAP = null
                            let index = 0
                            let canRaise = true;
                            for (num = 0; num < Object.values(window.brackets).length; num++) {
                                let key = Object.keys(window.brackets)[num]
                                let current_value = Object.values(window.brackets)[num]
                                if (Number(value) == Number(current_value)) {

                                    minRAP = key

                                    if (minRAP == null) {
                                        minRAP = 0
                                    }
                                    if (Object.keys(window.brackets)[num + 1] != null) {
                                        nextMinRAP = Object.keys(window.brackets)[num + 1]
                                    } else {
                                        canRaise = false;
                                        nextMinRAP = 99999999999999999
                                    }
                                }
                            }

                            let aboveRap = false
                            let belowRap = false
                            let amount = null
                            let toRaise = nextMinRAP - RAP;
                            let willRaise = false;
                            if (valueProvider == "rolimons.com") {
                                if (isValued == true && value >= Object.values(window.brackets)[0]) {

                                    if (RAP > nextMinRAP && await getFromStorageLocal("Over-RAP data") == true && proofBased == false) {

                                        aboveRap = true

                                        amount = RAP - nextMinRAP
                                    }
                                    if (RAP < minRAP && await getFromStorageLocal("Under-RAP data") == true && proofBased == false) {
                                        belowRap = true
                                        amount = minRAP - RAP
                                    }

                                    if (!(RAP < minRAP) && !(RAP > nextMinRAP) && await getFromStorageLocal("Till raise data") == true && proofBased == false && canRaise) {
                                        willRaise = true;
                                    }
                                }
                            }

                            await (async function (i, cost) {
                                if (names[i].className != "text-lead item-name") { //is not counter small item
                                    //Set up flag box
                                    let itemCardThumbContainer = names[i].parentElement.parentElement.parentElement.parentElement.getElementsByClassName("item-card-thumb-container")[0]
                                    if (itemCardThumbContainer.getElementsByClassName("flagBox")[0] == null) {
                                        var flagBox = document.createElement("div")
                                        flagBox.style.backgroundColor = "rgba(0,0,0,0.2)"

                                        flagBox.style.maxWidth = "54px"
                                        flagBox.style.borderRadius = "8px"
                                        flagBox.style.position = "absolute"
                                        if (document.getElementsByClassName("limited-icon-container tooltip-pastnames infocardbutton")[0] == null) {
                                            flagBox.style.top = "0px"
                                            flagBox.style.left = "0px"
                                        } else {
                                            flagBox.style.top = "0px"
                                            flagBox.style.right = "0px"
                                        }
                                        flagBox.className = "flagBox"


                                        itemCardThumbContainer.appendChild(flagBox)
                                    } else {
                                        var flagBox = itemCardThumbContainer.getElementsByClassName("flagBox")[0]
                                    }
                                }

                                async function addFlag(iconName) {

                                    let className = iconName.slice(6, iconName.length - 4)
                                    if (flagBox.getElementsByClassName(className)[0] == null) {
                                        var img = document.createElement("img");
                                        img.src = chrome.runtime.getURL(iconName)
                                        img.style.height = '27px'
                                        img.style.width = '27px'
                                        img.style.padding = "3px"
                                        img.className = className

                                        flagBox.appendChild(img);
                                        addMouseOver(img, iconMouseOverText[className])

                                    }

                                }

                                async function getCurrentPlayerIdAndName() {
                                    return new Promise((resolve, reject) => {
                                        let buttons = Array.from(document.getElementsByClassName("btn-control-md ng-binding"))
                                        buttons.forEach(function (object, index) {
                                            if (object.innerHTML == "Counter") {
                                                current_usernames = Array.from(document.getElementsByClassName("paired-name ng-binding"))
                                                current_usernames.forEach(function (element) {
                                                    if (element.innerHTML.indexOf("Trade with ") != -1) {
                                                        let current_username_element = element.getElementsByTagName("span")
                                                        if (current_username_element.length == 3) {
                                                            current_username_element = current_username_element[2]

                                                            var current_username = current_username_element.innerHTML
                                                            if (current_username.indexOf("__") !== -1 && currentUsernamesPrevious[0] != undefined) {
                                                                function getUsernameFromHTML(html) {
                                                                    var mySubString = html.substring(
                                                                        0,
                                                                        html.lastIndexOf("<")
                                                                    );
                                                                    mySubString = mySubString.substring(
                                                                        mySubString.lastIndexOf(">") + 1,
                                                                        mySubString.length
                                                                    );
                                                                    return mySubString
                                                                }
                                                                current_username = getUsernameFromHTML(currentUsernamesPrevious[0])
                                                            }
                                                            var xhttp = new XMLHttpRequest();
                                                            xhttp.open("GET", "https://api.roblox.com/users/get-by-username?username=" + current_username);
                                                            xhttp.withCredentials = true;
                                                            xhttp.send();
                                                            xhttp.onreadystatechange = async function () {
                                                                if (xhttp.readyState == 4) {
                                                                    let id = JSON.parse(xhttp.responseText).Id
                                                                    resolve([id, current_username])
                                                                }
                                                            }
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    })
                                }

                                //Create Send new trade button

                                if (document.getElementsByClassName('sendButton')[0] == null && await getFromStorageLocal("Send Trade Button") == true && isInbound()) {
                                    const buttonHTML = `<button type="button" class="btn-control-md ng-binding sendButton">Send</button>`;
                                    let tradeButtons = document.getElementsByClassName('trade-buttons')[0];
                                    if (tradeButtons != null) {
                                        if (document.getElementsByClassName('sendButton')[0] == null) {
                                            tradeButtons.style.padding = "5px";
                                            $(buttonHTML).insertAfter(tradeButtons.querySelector('[ng-click="counterTrade(data.trade)"]'));
                                        }
                                        //tradeButtons.innerHTML += buttonHTML;
                                        let sendButton = tradeButtons.getElementsByClassName('sendButton')[0];
                                        sendButton.onclick = function () {
                                            (async () => {
                                                let userData = await getCurrentPlayerIdAndName();
                                                let userId = userData[0];
                                                let userName = userData[1];
                                                if (await getFromStorageLocal("Send Trade Button - Open in new tab") == true) {
                                                    window.open(`https://www.roblox.com/users/${userId}/trade`, '_blank');
                                                } else {
                                                    window.location.href = `https://www.roblox.com/users/${userId}/trade`;
                                                }
                                            })();
                                        }
                                    }
                                }



                                async function addQuickLinks() {

                                    //if (await getFromStorageLocal("Quick Links") == true) {
                                    if (names[i].className != "text-lead item-name") { //is not counter small item
                                        //create quickLinkBox
                                        let itemCardCaption = names[i].parentElement.parentElement.parentElement
                                        if (itemCardCaption.getElementsByClassName("quickLinkBox")[0] == null) {
                                            let quickLinkBox = document.createElement("div")
                                            quickLinkBox.style.backgroundColor = "rgba(0,0,0,0.1)"
                                            quickLinkBox.style.borderRadius = "8px"
                                            quickLinkBox.style.marginTop = "-5px"
                                            //quickLinkBox.style.marginTop = "-4px"
                                            //quickLinkBox.style.marginBottom = "4px"
                                            quickLinkBox.className = "quickLinkBox"
                                            itemCardCaption.insertBefore(quickLinkBox, itemCardCaption.getElementsByClassName("text-overflow item-card-price")[0]);
                                        }
                                        let quickLinkBox = itemCardCaption.getElementsByClassName("quickLinkBox")[0]

                                        let tradesHeaderNoWrap = document.getElementsByClassName("trades-header-nowrap")[1]
                                        if (tradesHeaderNoWrap == null) {
                                            tradesHeaderNoWrap = document.getElementsByClassName("trades-header-nowrap")[0]
                                        }

                                        if (tradesHeaderNoWrap != null) {
                                            if (tradesHeaderNoWrap.getElementsByClassName("profileQuickLinkBox")[0] == null) {
                                                let profileQuickLinkBox = document.createElement("div")
                                                profileQuickLinkBox.style.backgroundColor = "rgba(0,0,0,0.1)"
                                                profileQuickLinkBox.style.borderRadius = "8px"
                                                profileQuickLinkBox.style.position = "absolute"
                                                profileQuickLinkBox.style.marginTop = "5px"
                                                profileQuickLinkBox.style.marginLeft = "10px"
                                                profileQuickLinkBox.style.display = "inline-block"
                                                let overflowing = isOverflown(tradesHeaderNoWrap)
                                                if (overflowing == true) {
                                                    profileQuickLinkBox.style.right = "-80px"
                                                } else {
                                                    profileQuickLinkBox.style.right = null
                                                }
                                                profileQuickLinkBox.className = "profileQuickLinkBox"
                                                tradesHeaderNoWrap.appendChild(profileQuickLinkBox);
                                            } else {
                                                let profileQuickLinkBox = document.getElementsByClassName("profileQuickLinkBox")[0]
                                                let overflowing = isOverflown(tradesHeaderNoWrap)
                                                if (overflowing == true) {
                                                    profileQuickLinkBox.style.right = "-80px"
                                                } else {
                                                    profileQuickLinkBox.style.right = null
                                                }
                                                profileQuickLinkBox.className = "profileQuickLinkBox"
                                                tradesHeaderNoWrap.appendChild(profileQuickLinkBox);
                                            }
                                            let profileQuickLinkBox = tradesHeaderNoWrap.getElementsByClassName("profileQuickLinkBox")[0]

                                            async function addQuickLink(iconName, url, mouseOverText) {
                                                if (quickLinkBox.getElementsByClassName(iconName + "_link").length == 0) {
                                                    var img = document.createElement("img");
                                                    img.src = icons[iconName]
                                                    img.style.padding = "3px"
                                                    img.style.height = "28px"
                                                    img.style.width = "28px"

                                                    let a = document.createElement("a");

                                                    a.style.zIndex = 1000
                                                    a.target = "_blank"
                                                    a.className = iconName + "_link"
                                                    a.style.height = "28px"
                                                    a.style.width = "28px"
                                                    a.href = url
                                                    a.style.display = "inline-block"

                                                    quickLinkBox.appendChild(a);
                                                    a.appendChild(img)
                                                    addMouseOver(a, mouseOverText)
                                                    if (quickLinkBox.childElementCount < 5) {
                                                        quickLinkBox.style.maxWidth = String(29 * quickLinkBox.childElementCount) + "px"
                                                    } else {
                                                        quickLinkBox.style.maxWidth = String(29 * 4) + "px"
                                                    }
                                                }
                                            }

                                            async function addProfileQuickLink(iconName, url, mouseOverText) {
                                                if (profileQuickLinkBox.getElementsByClassName(iconName + "_link").length != 0) {
                                                    if (profileQuickLinkBox.getElementsByClassName(iconName + "_link")[0].href != url && url.indexOf('undefined') === -1) {
                                                        profileQuickLinkBox.getElementsByClassName(iconName + "_link")[0].remove()
                                                    } else {
                                                        return
                                                    }
                                                }
                                                var img = document.createElement("img");
                                                img.src = icons[iconName]
                                                img.style.padding = "4px"
                                                img.style.height = "38px"
                                                img.style.width = "38px"

                                                let a = document.createElement("a");

                                                a.style.zIndex = 1000
                                                a.target = "_blank"
                                                a.className = iconName + "_link"
                                                a.style.height = "38px"
                                                a.style.width = "38px"
                                                a.href = url
                                                a.style.display = "inline-block"

                                                profileQuickLinkBox.appendChild(a);
                                                a.appendChild(img)
                                                addMouseOver(a, mouseOverText)
                                            }
                                            let url = null
                                            if (await getFromStorageLocal("rolimons.com General Item Link") == true) {
                                                url = "https://www.rolimons.com/item/" + String(id)
                                                addQuickLink("rolimons", url, "A Quick Link to this item's general page on rolimons.com")
                                            }
                                            if (await getFromStorageLocal("rolimons.com UAID specific Item Link") == true) {
                                                url = "https://www.rolimons.com/uaid/" + String(uaid)
                                                addQuickLink("rolimons-specific", url, "A Quick Link to this item's UAID specific page on rolimons.com")
                                            }
                                            if (await getFromStorageLocal("rblx.trade General Item Link") == true) {
                                                url = "https://rblx.trade/i/" + String(id)
                                                addQuickLink("rblx.trade", url, "A Quick Link to this item's general page on rblx.trade")
                                            }
                                            if (await getFromStorageLocal("rblx.trade UAID Specific Item Link") == true) {
                                                url = "https://rblx.trade/uaid/" + String(uaid)
                                                addQuickLink("rblx.trade-specific", url, "A Quick Link to this item's UAID specific page on rblx.trade")
                                            }
                                            let userData = await getCurrentPlayerIdAndName()
                                            let userId = userData[0]
                                            let userName = userData[1]
                                            if (await getFromStorageLocal("rolimons.com User Link") == true) {
                                                let url = "https://www.rolimons.com/player/" + String(userId)
                                                addProfileQuickLink("rolimons", url, "A Quick Link to this user's profile on rolimons.com")
                                            }
                                            if (await getFromStorageLocal("rblx.trade User Link") == true) {
                                                let url = "https://rblx.trade/u/" + String(userName)
                                                addProfileQuickLink("rblx.trade", url, "A Quick Link to this user's profile on rblx.trade")
                                            }
                                        }
                                    }
                                }
                                addQuickLinks()

                                if (box != null && itemRapChart == true) { //in other words, if element is normal element and not send element
                                    let url = null
                                    if (realBackgroundColor(document.body) == "rgb(35, 37, 39)") {
                                        //dark
                                        url = chrome.runtime.getURL("icons/RAPChartDark.svg");

                                    } else {
                                        //light
                                        url = chrome.runtime.getURL("icons/RAPChartLight.svg");
                                    }

                                    var img = document.createElement("input");
                                    img.type = "image"
                                    img.src = url
                                    img.style.position = 'absolute'
                                    img.style.height = '26px'
                                    img.style.width = '26px'
                                    img.style.marginTop = "-25%";
                                    img.style.marginLeft = "94px";
                                    img.className = "RAPChartPopup"
                                    img.style.backgroundColor = "#ffffff"
                                    img.style.borderRadius = "50%"
                                    img.style.outline = "none"

                                    box.appendChild(img);
                                    addMouseOver(img, "Open RAP chart popup")

                                    let thisid = id
                                    img.addEventListener("click", function () {
                                        chart(thisid)
                                    })

                                }
                                if (names[i].className != "text-lead item-name") { //is not counter small item
                                    if (aboveRap == true && await getFromStorageLocal("Flag Over-RAP") == true) {
                                        if (box != null) { //in other words, if element is normal element and not send element
                                            addFlag("icons/overrap.svg")
                                        }
                                    }

                                    if (belowRap == true && await getFromStorageLocal("Flag Under-RAP") == true) {
                                        if (box != null) { //in other words, if element is normal element and not send element
                                            addFlag("icons/underrap.svg")
                                        }
                                    }

                                    if (proofBased == true && proofBasedFlagging == true) {
                                        //proof based
                                        addFlag("icons/proofbased.png")
                                    }
                                    if (box != null) { //in other words, if element is normal element and not send element
                                        if (projected == 1 && RAP > 1199 && await getFromStorageLocal("Flag Projecteds") == true && box.getElementsByClassName("projected")[0] == undefined) {
                                            //projected
                                            addFlag("icons/projected.png")
                                        }
                                    }

                                    if (rare == 1 && await getFromStorageLocal("Flag Rares") == true) {
                                        //rare
                                        addFlag("icons/rare.png")
                                    }
                                }
                                if (value == -1) {
                                    value = Number(item[2])
                                }
                                if (await getFromStorageLocal("Trade Values") == true) {
                                    if (names[i].className != "text-lead item-name") {
                                        cost.style.fontSize = "15px";
                                        cost.parentElement.style.height = '300%'
                                        displayvalue = String(value).commafy()

                                        if (cost.innerHTML.indexOf("<br>") == -1 && cost.innerHTML.indexOf("|") == -1) {

                                            if (aboveRap == true) {

                                                cost.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + displayvalue + "<br>" + "<span style='color:green'>" + String(amount).commafy() + " above" + "<span/>" + "<br/>" + "<br/>")
                                            } else if (belowRap == true) {
                                                cost.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + displayvalue + "<br>" + "<span style='color:red'>" + String(amount).commafy() + " below" + "<span/>" + "<br/>" + "<br/>")
                                            } else if (willRaise == true) {
                                                cost.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + displayvalue + "<br>" + "<span style='color:gold'>" + String(toRaise).commafy() + " till raise" + "<span/>" + "<br/>" + "<br/>")
                                            } else {
                                                cost.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + displayvalue + "<br/>")
                                            }
                                        }
                                        var img = document.createElement("img");
                                        if (valueProvider == "rolimons.com") {
                                            img.src = icons["rolimons"]
                                        }
                                        if (valueProvider == "rblx.trade") {
                                            img.src = icons["rblx.trade"]
                                        }
                                        //img.src = icons["primary"]

                                        img.style.position = 'absolute'
                                        img.style.height = '17px'
                                        img.style.width = '17px'
                                        if (aboveRap == true || belowRap == true || willRaise == true) {
                                            img.style.marginTop = "-66px";
                                        } else {
                                            img.style.marginTop = "-22px";
                                        }
                                        img.className = "rolimons-item"
                                        if (cost.getElementsByClassName("rolimons-item")[0] == undefined) {

                                            cost.appendChild(img);

                                        }

                                        var image = img
                                        var parentElement = image.parentElement;

                                        if (valueProvider == "rolimons.com") {
                                            addMouseOver(img, "This item's value according to rolimons.com")
                                        }
                                        if (valueProvider == "rblx.trade") {
                                            addMouseOver(img, "This item's value according to rblx.trade")
                                        }


                                    } else {
                                        cost.style.fontSize = "15px";
                                        cost.parentElement.style.height = '300%'
                                        displayvalue = String(value).commafy()

                                        if (valueProvider == "rolimons.com") {
                                            if (cost.getElementsByTagName("img")[0] == undefined) {
                                                cost.innerHTML += (`<img src="${icons["rolimons"]}" style="height: 19px; width: 19px;margin-left:8px;margin-right:5px;margin-top:-4px;">` + displayvalue)
                                                let img = cost.getElementsByTagName("img")[0]
                                                addMouseOver(img, "This item's value according to rolimons.com")
                                            }
                                        }
                                        if (cost.getElementsByTagName("img")[0] == undefined) {
                                            if (valueProvider == "rblx.trade") {
                                                cost.innerHTML += (`<img src="${icons["rblx.trade"]}" style="height: 19px; width: 19px;margin-left:8px;margin-right:5px;margin-top:-4px;">` + displayvalue)
                                                let img = cost.getElementsByTagName("img")[0]
                                                addMouseOver(img, "This item's value according to rblx.trade")
                                            }
                                        }
                                    }
                                }
                                if (sendmode == false) {

                                    if (isDescendant(parent1.parentElement, cost) == true) {
                                        total_value1 += Number(value)
                                    }
                                    if (isDescendant(parent2.parentElement, cost) == true) {
                                        total_value2 += Number(value)
                                    };
                                } else {

                                    if (isDescendant(sendparent1, cost) == true) {
                                        total_value1 += Number(value)
                                    }
                                    if (isDescendant(sendparent2, cost) == true) {
                                        total_value2 += Number(value)
                                    }
                                }
                            })(i, cost);
                        } catch (err) {
                            console.log(err)
                        }

                    }
                }
            }
        };

        //clear last item from false projection glitch
        if (names != undefined && names.parentElement != undefined && names.parentElement.parentElement != undefined && names.parentElement.parentElement.parentElement != undefined && sendnames != undefined) {
            let i = names.length - 1 - sendnames.length

            if (names[i].parentElement.parentElement.parentElement != null) {

                if (names[i].className == "text-lead item-name") { //if element is counter added item element
                    var element = names[i].getElementsByClassName("ng-binding")[0]
                } else { //if element is normal element
                    var element = names[i].parentElement.parentElement
                    var box = names[i].parentElement.parentElement.parentElement.parentElement.getElementsByClassName("item-card-link")[0]
                }

                var href = element.getAttribute("href");
                href = href.substring(0, href.lastIndexOf("/"))
                var id = href.match(/\d/g);
                id = id.join("");
                let item = item_data[id]
                let projected = item[7]

                if (projected == -1 && box != undefined) {

                    let element = box.getElementsByClassName("projected")[0]
                    if (element != undefined) {

                        element.remove()
                    }
                }

            }
        }
        if (await getFromStorageLocal("Trade Values") == true) {
            //set the total values
            if (sendmode == false) { //if we are in normal page

                if (Array.from(document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")).length >= 4) {
                    total1 = document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")[2]
                    total2 = document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")[3]
                }

                total1.parentElement.style.height = '300%'
                total2.parentElement.style.height = '300%'
                if (total1.innerHTML.indexOf('<') != -1) {
                    string = total1.innerHTML
                    string = string.substring(0, (string.indexOf('<')));
                    total1.innerHTML = string
                }
                if (total2.innerHTML.indexOf('<') != -1) {
                    string = total2.innerHTML
                    string = string.substring(0, (string.indexOf('<')));
                    total2.innerHTML = string
                }

                if (total1.innerHTML.indexOf("<br>") == -1) {
                    total1.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(total_value1 + parseInt(robuxadded1.innerHTML.replace(/,/g, ""))).commafy() + "<br/>")
                    var img = document.createElement("img");
                    if (valueProvider == "rolimons.com") {
                        img.src = icons["rolimons"]
                    }
                    if (valueProvider == "rblx.trade") {
                        img.src = icons["rblx.trade"]
                    }

                    img.style.position = 'absolute'
                    img.style.height = '20px'
                    img.style.width = '20px'
                    img.style.marginTop = "-22px";
                    total1.appendChild(img);
                }
                if (total2.innerHTML.indexOf("<br>") == -1) {
                    total2.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(total_value2 + parseInt(robuxadded2.innerHTML.replace(/,/g, ""))).commafy() + "<br/>")

                    var img = document.createElement("img");

                    if (valueProvider == "rolimons.com") {
                        img.src = icons["rolimons"]
                    }
                    if (valueProvider == "rblx.trade") {
                        img.src = icons["rblx.trade"]
                    }
                    img.style.position = 'absolute'
                    img.style.height = '20px'
                    img.style.width = '20px'
                    img.style.marginTop = "-22px";
                    total2.appendChild(img);
                }

            } else { //if we are in counter or send trade mode
                if (total_value1 == 0) { //recount
                    let newparent1 = document.getElementsByClassName("trade-request-window-offer")[0]

                    let newsendnames = Array.from(document.getElementsByClassName("text-lead item-name"));

                    for (let i = 0; i < newsendnames.length; i++) {
                        var cost = newsendnames[i].parentElement.parentElement.parentElement.getElementsByClassName("text-overflow item-card-price")[0]

                        if (cost == null) {
                            cost = newsendnames[i].parentElement.parentElement.getElementsByClassName("item-value ng-scope")[0]
                        }

                        if (newsendnames[i].className == "text-lead item-name") { //if element is counter added item element
                            var element = newsendnames[i].getElementsByClassName("ng-binding")[0]
                        } else { //if element is normal element
                            var element = newsendnames[i].parentElement.parentElement

                        }

                        var href = element.getAttribute("href");
                        href = href.substring(0, href.lastIndexOf("/"))
                        var id = href.match(/\d/g);
                        id = id.join("");
                        let item = item_data[id]
                        let value = item[3]
                        let RAP = item[2]
                        if (value == -1) {
                            value = RAP
                        }
                        if (isDescendant(newparent1, cost) == true) {
                            total_value1 += Number(value)

                        }

                    }
                }

                if (total_value2 == 0) { //recount
                    let newparent2 = document.getElementsByClassName("trade-request-window-offer")[1]

                    let newsendnames = Array.from(document.getElementsByClassName("text-lead item-name"));

                    for (let i = 0; i < newsendnames.length; i++) {
                        var cost = newsendnames[i].parentElement.parentElement.parentElement.getElementsByClassName("text-overflow item-card-price")[0]

                        if (cost == null) {
                            cost = newsendnames[i].parentElement.parentElement.getElementsByClassName("item-value ng-scope")[0]
                        }

                        if (newsendnames[i].className == "text-lead item-name") { //if element is counter added item element
                            var element = newsendnames[i].getElementsByClassName("ng-binding")[0]
                        } else { //if element is normal element
                            var element = newsendnames[i].parentElement.parentElement

                        }

                        var href = element.getAttribute("href");
                        href = href.substring(0, href.lastIndexOf("/"))
                        var id = href.match(/\d/g);
                        id = id.join("");
                        let item = item_data[id]
                        let value = item[3]
                        let RAP = item[2]
                        if (value == -1) {
                            value = RAP
                        }
                        if (isDescendant(newparent2, cost) == true) {
                            total_value2 += Number(value)
                        }
                    }
                }

                let newsendnames = document.getElementsByClassName("text-lead item-name")
                if (newsendnames.length != 0) { //there are more than 0 left
                    if (total1.innerHTML.indexOf("<") == -1) {
                        total1.parentElement.style.height = '300%'
                        total2.parentElement.style.height = '300%'
                        total1.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(total_value1 + parseInt(sendrobuxadded1.innerHTML.replace(/,/g, ""))).commafy() + "<br/>")

                        var img = document.createElement("img");
                        if (valueProvider == "rolimons.com") {
                            img.src = icons["rolimons"]
                        }
                        if (valueProvider == "rblx.trade") {
                            img.src = icons["rblx.trade"]
                        }

                        img.style.position = 'absolute'
                        img.style.height = '20px'
                        img.style.width = '20px'
                        img.style.marginTop = "-22px";
                        total1.appendChild(img);
                    }
                    if (total2.innerHTML.indexOf("<") == -1) {

                        total2.innerHTML += ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(total_value2 + parseInt(sendrobuxadded2.innerHTML.replace(/,/g, ""))).commafy() + "<br/>")
                        var img = document.createElement("img");
                        if (valueProvider == "rolimons.com") {
                            img.src = icons["rolimons"]
                        }
                        if (valueProvider == "rblx.trade") {
                            img.src = icons["rblx.trade"]
                        }
                        img.style.position = 'absolute'
                        img.style.height = '20px'
                        img.style.width = '20px'
                        img.style.marginTop = "-22px";
                        total2.appendChild(img);
                    }


                } else { //there are 0 left
                    if (total1.innerHTML.indexOf("<") == -1) {
                        total1.parentElement.style.height = '300%'
                        total2.parentElement.style.height = '300%'
                        total1.innerHTML = "0" + ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(total_value1 + parseInt(sendrobuxadded1.innerHTML.replace(/,/g, ""))).commafy() + "<br/>")

                        var img = document.createElement("img");
                        if (valueProvider == "rolimons.com") {
                            img.src = icons["rolimons"]
                        }
                        if (valueProvider == "rblx.trade") {
                            img.src = icons["rblx.trade"]
                        }

                        img.style.position = 'absolute'
                        img.style.height = '20px'
                        img.style.width = '20px'
                        img.style.marginTop = "-22px";
                        total1.appendChild(img);
                    }
                    if (total2.innerHTML.indexOf("<") == -1) {

                        total2.innerHTML = "0" + ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(total_value2 + parseInt(sendrobuxadded2.innerHTML.replace(/,/g, ""))).commafy() + "<br/>")
                        var img = document.createElement("img");
                        if (valueProvider == "rolimons.com") {
                            img.src = icons["rolimons"]
                        }
                        if (valueProvider == "rblx.trade") {
                            img.src = icons["rblx.trade"]
                        }

                        img.style.position = 'absolute'
                        img.style.height = '20px'
                        img.style.width = '20px'
                        img.style.marginTop = "-22px";
                        total2.appendChild(img);
                    }
                }
                for (i = 0; i < costdivs.length; i++) {
                    costdivs[i].style.width = "150%";
                    costdivs[i].style.position = "absolute";
                    costdivs[i].style.left = "-5px";
                }
            };
        }
        if (sendmode == false) {
            if (await getFromStorageLocal("Total Win/Loss") == true) {
                let tradebuttons = document.getElementsByClassName("trade-buttons")[0]
                if (tradebuttons) {
                    tradebuttons.querySelectorAll('.totalWin').forEach(e => e.remove());
                    let totalWin = document.createElement("p")

                    totalWin.className = "totalWin"
                    totalWin.style.fontFamily = "HCo Gotham SSm,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif"
                    totalWin.style.fontWeight = "bold"
                    totalWin.style.fontSize = "20px"
                    totalWin.style.lineHeight = "1.8"
                    totalWin.style.position = "relative"
                    totalWin.style.display = "inline-block"
                    let amount = (total_value2 + parseInt(robuxadded2.innerHTML.replace(/,/g, ""))) - (total_value1 + parseInt(robuxadded1.innerHTML.replace(/,/g, "")))
                    if (amount == 0) {
                        amount = "="
                    } else {
                        amount = String(amount).commafy()
                        if (amount.search("-") == -1) {
                            amount = "+" + amount
                        }
                    }
                    totalWin.innerHTML = amount
                    let colorElement = document.getElementsByClassName("paired-name ng-binding")[0]
                    let style = getComputedStyle(colorElement);
                    let color = style.color
                    totalWin.style.color = String(color)
                    totalWin.style.zIndex = 1001

                    if ((total_value2 + parseInt(robuxadded2.innerHTML.replace(/,/g, ""))) - (total_value1 + parseInt(robuxadded1.innerHTML.replace(/,/g, ""))) > 0) {
                        totalWin.style.color = "green"
                    }
                    if ((total_value2 + parseInt(robuxadded2.innerHTML.replace(/,/g, ""))) - (total_value1 + parseInt(robuxadded1.innerHTML.replace(/,/g, ""))) < 0) {
                        totalWin.style.color = "red"
                    }

                    tradebuttons.appendChild(totalWin)
                    addMouseOver(totalWin, iconMouseOverText[totalWin.className])
                }
            }
        }
    }
}


//must be used if in counter/send trade mode and dealing with item adding elements
function update(request_response) {
    var costs = document.getElementsByClassName("text-robux ng-binding");
    var names = Array.from(document.getElementsByClassName("item-card-name ng-binding"));
    var sendnames = Array.from(document.getElementsByClassName("text-lead item-name"));
    var sendrobuxadded1 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[0]
    var sendrobuxadded2 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[1]

    //remove values
    for (i = 0; i < names.length; i++) {

        var cost = names[i].parentElement.parentElement.parentElement.getElementsByClassName("text-overflow item-card-price")[0]
        if (cost == null) {
            cost = names[i].parentElement.parentElement.getElementsByClassName("item-value ng-scope")[0]
        }
        cost = cost.getElementsByClassName("text-robux ng-binding")[0]


        string = cost.innerHTML
        if (string.indexOf('<img') != -1) {
            string = string.substring(0, string.indexOf('<img'));
            cost.innerHTML = string
        }
        string = cost.innerHTML

        var index = string.indexOf('>')
        if (index == -1) {
            index = string.indexOf('<img')
        }
        if (index != -1) {
            string = string.substring(0, (string.indexOf('>')));
            cost.innerHTML = string
        }
    };

    //remove values from totals
    var total1 = document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")[0]
    if (total1 == undefined) {
        return
    }
    var total2 = document.getElementsByClassName("text-robux-lg robux-line-value ng-binding")[1]
    string = total1.innerHTML
    string = string.substring(0, (string.indexOf('<')));
    total1.innerHTML = string
    string = total2.innerHTML
    string = string.substring(0, (string.indexOf('<')));
    total2.innerHTML = string
    update_func(window.values)
    let sendparent1 = document.getElementsByClassName("trade-request-window-offer")[0]
    let sendparent2 = document.getElementsByClassName("trade-request-window-offer")[1]
    var newdetectors = Array.from(document.getElementsByClassName("paired-name ng-binding"))
    if (newdetectors.length == 3) {
        var sendmode = true
        names = names.concat(sendnames);

    } else {
        var sendmode = false
    }
    if (sendmode == true) {
        var total_rap_1 = 0
        var total_rap_2 = 0

        for (i = 0; i < names.length; i++) {

            let cost = names[i].parentElement.parentElement.parentElement.getElementsByClassName("text-overflow item-card-price")[0]
            if (cost == null) {
                cost = names[i].parentElement.parentElement.getElementsByClassName("item-value ng-scope")[0]
            }

            cost = cost.getElementsByClassName("text-robux ng-binding")[0]

            if (isDescendant(sendparent1, cost) == true) {

                let string = cost.innerHTML.replace(/,/g, "")

                if (string.indexOf('<img') != -1) {

                    string = string.substring(0, (string.indexOf('<')));

                    total_rap_1 += Number(string)
                } else {
                    string = string

                    total_rap_1 += Number(string)
                }

            }
            if (isDescendant(sendparent2, cost) == true) {
                let string = cost.innerHTML.replace(/,/g, "")
                if (string.indexOf('<img') != -1) {
                    string = string.substring(0, (string.indexOf('<')));
                    total_rap_2 += Number(string)
                } else {
                    string = string

                    total_rap_2 += Number(string)
                }
            }
        }

        if (sendmode == true) {
            var sendrobuxadded1 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[0]
            var sendrobuxadded2 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[1]
            total_rap_1 += parseInt(sendrobuxadded1.innerHTML.replace(/,/g, ""))
            total_rap_2 += parseInt(sendrobuxadded2.innerHTML.replace(/,/g, ""))


        } else {
            var robuxadded1 = document.getElementsByClassName("text-label robux-line-value ng-binding")[0]
            var robuxadded2 = document.getElementsByClassName("text-label robux-line-value ng-binding")[1]
            total_rap_1 += parseInt(robuxadded1.innerHTML.replace(/,/g, ""))
            total_rap_2 += parseInt(robuxadded2.innerHTML.replace(/,/g, ""))
        }


        total_rap_1 = String(total_rap_1).commafy() //set the rap here, and set the value in update_func
        total1.innerHTML = total_rap_1 //+ ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(Number(string.replace(",", "")) + Number(sendrobuxadded1.innerHTML.replace(",", ""))).commafy() + "<br/>")

        total_rap_2 = String(total_rap_2).commafy() //set the rap here, and set the value in update_func
        total2.innerHTML = total_rap_2 //+ ("<br>" + "&nbsp&nbsp&nbsp&nbsp" + String(Number(string.replace(",", "")) + Number(sendrobuxadded2.innerHTML.replace(",", ""))).commafy() + "<br/>")


    };

};
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) { //listens for requests from background page
    if (request.command == "refreshHide") {
        sendResponse();
        handleHiding(request.type)
    }

    if (request.command == "tradeAdded") {
        sendResponse();
        sideValues()
    }

    if (request.type == 'test') { //test to see if already injected
        sendResponse(true);
        throw "Already started ITV, continuing..."
        return
    };

    let pageURL = document.URL
    if (request.type == "requestData") { //asking page to make a request( needed to we can have credentials )

        let url = request.data[0]

        data = await sendGETRequest(url)
        chrome.runtime.sendMessage({
            data: [data, request.data[1]]
        })
        return true;

    }
    if (request.type == 'activate') { //enabling
        var request_response = request.data
        window.request_response = request_response

        window.values = request_response[0]
        window.brackets = sort_object(request_response[1])
        if (pageURL.indexOf("/users") != -1 && pageURL.indexOf("/profile") != -1 && document.getElementsByClassName("value-data")[0] == undefined) {
            //display value on user page
            let inventory = []

            let thisUserId = pageURL.substring(pageURL.indexOf("/users") + 7, pageURL.indexOf("/profile"))

            let appendelement = document.getElementsByClassName("details-info")[0]
            let hrefurl = "https://www.rolimons.com/player/" + thisUserId

            let thisdata = await sendGETRequest("https://inventory.roblox.com/v1/users/" + thisUserId + "/can-view-inventory")
            if (thisdata.canView == true) {
                thisdata = await sendGETRequest("https://inventory.roblox.com/v1/users/" + thisUserId + "/assets/collectibles?sortOrder=Asc&limit=100")
                inventory = inventory.concat(thisdata.data);
                while (true) {
                    if (thisdata.nextPageCursor != null) {
                        thisdata = await sendGETRequest("https://inventory.roblox.com/v1/users/" + thisUserId + "/assets/collectibles?sortOrder=Asc&limit=100&cursor=" + thisdata.nextPageCursor)
                        inventory = inventory.concat(thisdata.data);
                    } else {
                        break
                    }
                }
                let value = 0
                let rap = 0
                let valueitems = window.values.items
                for (var i = 0; i < inventory.length; i++) {
                    let thisvalue = valueitems[inventory[i].assetId][4]
                    let thisrap = valueitems[inventory[i].assetId][2]
                    value += thisvalue
                    rap += thisrap
                }
                let icon = null
                if (await getFromStorageLocal("Value Provider") == "rolimons.com") {
                    icon = icons["rolimons"]
                }
                if (await getFromStorageLocal("Value Provider") == "rblx.trade") {
                    icon = icons["rblx.trade"]
                }

                let appendelement = document.getElementsByClassName("details-info")[0]
                if (await getFromStorageLocal("User Profile RAP") == true && document.getElementsByClassName("rap-data")[0] == undefined) {
                    let hrefurl = "https://www.rolimons.com/player/" + thisUserId
                    let thishtmlrap = `<li class="to-be-removed-placeholder-rap"><div class="text-label font-caption-header">RAP</div><a userid="1429560605" target="_blank" class="value-data" href="' + hrefurl + '"><span class="font-header-2">' + "..." + '</span></a></li>`
                    appendelement.insertAdjacentHTML('beforeend', thishtmlrap);
                    thishtml = '<li><div class="text-label font-caption-header">Rap</div><a userid="1429560605" target="_blank" class="rap-data" href="' + hrefurl + '"><span class="font-header-2">' + String(rap).commafy() + '</span></a></li>'
                    appendelement.insertAdjacentHTML('beforeend', thishtml);
                    document.getElementsByClassName("to-be-removed-placeholder-rap")[0].remove()
                }
                if (await getFromStorageLocal("User Profile Value") == true && document.getElementsByClassName("value-data")[0] == undefined) {
                    let thishtmlvalue = `<img src="${icon}" style="height: 25px; width: 25px;margin-top:-3px;margin-right:5px;"><li class="to-be-removed-placeholder-value"><div class="text-label font-caption-header">Value</div><a userid="1429560605" target="_blank" class="value-data" href="' + hrefurl + '"><span class="font-header-2">' + "..." + '</span></a></li>`
                    appendelement.insertAdjacentHTML('beforeend', thishtmlvalue);
                    thishtml = '<li><div class="text-label font-caption-header">Value</div><a userid="1429560605" target="_blank" class="value-data" href="' + hrefurl + '"><span class="font-header-2">' + String(value).commafy() + '</span></a></li>'
                    appendelement.insertAdjacentHTML('beforeend', thishtml);
                    document.getElementsByClassName("to-be-removed-placeholder-value")[0].remove()
                }
                if (await getFromStorageLocal("User Profile Value") == true && await getFromStorageLocal("User Profile RAP") == true && document.getElementsByClassName("details-actions desktop-action")[0]) {
                    document.getElementsByClassName("details-actions desktop-action")[0].style.margin = "-30px"
                }
                return
            }

        }
        if (document.URL.indexOf("/trades") != -1) {

            let changables = Array.from(document.getElementsByClassName("item-cards-stackable"))

            for (var i = 0; i < changables.length; i++) {
                //changables[i].style.overflow = "visible"

            }
            update_func(window.values)
            var returnbutton = null
            var mySpans = document.getElementsByTagName("span");
            for (var i = 0; i < mySpans.length; i++) {
                if (mySpans[i].innerHTML == 'Back to Trades List') {
                    returnbutton = mySpans[i]
                    break;
                }
            }
            if (returnbutton != null) {
                //returnbutton.setAttribute("onclick", "window.location.href='https://www.roblox.com/trades'");
            }

            let header = document.getElementsByClassName("trades-header")[0]
            if (header != undefined && document.getElementById("valueProvider") == undefined && await getFromStorageLocal('Current Value Provider Display') == true) {
                var h = document.createElement("h3");
                h.id = "valueProvider"
                var t = `<img src="${icons["primary-with-arrow"]}" style="height: 25px; width: 25px;margin-top:-3px;margin-right:5px;">Current Value Provider: ${"&nbsp".repeat(4) + request_response[2]}`
                h.innerHTML = t
                header.getElementsByTagName("h1")[0].parentElement.insertBefore(h, header.getElementsByTagName("h1")[0].nextSibling);
            }
            sendResponse(true);
        }
        if (request.type == 'update') { //run if already enabled, but need to update values

            window.request_response = request.data
            window.values = request.data

            var sendnames = Array.from(document.getElementsByClassName("text-lead item-name"));
            for (i = 0; i < sendnames.length; i++) {
                var cost = sendnames[i].parentElement.parentElement.parentElement.getElementsByClassName("text-overflow item-card-price")[0]
                if (cost == null) {
                    cost = sendnames[i].parentElement.parentElement.getElementsByClassName("item-value ng-scope")[0]
                }
                cost = cost.getElementsByClassName("text-robux ng-binding")[0]

                string = cost.innerHTML
                if (string.indexOf('|') != -1) {
                    string = string.substring(0, string.indexOf('|'));
                    cost.innerHTML = string

                }
            }

            update(window.values)

            sendResponse()
        }
    }

});

var debounce = true


function nodeRemovedCallback(event) { //page changes handler
    var className = event.relatedNode.className
    if (className == "col-xs-12") {
        //remove Total Win/Loss
        totalWin = document.getElementsByClassName("totalWin")[0]
        if (totalWin != null) {
            totalWin.remove()
        }
    }
    if (className == "item-card-caption") {

        var newdetectors = Array.from(document.getElementsByClassName("paired-name ng-binding"))

        if (newdetectors.length == 3) {

            var sendmode = true
        } else {
            var sendmode = false
        }
        if (sendmode == true) {

            update(window.values)

        }

    }
}

let foundRobuxElements = false

let modeSelectorConnected = false

function nodeInsertedCallback(event) { //page changes handler
    var className = event.relatedNode.className
    if ((className == "hlist item-cards item-cards-stackable" || className == "trade-request-item ng-scope") && debounce == true) {
        debounce = false
        //viewing new trade, refresh
        setTimeout(function () {
            debounce = true
        }, 1);
        setTimeout(function () {

            if (className == "hlist item-cards item-cards-stackable" || className == "trade-request-item ng-scope") {

                var sendparent1 = document.getElementsByClassName("trade-request-window-offer ng-scope")[0]
                var sendparent2 = document.getElementsByClassName("trade-request-window-offer ng-scope")[1]
                var newdetectors = Array.from(document.getElementsByClassName("paired-name ng-binding"))

                if (newdetectors.length == 3) {

                    var sendmode = true
                } else {
                    var sendmode = false
                }
                if (sendmode == true) {

                    update_func(window.values)
                } else {
                    update_func(window.values)
                }

            }
            if (className == "trade-request-item ng-scope") {
                update(window.values)
            }
        }, 100);
    };
};

document.addEventListener('DOMNodeInserted', nodeInsertedCallback);
document.addEventListener('DOMNodeRemoved', nodeRemovedCallback);

if (document.readyState != "complete") {
    document.addEventListener('readystatechange', function (evt) {
        if (document.readyState == "complete") {
            setTimeout(function () {
                update_func(window.values)
            }, 500)
        }
    })
} else {
    setTimeout(function () {
        update_func(window.values)
    }, 500)
}
//detect when robux is added in send mode, and update

let numrobuxadded1 = 0
let numrobuxadded2 = 0
let numTradesLoaded = 0

function check_trades_for_not_side_values() {
    let elements = document.getElementsByClassName("trade-row-container")
    for (var i = 0; i < elements.length; i++) {
        let sideValueBox = elements[i].getElementsByClassName("sideValueBox")[0]
        if (sideValueBox == null) {
            return false
        }
    }
    return true
}

function tabInboundEvent() {
    resetLoadTrades()
}
async function run() {

    //decline
    var declineElements = document.querySelectorAll('[ng-click="declineTrade(data.trade)"]');
    for (var i = 0, len = declineElements.length; i < len; i++) {

        declineElements[i].onclick = function () {
            let declineButton = document.getElementById("modal-action-button")
            declineButton.onclick = function () {
                tradeDeclined()
            }
        }
    }
    //accept
    declineElements = document.querySelectorAll('[ng-click="acceptTrade(data.trade)"]');
    for (var i = 0, len = declineElements.length; i < len; i++) {

        declineElements[i].onclick = function () {
            let declineButton = document.getElementById("modal-action-button")
            declineButton.onclick = function () {
                tradeDeclined()
            }
        }
    }

    //counter
    if (document.URL.indexOf("/trades") != -1) {
        declineElements = document.querySelectorAll('[ng-click="sendTrade()"]');
        for (var i = 0, len = declineElements.length; i < len; i++) {

            declineElements[i].onclick = function () {
                let declineButton = document.getElementById("modal-action-button")
                declineButton.onclick = function () {
                    tradeDeclined()
                }
            }
        }
    }

    let selectedRow = document.getElementsByClassName("trade-row ng-scope selected")[0]
    if (selectedRow != null) {
        let tradeIdElement = selectedRow.getElementsByClassName("trade-row-container")[0]
        if (tradeIdElement != null) {
            selectedId = tradeIdElement.getAttribute("itvtradeid")
        }
    }

    tabInbound = document.getElementById("tab-Inbound")
    if (tabInbound != null) {
        tabInbound.onclick = tabInboundEvent
    }

    let counterButtons = document.getElementsByClassName("text-link cursor-pointer")
    for (var i = 0; i < counterButtons.length; i++) {
        counterButtons[i].onclick = tabInboundEvent
    }
    var newdetectors = Array.from(document.getElementsByClassName("paired-name ng-binding"))
    let sendmode = false
    if (newdetectors.length == 3) {
        sendmode = true //detects whether we are in counter/send trade mode, or not
    }
    if (sendmode == false) {
        sideValues()
    }
    if (sendmode == true) {
        var sendrobuxadded1 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[0]
        var sendrobuxadded2 = document.getElementsByClassName("text-secondary robux-line-value ng-binding")[1]
        if (sendrobuxadded1 != undefined && sendrobuxadded2 != undefined) {
            let A = parseInt(sendrobuxadded1.innerHTML.replace(/,/g, ""))
            let B = parseInt(sendrobuxadded2.innerHTML.replace(/,/g, ""))
            if (numrobuxadded1 != A || numrobuxadded2 != B) {
                update(window.values)
                numrobuxadded1 = A
                numrobuxadded2 = B
            }
        }
    }
    setTimeout(() => {
        run();
    }, 1000)
}
run();