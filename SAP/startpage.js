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

let url = chrome.runtime.getURL("icons/primary.png");
let icons = Array.from(document.getElementsByClassName("icons_ITV"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/underrap.svg");
icons = Array.from(document.getElementsByClassName("icons_under"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/overrap.svg")
icons = Array.from(document.getElementsByClassName("icons_over"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/rare.png")
icons = Array.from(document.getElementsByClassName("icons_rare"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/projected.png")
icons = Array.from(document.getElementsByClassName("icons_projected"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/proofbased.png")
icons = Array.from(document.getElementsByClassName("icons_proof"))

icons.forEach(function(img) {
	img.src = url
})

 let darkmode = false
    if (realBackgroundColor(document.body) == "rgb(35, 37, 39)") {
        darkmode = true
    }
    if (darkmode == true) {
        url = chrome.runtime.getURL("icons/CameraDark.svg")
		icons = Array.from(document.getElementsByClassName("icons_graph"))

		icons.forEach(function(img) {
			img.src = url
		})

		url = chrome.runtime.getURL("icons/RAPChartDark.svg")
		icons = Array.from(document.getElementsByClassName("icons_camera"))

		icons.forEach(function(img) {
			img.src = url
		})


    } else {
        url = chrome.runtime.getURL("icons/RAPChartLight.svg")
		icons = Array.from(document.getElementsByClassName("icons_graph"))

		icons.forEach(function(img) {
			img.src = url
		})

		url = chrome.runtime.getURL("icons/CameraLight.svg")
		icons = Array.from(document.getElementsByClassName("icons_camera"))

		icons.forEach(function(img) {
			img.src = url
		})
    }





url = chrome.runtime.getURL("icons/discord.png");
icons = Array.from(document.getElementsByClassName("discord-box-img"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/roblox.png");
icons = Array.from(document.getElementsByClassName("roblox-box-img"))

icons.forEach(function(img) {
	img.src = url
})

url = chrome.runtime.getURL("icons/web_store.png");
icons = Array.from(document.getElementsByClassName("web_store-img"))

icons.forEach(function(img) {
	img.src = url
})

//Set browser icon image
url = chrome.runtime.getURL("icons/primary.png");
document.getElementById("browser-itv-icon").href = url

