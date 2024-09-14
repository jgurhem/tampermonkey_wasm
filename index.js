// ==UserScript==
// @name         RustAddition
// @namespace    http://tampermonkey.net/
// @version      0.0.11
// @description  Example to load WASM file compiled from Rust and execute its functions in a GreasyFork/Tampermonkey user script
// @author       Jérôme Gurhem (https://github.com/jgurhem)
// @match        https://www.google.fr/**
// @grant        GM_xmlhttpRequest
// @connect      github.com
// @connect      objects.githubusercontent.com
// ==/UserScript==

(async function () {
    const r = await GM.xmlHttpRequest({
        method: "GET",
        url: "https://github.com/jgurhem/tampermonkey_wasm/releases/download/0.0.11/tampermonky_wasm_bg.wasm",
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