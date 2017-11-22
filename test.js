const { Readable, Writable } = require('stream');
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
    'Hello world',`
`
];
let outputPointer = 0;

const file$ = new Readable({
    read(size) {
        if (!this.content) this.push(null)
        else {
            this.push(this.content.slice(0, size))
            this.content = this.content.slice(size)
        }
    }
});

file$.push(Buffer.from('Hello world', 'ascii'));

const res = new Writable({
    decodeStrings: false,
    write(actual, encoding, next) {
        const expected = outputs[outputPointer++] 

        if (actual instanceof Buffer) actual = actual.toString()

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
  ${() => file$}
`

template(res, 'off')