const { Writable } = require('stream');
const marinate = require('./index');

const outputs = [`
  hello
  `,
    '123', `
  `,
    '456', `
  `,
    '789', `
`,
];
let outputPointer = 0;

const res = new Writable({
    decodeStrings: false,
    write(actual, encoding, next) {
        const expected = outputs[outputPointer++] 

        try {
            console.assert(actual === expected)
        } catch (err) {
            console.log('Test failed.', { actual, expected })
        }
        next()
    }
})

const template = marinate`
  hello
  ${'123'}
  ${() => '456'}
  ${() => new Promise(r => setTimeout(r, 2000, '789'))}
`

template(res, 'off')