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

function darkMode() {
    if (realBackgroundColor(document.body) == "rgb(35, 37, 39)") {
        return true
    } else {
        return false
    }
}

function getMeta(metaName) {
    const metas = document.getElementsByTagName('meta');

    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute(metaName) != null) {
            return metas[i].getAttribute(metaName);
        }
    }

    return '';
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
    "alert": chrome.runtime.getURL("icons/projected.png")
}

async function addITVIcon(tabId) {

    while (!document.getElementsByClassName("nav navbar-right rbx-navbar-icon-group")[0]) {
        await new Promise(r => setTimeout(r, 500));
    }
    if (document.getElementsByClassName("itv-icon")[0] === undefined) {
        let box = document.getElementsByClassName("nav navbar-right rbx-navbar-icon-group")[0]
        if (box != null) {
            let li = document.createElement("li")
            li.style.marginLeft = "6px"
            li.className = "itv-icon"
            let a = document.createElement("a")
            a.href = chrome.runtime.getURL("options.html") + "?darkMode=" + darkMode() + "&currentTab=" + tabId
            a.target = "_blank"
            a.style.paddingTop = "0px"
            a.style.paddingLeft = "0px"
            a.style.paddingRight = "0px"
            a.style.paddingBottom = "0px"
            a.style.borderRadius = "50%"
            a.style.width = "30px"
            a.style.height = "30px"
            a.style.marginTop = "6px"

            let icon = document.createElement("img")
            icon.src = icons["primary-with-arrow"]
            icon.style.width = "30px"
            icon.style.borderRadius = "50%"
            li.appendChild(a)
            a.appendChild(icon)
            box.insertBefore(li, document.getElementById("navbar-settings"))

            $(icon).hover(function () {
                $(this).css("box-shadow", "0 0 0 2px WhiteSmoke");

            }, function () {
                $(this).css("box-shadow", "0 0 0 0px WhiteSmoke");

            });

        }
    }
}

