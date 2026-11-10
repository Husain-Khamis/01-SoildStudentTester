import { test } from 'node:test'
import assert from 'node:assert'
import { extractUsage } from './usage.js'

const js = `# js-factorial

### Usage

Here is a possible program to test your function:

\`\`\`javascript
console.log(factorial(5));
console.log(factorial(0));
\`\`\`

And its output:

\`\`\`console
$ node main.js
120
1
$
\`\`\`

### Tip

Start with the result as \`1\`.
`

const go = `### Usage

Here is a possible program to test your function:

\`\`\`go
package main

import (
\t"fmt"
\t"piscine"
)

func main() {
\tfmt.Println(piscine.Gcd(42, 10))
}
\`\`\`

And its output :

\`\`\`console
$ go run .
2
$
\`\`\`
`

const rust = `### Usage

Here is a program to test your function

\`\`\`rust
use min_and_max::min_and_max;

fn main() {
    println!("Minimum and maximum are: {:?}", min_and_max(9, 2, 4));
}
\`\`\`

And its output

\`\`\`console
$ cargo run
Minimum and maximum are: (2, 9)
$
\`\`\`

### Notions

\`\`\`rust
let not_this = 1;
\`\`\`
`

test('js usage', () => {
  assert.strictEqual(extractUsage(js), 'console.log(factorial(5));\nconsole.log(factorial(0));\n')
})

test('go usage', () => {
  assert.match(extractUsage(go), /^package main\n[\s\S]*piscine\.Gcd\(42, 10\)[\s\S]*\}\n$/)
})

test('rust usage stops at the next heading', () => {
  const u = extractUsage(rust)
  assert.match(u, /^use min_and_max::min_and_max;/)
  assert.ok(!u.includes('not_this'))
})

test('no usage section gives null', () => {
  assert.strictEqual(extractUsage('# x\n\n```js\nfoo()\n```\n'), null)
})

test('only console blocks gives null', () => {
  assert.strictEqual(extractUsage('### Usage\n\n```console\n$ run\n```\n\n### Next\n\n```js\nx\n```\n'), null)
})
