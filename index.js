// ==UserScript==
// @name         RustAddition
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  Example to load WASM file compiled from Rust and execute its functions in a GreasyFork/Tampermonkey user script
// @author       Jérôme Gurhem (https://github.com/jgurhem)
// @match        https://www.google.fr/**
// @grant        GM_xmlhttpRequest
// @connect      github.com
// @connect      objects.githubusercontent.com
// @require      https://github.com/jgurhem/tampermonkey_wasm/releases/download/0.1.2/tampermonky_wasm.js
// ==/UserScript==

(async function () {
    const r = await GM.xmlHttpRequest({
        method: "GET",
        url: "https://github.com/jgurhem/tampermonkey_wasm/releases/download/0.1.2/tampermonky_wasm_bg.wasm",
        headers: {
            "Content-Type": "application/wasm"
        },
        responseType: "arraybuffer",
    }).catch(e => console.error(e));

    // use wasm pack functions to load our WebAssembly
    const { add, Fraction } = wasm_bindgen;
    await wasm_bindgen(r.response);

    // call the add function
    console.log(add(1, 3));

    // Use of our Fraction class
    let f1 = Fraction.new(2, 3);
    console.log(f1.to_string());
    let f2 = Fraction.new(3, 4);
    console.log(f2.to_string());
    f1.add(f2);
    console.log(f1.to_string());
})();