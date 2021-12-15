/*
In-Tab Values was developed in full by:
  _  __  ____        _ 
 | |/ / |  _ \      | |
 | ' /  | | | |  _  | |
 | . \  | |_| | | |_| |
 |_|\_\ |____/   \___/ 

Contacts:
    Email - kdjstuffs@gmail.com
    Discord - KDJ#7137
    Roblox Developer Forums - https://devforum.roblox.com/u/excessenergy/summary
In-Tab Values Privacy Policy:
    https://github.com/KDJDEV/ITV-Privacy-Policy/blob/main/In-Tab-Values%20Privacy%20Policy.md
*/

async function getGlobalData() {
    return await fetch(chrome.runtime.getURL("data.json")).then(response => response.json());
}

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { command: "test" }, function(response) {
        if (response != true) {
            window.close() //close window is not on roblox.com( there won't be injected content scripts )
        }
    })
})

function getTextColor(darkMode) {
    if (darkMode) {
        return "#FFFFFF"
    } else {
        return "#393B3D"
    }
}

function getBackgroundColor(darkMode) {
    if (darkMode) {
        return "#232527"
    } else {
        return "#F2F4F5"
    }
}

function getSecondaryBackgroundColor(darkMode) {
    if (darkMode) {
        return "#191B1D"
    } else {
        return "#DEE1E3"
    }
}

function getBorderColor(darkMode) {
    if (darkMode) {
        return "#111214"
    } else {
        return "#C8CCCF"
    }
}

let isDarkMode = new Promise(function(myResolve, myReject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "getColorMode" }, function(darkMode) {
            myResolve(darkMode);
        });
    });
});

const icons = {
    "rolimons": chrome.runtime.getURL("icons/rolimons.png"),
    "rolimons-specific": chrome.runtime.getURL("icons/rolimons-specific.png"),
    "rblx.trade": chrome.runtime.getURL("icons/rblx.trade.png"),
    "rblx.trade-specific": chrome.runtime.getURL("icons/rblx.trade-specific.png"),
    "raren": chrome.runtime.getURL("icons/raren.png"),
    "primary": chrome.runtime.getURL("icons/primary.png"),
    "primary-with-arrow": chrome.runtime.getURL("icons/primary-with-arrow.png"),
    "transparent-logo-with-sub-text": chrome.runtime.getURL("icons/transparent-logo-with-sub-text.png"),
    "transparent-logo-with-settings-sub-text": chrome.runtime.getURL("icons/settings.png"),
    "discord": chrome.runtime.getURL("icons/discord.png"),
    "alert": chrome.runtime.getURL("icons/projected.png")
}

function getProfileImage() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { command: "getProfileImageAndName" }, function(data) {
                resolve(data)
            });
        })
    })
}

async function playSound() {
    if (await getFromStorageLocal("Activation noise") == true) {
        let url = chrome.runtime.getURL("audio/click.mp3")
        var audio = new Audio(url);
        audio.volume = 0.3;
        audio.play();
    }
}

async function handleImages() {
    let icons = Array.from(document.getElementsByClassName("icons_ITV"))

    icons.forEach(function(img) {
        img.src = icons["primary"]
    })

    icons = Array.from(document.getElementsByClassName("icons_alert"))

    icons.forEach(function(img) {
        img.src = chrome.runtime.getURL("icons/projected.png")
    })

    let data = await getProfileImage()
    let profileUrl = data.url
    let profileName = data.name

    icons = Array.from(document.getElementsByClassName("profile-image"))

    icons.forEach(function(img) {
        img.src = profileUrl
    })

    icons = Array.from(document.getElementsByClassName("profile-name"))

    icons.forEach(function(img) {
        img.innerHTML = profileName
    })

}

async function CheckSubscription() {
    let result = new Promise(async function(resolve, reject) {

        var VIPLink = 'https://www.roblox.com/private-server/instance-list-json?universeId=171035019&page=1'
        SubscriptionStatus = false

        var VIPXHR = new XMLHttpRequest()
        VIPXHR.open("GET", VIPLink, true);
        VIPXHR.onreadystatechange = function() {
            if (VIPXHR.readyState == 4) {
                var servers = (JSON.parse(VIPXHR.responseText)).Instances

                for (i = 0; i < servers.length; i++) {

                    if (servers[i].DoesBelongToUser && servers[i].PrivateServer.StatusType != 3) {
                        SubscriptionStatus = true

                        resolve(true)
                    }
                }
                resolve(false)
            }
        }
        await VIPXHR.send()
    })
    await result

    return result
}

async function getFromStorageLocal(name) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(name, async function(items) {
            let globalData = await getGlobalData()

            value = items[name]
            if (value == undefined) {
                for (let key in globalData) {
                    if (globalData.hasOwnProperty(key)) {
                        for (let thisKey in globalData[key]) {
                            if (thisKey == name) {
                                value = globalData[key][thisKey][1]
                                saveLocal(name, value)
                                resolve(value)
                            }
                            for (let thisThisKey in globalData[key][thisKey]) {
                                if (thisThisKey == name) {
                                    value = globalData[key][thisKey][thisThisKey][1]
                                    saveLocal(name, value)
                                    resolve(value)
                                }
                            }
                        }
                    }
                }

                if (name == "tradeCache") {
                    saveLocal(name, {})
                } else if (name == "New") {
                    saveLocal(true)
                }
            }
            resolve(value)
        });
    })
}

