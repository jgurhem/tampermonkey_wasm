# Function in Rust to WASM to GreasyFork userscript

User scripts which can be added to the web brower to enhance its usage or the websites are usually written in Javascript.
What if we want high performances for the features added or use another programming language to implement them ?
Then we would like to build our code into an intermediate that fit our requirements and that can be used in our GreasyFork userscripts.

Well, WebAssembly was designed to solve such problems !
It is now possible to build an application into WebAssembly and load it from our userscript.

## Rust example to build into a WebAssembly

Let's take a small example, build it into a WebAssembly and load it from our userscript.
I choosed to implement the add function that adds 2 integers in Rust.

Let's create our Rust project.
If you are not familiar with Rust, you can take a look at ["The Book"](https://doc.rust-lang.org/stable/book/title-page.html) or the [documentation](https://www.rust-lang.org/learn).

```bash
cargo new --lib addition
```

Here is the simple code of our addition:

```rust
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}
```

This code should be added in `src/lib.rs`.

Now, we need to convert it into a WebAssembly.
For that, we need to use the `wasm-bindgen` crate.
This crate will allow us to compile our Rust code into an assembly that can be call it from Javascript.
It also allows to import Javascript values into Rust and pass data between Rust and Javascript.
So let's add it into our dependencies.

```bash
cargo add bindgen
```

Then, we need to annotate the function we want to export into our WebAssembly with the attribute `#[wasm_bindgen]`.
Our code now looks like following with the new attribute:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}
```

Finally, we can build it into a WebAssembly with the following command:

```bash
cargo build --release --target wasm32-unknown-unknown
```

Unfortunately, this WebAssembly cannot be loaded yet into our brower as it depends on other modules because modules cannot be instantiated !
Here, we can use `wasm-pack` to build our WebAssembly without dependencies to modules.

First, we need to install `wasm-pack`.
It is a binary crate, so it is very easy to install:

```bash
cargo install wasm-pack
```

Then, we need to build our project with it:

```bash
wasm-pack --target no-modules
```

The option `--target no-modules` makes sure that there are no imports to modules which are not allowed within userscripts.
Our WebAssembly is available at `./pkg/addition_bg.wasm`.
`wasm-pack` also produces Javascript helper code that will help load and instantiate the WebAssembly and offers Javascript bindings around the code within the assembly.

## A GitHub Action

For deployment simplicity, let's create a GitHub Action release pipeline so that we can build our project and download the pre-built WebAssembly for the internet.

```yml
name: Release

permissions:
  contents: write

on:
  release:
    types: [published]

jobs:
  buil-wasm-asset:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: git status

    # install wasm32-unknown-unknown target to build our WebAssembly
    - name: Add target
      run: rustup target add wasm32-unknown-unknown
    - name: cargo build
      run: cargo build --release --target wasm32-unknown-unknown
    # Upload the WebAssembly as a release asset
    # This assembly cannot be loaded by our userscript
    # You can try to use it and see the error it produces
    # You can remove those lines if you do not want to test the failing assembly
    - uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ github.event.release.upload_url }}
        asset_path: ./target/wasm32-unknown-unknown/release/addition.wasm
        asset_name: addition.wasm
        asset_content_type: application/wasm
    # end of the lines to remove

    # install wasm-pack and use it to build our WebAssembly
    - name: install wasm-pack
      run: cargo install wasm-pack
    - name: wasm-pack build
      run: wasm-pack build --target no-modules
    # Upload the working WebAssembly as a release asset
    - uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ github.event.release.upload_url }}
        asset_path: ./pkg/addition_bg.wasm
        asset_name: addition_bg.wasm
        asset_content_type: application/wasm
    # Javascript code that will help load the WebAssembly and easily access its features
    - uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ github.event.release.upload_url }}
        asset_path: ./pkg/tampermonky_wasm.js
        asset_name: tampermonky_wasm.js
        asset_content_type: text/javascript
