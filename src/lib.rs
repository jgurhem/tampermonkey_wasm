use wasm_bindgen::prelude::*;

// source : https://github.com/rustwasm/wasm-bindgen/tree/main/examples/without-a-bundler

#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}