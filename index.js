const { Stream, Duplex } = require("stream");

/**
 * Options
 * @typedef {('off'|'basic'|'verbose')} DebugOptions
 */

/**
 * Logging options
 * @typedef {{ debug: DebugOptions, stringToBufferThreshold: number }} Options
 */

/**
 * @type {Options}
 */
const defaultOptions = {
  debug: "off",
  stringToBufferThreshold: Infinity //   "stringToBufferThreshold": min string.length before converting it into a Buffer
};

/**
 * Helper function for logging
 *
 * @param {DebugOptions} debug - logging configuration
 * @param {string} mainItem - title
 * @param {any} verboseItems - rest of the details
 */
const log = (debug, mainItem, ...verboseItems) =>
  debug !== "off" &&
  console.log(
    "[marinate] ",
    mainItem,
    ...(debug === "verbose" ? verboseItems : [])
  );

/**
 * Types for parts
 * @typedef {Stream|string|Promise|function} TypeOfSupportedPartTypes
 */
/**
 * Support types for parts
 * @typedef {('stream'|'string'|'promise'|'function')} SupportedPartTypes
 */

/**
 * A helper function to get type of object passed to it
 * @param {any} obj
 * @returns {SupportedPartTypes} Returns type of the object passed
 */
const typeOf = obj => {
  if (obj instanceof Stream) {
    return "stream";
  }
  if (typeof obj === "string") {
    return "string";
  }
  if (obj instanceof Promise) {
    return "promise";
  }
  if (typeof obj === "function") {
    return "function";
  }
};

/**
 * Promisified version of write
 * @param {Stream} stream stream to write into
 * @returns {function} Function that returns promise
 */
const write = stream => value =>
  new Promise(resolve => stream.write(value, resolve));

/**
 * Returns a stream created out of buffered passsed to it
 * @param {Buffer} buffer - buffer to push into stream
 * @returns {Stream}
 */
const bufferToReadableStream = buffer => {
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

/**
 * Returns a readable stream that streams the string passed to it
 * @param {string} string
 * @returns {ReadableStream} Readable stream created out of the passed string
 */
const stringToReadableStream = string =>
  bufferToReadableStream(Buffer.from(string));

/**
 * Returns a promise that resolves after streamToPipe has been successfully ended streaming into stteamToPipeInto
 * @param {ReadbleStream} streamToPipe
 * @param {WritableStream} streamToPipeInto
 * @param {Options} options
 */
const resolveAfterPipeAndEnd = (streamToPipe, streamToPipeInto, options) =>
  new Promise((resolve, reject) => {
    streamToPipe.pipe(streamToPipeInto, options);
    streamToPipe.on("end", resolve);
  });

/**
 * A function returning promise after streaming given `part` into `streamToWriteInto`.
 * @param {object} data
 * @param {TypeOfSupportedPartTypes} data.part
 * @param {WritableStream} data.streamToWriteInto
 * @param {Options} data.options
 */
const handlePart = async ({ part, streamToWriteInto, options }) => {
  const { debug, stringToBufferThreshold } = options;

  const writeToStream = write(streamToWriteInto);

  switch (typeOf(part)) {
    case "function": {
      await handlePart({ part: part(), streamToWriteInto, options });
      break;
    }
    case "promise": {
      await handlePart({ part: await part, streamToWriteInto, options });
      break;
    }
    case "string": {
      if (part.length >= stringToBufferThreshold) {
        log(debug, `Rendering string part as stream`, part);
        await resolveAfterPipeAndEnd(
          stringToReadableStream(part),
          streamToWriteInto,
          { end: false }
        );
        log(debug, `Rendered string part as stream`);
      } else if (part !== "") {
        log(debug, "Rendering string part", part);
        await writeToStream(part);
      }
      break;
    }
    case "stream": {
      const time = Date.now();
      log(debug, `Rendering stream part [${time}]`);
      await resolveAfterPipeAndEnd(part, streamToWriteInto, { end: false });
      log(debug, `Rendered stream part [${time}] in ${Date.now() - time}ms`);
      break;
    }
    default: {
      console.log({ part });
      throw new Error(`Unknown type [${typeOf(part)}] of above part`);
    }
  }
};

module.exports = (staticParts, ...dynamicParts) => async (
  /** @type {WritableStream} */
  streamToWriteInto,
  /** @type {Options} */
  options = defaultOptions
) => {
  const { debug, stringToBufferThreshold } = options;

  for (let [index, staticPart] of staticParts.entries()) {
    // for..of will iterate only when internal `await`s are resolved.
    await handlePart({
      part: staticPart, // take this string and
      streamToWriteInto, // directly write into the stream or pipe it
      options // based on the options
    });

    if (index === staticParts.length - 1) {
      // if staticPart is last element, we just end the stream
      log(debug, "Finished Marinating");
      streamToWriteInto.end();
    } else {
      // for intermediate staticParts, we need to plug in the dynamic parts before streaming the next staticPart
      const dynamicPart = dynamicParts[index];
      const typeOfDynamicPart = typeOf(dynamicPart);

      if (["string", "function"].includes(typeOfDynamicPart)) {
        await handlePart({
          part: dynamicPart, // take this dynamic part (string | function returning (string | promise | stream))
          streamToWriteInto, // write it into stream
          options // based on options
        });
      } else {
        throw new Error(
          `\${dynamicParts} can only be of type (string | function returning (string | promise | stream)). Found type ${typeOfDynamicPart}`
        );
      }
    }
  }
};
