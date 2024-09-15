use std::{ops::Add, fmt::Display};

use wasm_bindgen::prelude::*;

// source : https://github.com/rustwasm/wasm-bindgen/tree/main/examples/without-a-bundler

#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Fraction {
    num: u32,
    den: u32,
}

#[wasm_bindgen]
impl Fraction {
    pub fn new(num: u32, den: u32) -> Fraction {
        Fraction { num, den }
    }

    pub fn add(&mut self, other: Fraction) {
        self.num = self.num * other.den + other.num * self.den;
        self.den = other.den * self.den;
    }

    pub fn to_string(&self) -> String {
        format!("{}/{}", self.num, self.den)
    }
}

impl Display for Fraction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}/{}", self.num, self.den)
    }
}

impl Add for Fraction {
    type Output = Fraction;

    fn add(self, rhs: Self) -> Self::Output {
        Fraction{num: self.num * rhs.den + rhs.num * self.den, den: rhs.den * self.den}
    }
}