function saveLocal(name, value) {
    var items = {};
    items[name] = value
    chrome.storage.local.set(items, function() {
        console.log("saved");
    });
}

const buttonHTML = '<label class="switch"><input class="checkbox" type="checkbox"><span class="slider round"></span></label>'
const valueProviderDropdownHTML = '<select class="select" name="Value Provider" id="Value Provider"><option value="rolimons.com">rolimons.com</option><option value="rblx.trade">rblx.trade'

async function renderOptions(darkMode) {
    let globalData = await getGlobalData()

    for (let key in globalData) {
        if (globalData.hasOwnProperty(key)) {
            let h2 = document.createElement("h2")
            h2.innerHTML = key
            let ul = document.createElement("ul")
            for (let thisKey in globalData[key]) {
                if (!(typeof globalData[key][thisKey] === 'object' && globalData[key][thisKey] !== null && !Array.isArray(globalData[key][thisKey]))) {
                    async function listOption() {
                        let li = document.createElement("li")
                        if (globalData[key][thisKey][0] === 1) {
                            if (globalData[key][thisKey][3] != null) {
                                let infoHTML = `<img title="${globalData[key][thisKey][3]}" class="info" style="width:18px;height:18px;margin-left:20px;">`
                                li.innerHTML = thisKey + infoHTML + buttonHTML
                                li.getElementsByClassName("info")[0].src = chrome.runtime.getURL("icons/info.png")
                                if (darkMode == true) {
                                    li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(1)"
                                } else {
                                    li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(.2)"
                                }

                            } else {
                                li.innerHTML = thisKey + buttonHTML
                            }
                            let value = await getFromStorageLocal(thisKey)
                            console.log(value)
                            li.getElementsByClassName("checkbox")[0].checked = value
                            li.getElementsByClassName("checkbox")[0].addEventListener('click', async function() {
                                playSound()
                                saveLocal(thisKey, li.getElementsByClassName("checkbox")[0].checked)
                                if (await getFromStorageLocal("Refresh on Important Option Update") == true && globalData[key][thisKey][2]) {
                                    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                                        chrome.tabs.sendMessage(tabs[0].id, { command: "refresh" }, function(response) {})
                                    })
                                }
                            })

                        }
                        if (globalData[key][thisKey][0] === 2) {
                            if (globalData[key][thisKey][3] != null) {
                                let infoHTML = `<img title="${globalData[key][thisKey][3]}" class="info" style="width:18px;height:18px;margin-left:20px;">`
                                li.innerHTML = thisKey + infoHTML + valueProviderDropdownHTML
                                li.getElementsByClassName("info")[0].src = chrome.runtime.getURL("icons/info.png")
                                if (darkMode == true) {
                                    li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(1)"
                                } else {
                                    li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(.2)"
                                }

                            } else {
                                li.innerHTML = thisKey + buttonHTML
                            }

                            let value = await getFromStorageLocal(thisKey)
                            li.getElementsByClassName("select")[0].value = value
                            li.getElementsByClassName("select")[0].addEventListener('change', async function() {
                                playSound()
                                saveLocal(thisKey, li.getElementsByClassName("select")[0].value)
                                if (await getFromStorageLocal("Refresh on Important Option Update") == true && globalData[key][thisKey][2]) {
                                    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                                        chrome.tabs.sendMessage(tabs[0].id, { command: "refresh" }, function(response) {})
                                    })
                                }
                            })

                        }
                        ul.appendChild(li)
                    }
                    listOption()
                    document.getElementById("options-box").appendChild(h2)
                    document.getElementById("options-box").appendChild(ul)
                } else {
                    let h3 = document.createElement("h3")
                    h3.innerHTML = thisKey
                    let ul = document.createElement("ul")
                    for (let thisThisKey in globalData[key][thisKey]) {
                        async function listOption() {
                            let li = document.createElement("li")
                            if (globalData[key][thisKey][thisThisKey][0] === 1) {
                                if (globalData[key][thisKey][thisThisKey][3] != null) {
                                    let infoHTML = `<img title="${globalData[key][thisKey][thisThisKey][3]}" class="info" style="width:18px;height:18px;margin-left:20px;">`
                                    li.innerHTML = thisThisKey + infoHTML + buttonHTML
                                    li.getElementsByClassName("info")[0].src = chrome.runtime.getURL("icons/info.png")
                                    if (darkMode == true) {
                                        li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(1)"
                                    } else {
                                        li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(.2)"
                                    }

                                } else {
                                    li.innerHTML = thisThisKey + buttonHTML
                                }
                                let value = await getFromStorageLocal(thisThisKey)
                                li.getElementsByClassName("checkbox")[0].checked = value
                                li.getElementsByClassName("checkbox")[0].addEventListener('click', async function() {
                                    playSound()
                                    saveLocal(thisThisKey, li.getElementsByClassName("checkbox")[0].checked)
                                    if (await getFromStorageLocal("Refresh on Important Option Update") == true && globalData[key][thisKey][thisThisKey][2]) {
                                        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                                            chrome.tabs.sendMessage(tabs[0].id, { command: "refresh" }, function(response) {})
                                        })
                                    }
                                    if (thisThisKey.indexOf("Hide") != -1) {
                                        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                                            chrome.tabs.sendMessage(tabs[0].id, { command: "refreshHide", type:thisThisKey }, function(response) {})
                                        })
                                    }
                                })

                            }
                            if (globalData[key][thisKey][thisThisKey][0] === 2) {
                                if (globalData[key][thisKey][thisThisKey][3] != null) {
                                    let infoHTML = `<img title="${globalData[key][thisKey][thisThisKey][3]}" class="info" style="width:18px;height:18px;margin-left:20px;">`
                                    li.innerHTML = thisKey + infoHTML + valueProviderDropdownHTML
                                    li.getElementsByClassName("info")[0].src = chrome.runtime.getURL("icons/info.png")
                                    if (darkMode == true) {
                                        li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(1)"
                                    } else {
                                        li.getElementsByClassName("info")[0].style.webkitFilter = "brightness(.2)"
                                    }

                                } else {
                                    li.innerHTML = thisKey + buttonHTML
                                }

                                let value = await getFromStorageLocal(thisThisKey)
                                li.getElementsByClassName("select")[0].value = value
                                li.getElementsByClassName("select")[0].addEventListener('change', async function() {
                                    playSound()
                                    saveLocal(thisThisKey, li.getElementsByClassName("select")[0].value)
                                    if (await getFromStorageLocal("Refresh on Important Option Update") == true && globalData[key][thisKey][thisThisKey][2]) {
                                        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                                            chrome.tabs.sendMessage(tabs[0].id, { command: "refresh" }, function(response) {})
                                        })
                                    }
                                })

                            }
                            ul.appendChild(li)
                        }
                        listOption()
                    }

                    document.getElementById("options-box").appendChild(h3)
                    document.getElementById("options-box").appendChild(ul)
                }
            }
        }
    }
}
window.onload = async function() {
    SubscriptionStatus = await CheckSubscription()
    if (!SubscriptionStatus) {
        let html = '<div class="box-div" style="grid-column-start: 1;grid-column-end: 4;"><span class="icon-boxes"><img class="icons_alert" style="margin-bottom:-7px;height:28px;width:28px;" src=""></span><br></span> Your <b>In-Tab Values</b> subscription needs to be activated before ITV will function. <br> <span style="font-size:16px;">Please</span> <b style="font-size:16px;"><span class="text-link" target="_blank" style="cursor: pointer;">click here to purchase a subscription.</b></span></div>'
        document.body.getElementsByClassName("grid")[0].insertAdjacentHTML('afterbegin', html);
        document.body.getElementsByClassName('subscription-status')[0].innerHTML = "Subscription inactive"

        //Link buttons
        document.getElementsByClassName("text-link")[0].onclick = function() {
            chrome.runtime.sendMessage({ command: "purchaseSequence" }, function(response) {});
            window.close();
        }

        document.getElementById("options-box").classList.add("grayscale");
        let cover = document.createElement("div")
        cover.style.height = "100%"
        cover.style.width = "100%"
        cover.style.position = "absolute"
        cover.style.zIndex = "1000"

        document.getElementById("options-box").appendChild(cover)
    } else {
        document.body.getElementsByClassName('subscription-status')[0].innerHTML = "Subscription active"
        document.getElementsByClassName("cancel-text-link")[0].onclick = function() {
            chrome.runtime.sendMessage({ command: "cancelSequence" }, function(response) {});
            window.close();
        }
    }
    //Set colors to match light.dark mode
    isDarkMode.then(function(darkMode) {

        document.body.style.setProperty("background-color", getBackgroundColor(darkMode), "important");
        document.body.style.setProperty("color", getTextColor(darkMode), "important");
        document.getElementsByClassName("transparent-logo")[0].src = icons["transparent-logo-with-settings-sub-text"]

        if (darkMode == false) {
            document.getElementsByClassName("transparent-logo")[0].style.webkitFilter = "brightness(0.15)"
        }

        boxes = Array.from(document.getElementsByClassName("box-div"))
        boxes.forEach(function(box) {
            box.style.backgroundColor = getSecondaryBackgroundColor(darkMode)
            box.style.borderColor = getBorderColor(darkMode)
        })

        url = chrome.runtime.getURL("icons/discord.png");
        theseIcons = Array.from(document.getElementsByClassName("discord-box-img"))

        theseIcons.forEach(function(img) {
            img.src = url
        })

        url = chrome.runtime.getURL("icons/primary.png");
        theseIcons = Array.from(document.getElementsByClassName("icons_ITV"))

        theseIcons.forEach(function(img) {
            img.src = url
        })


        renderOptions(darkMode)
    })
    //Set all of the <img> tags to their proper .srv
    handleImages()

}