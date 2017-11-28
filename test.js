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
  'Hello world', `
  `,
  'YOLO',`
`,
];

const stringToReadableStream = str => {
  const file$ = new Readable({
    read(size) {
      if (!this.content) this.push(null)
      else {
        this.push(this.content.slice(0, size))
        this.content = this.content.slice(size)
      }
    }
  });

  file$.push(Buffer.from(str, 'ascii'));
  return file$;
}

const createRes = () => {
  let outputPointer = 0;
  return new Writable({
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
}

const template = marinate`
  hello
  ${'123'}
  ${() => '456'}
  ${() => new Promise(r => setTimeout(r, 2000, '789'))}
  ${() => stringToReadableStream('Hello world')}
  ${() => new Promise(r => setTimeout(r, 2000, stringToReadableStream('YOLO')))}
`

template(createRes(), { debug: 'off' })
template(createRes(), { debug: 'off', stringToBufferThreshold: 0 })
template(createRes(), { debug: 'off', stringToBufferThreshold: 5 })