```

Then, you will have to create a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release) so that the WebAssembly can be made available.

## GreasyFork Userscript

Now that the WebAssembly is ready, we can write our userscript.
Let's start with the header:

```js
// ==UserScript==
// @name         RustAddition
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  Example to load WASM file compiled from Rust and execute its functions in a GreasyFork/Tampermonkey user script
// @author       Jérôme Gurhem (https://github.com/jgurhem)
// @match        https://www.google.com/**
// @grant        GM_xmlhttpRequest
// @connect      github.com
// @connect      objects.githubusercontent.com
// @require      https://github.com/jgurhem/tampermonkey_wasm/releases/download/0.1.2/tampermonky_wasm.js
// ==/UserScript==
```

Here, we are giving all the information Tampermonkey and GreasyFork need so that it can find our script.
Note that there are a few things to take into account:

- We need to add `@grant GM_xmlhttpRequest` to be able to download our WebAssembly from the script.
- We also need to give the domain that will be accessed by the script through the `@connect`. Here it is `github.com` to access our release. Keep in mind that the release redirects to `objects.githubusercontent.com` so we need to add it too.
- The `@require` allows to include the Javascript helper code to load our WebAssembly into the userscript.

The following Javascript code download the WebAssembly from our release and instantiate it to be able to use our userscript:

```js
(async function () {
    // we download the WebAssembly we released previously
    const r = await GM.xmlHttpRequest({
        url: "https://github.com/jgurhem/tampermonkey_wasm/releases/download/0.1.2/tampermonky_wasm_bg.wasm",
        responseType: "arraybuffer",
    }).catch(e => console.error(e));

    // use wasm-pack functions to load our WebAssembly
    // is pasted in the userscript by the @require
    const { add } = wasm_bindgen;
    await wasm_bindgen(r.response);

    // call the add function
    console.log(add(1, 3));
})();
```

After downloading the assembly, we are transferring it to the helper function.
It will instantiate it and gives us access to our `add` function.
Then, we can use it !
You can open [https://www.google.com/](https://www.google.com/) with the developper tools activated and see in the console that the result of our addition, `4`, is printed.

In this post, you learned how to build a WebAssembly compiled from Rust code that can be loaded within a Tampermonkey userscript.
What do you want to learn next ?

## What about Rust struct ?

Let's write some code with `struct` and `impl` block.
We can add into our `src/lib.rs` a small application that adds two fractions.
First, let's define our Rust `struct` that holds the fraction:

```rust
#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Fraction {
    num: u32,
    den: u32,
}
```

Then, we can add an `impl` block with some functions within such as a `new` to create an instance of `Fraction`, an `add` to add another fraction to the current one and a `to_string` to easily show the value of our fraction.

```rust
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
```

Next, we just have to import it in our userscript and use it !

## The use of Fraction in our userscript

To use our Fraction in the userscript, we have to slightly edit it to import the Javascript Fraction class generated by `wasm-pack` during the building process.
Note that you have to use the Javascript helper and the WebAssembly version containing the Fraction code.
Here is what you need to do:

```diff
- const { add } = wasm_bindgen;
+ const { add, Fraction } = wasm_bindgen;
```

It is pretty simple, we import it from the bindgen dictionnary and we can use it !
So let's write some code using our Fraction:

```js
    // Use of our Fraction class
    // create an instance containing 2/3
    let f1 = Fraction.new(2, 3);
    // we print it on the console so we should see 2/3 appear in it
    console.log(f1.to_string());
    // create an instance containing 3/4
    let f2 = Fraction.new(3, 4);
    console.log(f2.to_string());
    // we add 3/4 to 2/3
    f1.add(f2);
    // which results in 17/12
    console.log(f1.to_string());
```

Then, you can add the previous code in the body of the userscript.
After that, you can reload your [https://www.google.com/](https://www.google.com/) with the developper tools activated and see that after the `4` of the previous test, we also see the values of our 3 fractions: `2/3`, `3/4` and `17/12` !

## Some issues I encountered

1. You may have to add `wasm32-unknown-unknown` by running the following command:

```bash
rustup target add wasm32-unknown-unknown
```

2. Dependencies on `sys-js` crate does not produce a WebAssembly that can be load.
For more details, see [this issue](https://github.com/rustwasm/wasm-bindgen/issues/2795)

3. `wasm-bindgen` does not support to transform Rust trait implementation into WebAssembly.
Therefore, traits should be wrapped in functions `wasm-bindgen` can convert.