const { Stream } = require('stream');

const log = (debug, mainItem, ...verboseItems) => debug !== 'off' &&
  console.log('[marinate] ', mainItem, ...(debug === 'verbose' ? verboseItems : []))

const typeOf = obj => {
  if (obj instanceof Stream) {
    return 'stream'
  }
  if (typeof obj === 'string') {
    return 'string'
  }
  if (obj instanceof Promise) {
    return 'promise'
  }
  if (typeof obj === 'function') {
    return 'function'
  }
}

const write = stream => value => new Promise(resolve => stream.write(value, resolve))

const resolveAfterPipeAndEnd = (streamToPipe, streamToPipeInto, options) => new Promise((resolve, reject) => {
  streamToPipe.pipe(streamToPipeInto, options)
  streamToPipe.on('end', resolve)
})

// debug - off|basic|verbose
module.exports = (staticParts, ...dynamicParts) => async (streamToWriteInto, debug = 'basic') => {
  const writeToStream = write(streamToWriteInto)

  // for..of will iterate only when internal `await`s are resolved.
  for (let [index, staticPart] of staticParts.entries()) {
    log(debug, 'Rendering static part', staticPart)
    await writeToStream(staticPart)

    // if staticPart is last element, we just write it and end the stream
    if (index === staticParts.length - 1) {
      log(debug, 'Finished Marinating')
      streamToWriteInto.end()
    }
    // for intermediate staticParts, we need to plug in the dynamic parts before streaming the next staticPart
    else {
      const dynamicPart = dynamicParts[index]

      switch (typeOf(dynamicPart)) {
        case 'string': {
          // dynamicPart is just a string, so we simply write it.
          log(debug, 'Rendering string part', dynamicPart)
          await writeToStream(dynamicPart)
          break
        }
        case 'function': {
          // dynamic part is a function
          log(debug, `Rendering function part`)

          // we get the return value of function
          const result = dynamicPart()

          switch (typeOf(result)) {
            case 'stream': {
              // dynamicPart is a stream, we pipe and end before iterating
              const time = Date.now()
              log(debug, `Rendering stream part [${time}]`)
              await resolveAfterPipeAndEnd(result, streamToWriteInto, { end: false })
              log(debug, `Rendered stream part [${time}] in ${Date.now() - time}ms`)
              break
            }
            case 'string': {
              await writeToStream(result)
              log(debug, `Rendered function part as string`, result)
              break
            }
            case 'promise': {
              try {
                const time = Date.now()
                log(debug, `Awaiting function part's promise [${time}]`)
                // dynamicPart is a promise, we resolve it before iterating
                const value = await result
                if (typeof value === 'string') {
                  await writeToStream(value)
                  log(debug, `Resolved function part as string in ${Date.now() - time}ms`, value)
                } else {
                  log('verbose', "Error! Promise doesn't resolve to a string. Resolved value is: ", { value })
                }
              } catch (err) {
                log('verbose', "Error! Promise reject", { err })
              }
            }
          }
          break
        }
      }
    }
  }
}