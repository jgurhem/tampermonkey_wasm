// ==UserScript==
// @name         Load Some WASM
// @namespace    http://tampermonkey.net/
// @version      0.0.9
// @description  Example to load WASM file and execute its functions from Tampermonkey user script
// @author       Jérôme Gurhem (https://github.com/jgurhem)
// @match        https://www.google.fr/**
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// @connect      github.com
// @connect      objects.githubusercontent.com
// ==/UserScript==

(async function () {
    const r = await GM.xmlHttpRequest({
        method: "GET",
        url: "https://github.com/jgurhem/tampermonkey_wasm/releases/download/0.0.9/tampermonky_wasm_bg.wasm",
        headers: {
            "Content-Type": "application/wasm"
        },
        responseType: "arraybuffer",
    }).catch(e => console.error(e));

    const module = await WebAssembly.compile(r.response);
    const instance = new WebAssembly.Instance(module, {});
    const add = instance.exports.add;
    console.log(add(1, 3));
})();