async function CheckSubscription() {
    let result = new Promise(async function (resolve, reject) {

        var VIPLink = 'https://www.roblox.com/private-server/instance-list-json?universeId=171035019&page=1'
        SubscriptionStatus = false

        var VIPXHR = new XMLHttpRequest()
        VIPXHR.open("GET", VIPLink, true);
        VIPXHR.onreadystatechange = function () {
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.command == "test") {
        sendResponse(true);
    }
    if (request.command == "refresh") {
        setTimeout(function () {
            window.location.reload()
            sendResponse();
        }, 500)
    }

    if (request.command == "getColorMode") {
        sendResponse(darkMode());
    }
    if (request.command == "add_itv_icon") {
        addITVIcon(request.tabId)
    }
    if (request.command == "redirect") {
        sendResponse();
        window.location = request.url
    }
    if (request.command == "getProfileImageAndName") {
        let url = document.getElementsByClassName("thumbnail-2d-container avatar-card-image")[0].getElementsByTagName("img")[0].src
        let name = getMeta("data-name")
        sendResponse({ url, name });
    }

    if (request.command == "send_alert") {
        alert(request.alert)
    }

    if (request.command == "prompt_purchase") {
        async function prompt_purchase() {
            window.removeEventListener("load", prompt_purchase);
            let pageURL = document.URL
            if (pageURL.indexOf("roblox.com/games/447452406") != -1 && await CheckSubscription() === false) {
                if (document.getElementById("modal-dialog2") == undefined) {
                    let element = document.getElementsByClassName('rbx-private-server-create-button')[1]
                    element.click();

                    setTimeout(function () {
                        if (document.getElementById("modal-dialog2") == undefined) {
                            let url = chrome.runtime.getURL("server-purchase-popup.html");

                            $.get(url, function (data) {
                                if (document.getElementById("modal-dialog2") == undefined) {
                                    document.getElementById("modal-dialog").parentElement.insertAdjacentHTML("beforeend", data)
                                    let element = document.getElementById("modal-dialog2")
                                    element.style.backgroundColor = realBackgroundColor(document.getElementById("modal-dialog").getElementsByClassName("modal-header")[0])
                                    element.getElementsByClassName("transparent-logo")[0].src = icons["transparent-logo-with-sub-text"]
                                    element.getElementsByClassName("discord-box-img")[0].src = icons["discord"]
                                    if (darkMode() == false) {
                                        element.getElementsByClassName("transparent-logo")[0].style.webkitFilter = "brightness(0.15)"
                                    }
                                    setTimeout(function () {
                                        document.getElementById("modal-confirmation").getElementsByClassName('form-control input-field private-server-name')[0].value = "ITV";
                                    }, 500)

                                    let buyButton = document.getElementById('confirm-btn')
                                    buyButton.onclick = function () {
                                        setTimeout(function () {
                                            chrome.runtime.sendMessage({ command: "purchased" }, function (response) { });
                                            window.location.replace("https://www.roblox.com/trades")
                                        }, 1000)
                                    }
                                }

                            })
                        }
                    }, 500)
                }
            }
        }
        if (document.readyState === "complete") {
            prompt_purchase();
        } else {
            window.addEventListener("load", prompt_purchase);
        }
    }

    if (request.command == "thanks_for_purchasing") {
        function thanks_for_purchasing() {
            window.removeEventListener("load", thanks_for_purchasing);
            let url = chrome.runtime.getURL("thanks-for-purchase-popup.html");

            $.get(url, function (data) {
                let div = document.createElement("div")
                div.innerHTML = data
                document.body.appendChild(div)
                let element = document.getElementById("modal-dialog2")
                element.style.backgroundColor = realBackgroundColor(document.getElementById("modal-dialog").getElementsByClassName("modal-header")[0])
                element.getElementsByClassName("transparent-logo")[0].src = icons["transparent-logo-with-sub-text"]
                element.getElementsByClassName("discord-box-img")[0].src = icons["discord"]
                element.getElementsByClassName("icons_ITV")[0].src = icons["primary-with-arrow"]
                if (darkMode() == false) {
                    element.getElementsByClassName("transparent-logo")[0].style.webkitFilter = "brightness(0.15)"
                }

                element.getElementsByClassName("thanks-for-purchase-close-button")[0].onclick = function function_name() {
                    element.remove()
                }
            })

            sendResponse();
        }
        if (document.readyState === "complete") {
            thanks_for_purchasing();
        } else {
            window.addEventListener("load", thanks_for_purchasing);
        }
    }

    if (request.command == "cancel_subscription") {
        function cancel_subscription() {
            window.removeEventListener("load", cancel_subscription);
            let pageURL = document.URL
            if (pageURL.indexOf("roblox.com/games/447452406") != -1) {
                let url = chrome.runtime.getURL("cancel-subscription-popup.html");

                $.get(url, function (data) {
                    let div = document.createElement("div")
                    div.innerHTML = data
                    document.body.appendChild(div)
                    let element = document.getElementById("modal-dialog2")
                    element.style.backgroundColor = realBackgroundColor(document.getElementById("modal-dialog").getElementsByClassName("modal-header")[0])
                    element.getElementsByClassName("transparent-logo")[0].src = icons["transparent-logo-with-sub-text"]
                    element.getElementsByClassName("discord-box-img")[0].src = icons["discord"]
                    if (darkMode() == false) {
                        element.getElementsByClassName("transparent-logo")[0].style.webkitFilter = "brightness(0.15)"
                    }

                    element.getElementsByClassName("disable-close-button")[0].onclick = function function_name() {
                        element.remove()
                    }
                })

                sendResponse();
            }
        }
        if (document.readyState === "complete") {
            cancel_subscription();
        } else {
            window.addEventListener("load", cancel_subscription);
        }
    }

    if (request.command == "purchase_notification") {
        if (document.getElementById("account-security-prompt-container-itv") == null) {
            let html = '<div class="alert-container" style="top:40px; z-index:1000000000000000000;position:absolute;width:100%"><div id="account-security-prompt-container-itv"></div><div class="alert-info linkify" style="display: block;"><span><span class="icon-boxes"><img class="icons_alert" style="height:48px; width:48px; margin: 0;position: absolute;top: 50%;-ms-transform: translateY(-50%);transform: translateY(-50%);margin-left:-50px;" src=""></span>Your <b><span class="icon-boxes"><img class="icons_ITV" height="28px" width="28px" src=""></span> In-Tab Values</b> subscription needs to be activated before ITV will function. <br> Please <span class="text-link" target="_blank" style="cursor: pointer;">click here to purchase a subscription.</span><div style="opacity:0.6;margin-right:10px;display:inline-block;margin-left:45px;cursor:pointer;" class="alert-close"><b> Close Alert<b></b></b></div></span></div></div>'
            let element = document.getElementById("header")
            let div = document.createElement("div")
            div.innerHTML = html
            document.body.appendChild(div)

            element = document.getElementById("account-security-prompt-container-itv").parentElement
            element.getElementsByClassName("icons_ITV")[0].src = icons["primary-with-arrow"]
            element.getElementsByClassName("icons_alert")[0].src = icons["alert"]

            element.getElementsByClassName("alert-close")[0].onclick = function () {
                div.remove()
            }
            element.getElementsByClassName("text-link")[0].onclick = function () {
                chrome.runtime.sendMessage({ command: "purchaseSequence" }, function (response) { });
            }
        }
    }

});