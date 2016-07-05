(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var this$1 = this;

  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this$1, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this$1, start, end)

      case 'ascii':
        return asciiSlice(this$1, start, end)

      case 'binary':
        return binarySlice(this$1, start, end)

      case 'base64':
        return base64Slice(this$1, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this$1, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var this$1 = this;

  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this$1, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var this$1 = this;

  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this$1, i, i + 3)
    swap(this$1, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  var this$1 = this;

  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this$1, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this$1, string, offset, length)

      case 'ascii':
        return asciiWrite(this$1, string, offset, length)

      case 'binary':
        return binaryWrite(this$1, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this$1, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this$1, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var this$1 = this;

  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this$1[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  var this$1 = this;

  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this$1[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  var this$1 = this;

  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this$1[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  var this$1 = this;

  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this$1[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  var this$1 = this;

  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this$1[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  var this$1 = this;

  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this$1[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  var this$1 = this;

  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this$1[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  var this$1 = this;

  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this$1[offset + i - 1] !== 0) {
      sub = 1
    }
    this$1[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  var this$1 = this;

  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this$1[offset + i + 1] !== 0) {
      sub = 1
    }
    this$1[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  var this$1 = this;

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this$1[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this$1[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  var this$1 = this;

  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this$1[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this$1[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":1,"ieee754":4,"isarray":5}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var this$1 = this;

  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this$1, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var this$1 = this;

  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this$1.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this$1.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],6:[function(require,module,exports){
(function (Buffer){
/**
 * @module  biloba
 */

var inherits = require('inherits');
var extend = require('xtend/mutable');
var createPopup = require('popoff');
var isMobile = require('is-mobile');
var isPlainObject = require('mutype/is-object');
var isPrimitive = require('mutype/is-plain');
var Emitter = require('events');
var insertCSS = require('insert-css');

var qs = require('qs');
var autosize = require('autosize');


module.exports = Params;


insertCSS(".prama {\r\n\tfont-family: sans-serif;\r\n\ttext-align: center;\r\n\tpadding: 1.6rem 0;\r\n}\r\n\r\n.prama [hidden] {\r\n\tdisplay: none!important;\r\n}\r\n\r\n.prama * {\r\n\tbox-sizing: border-box;\r\n}\r\n\r\n.prama-title {\r\n\tmargin-top: 0;\r\n\tmargin-bottom: 1.6rem;\r\n}\r\n\r\n.prama-param {\r\n\ttext-align: left;\r\n\tmargin-bottom: .8rem;\r\n\tposition: relative;\r\n\twidth: 100%;\r\n\tmax-width: 420px;\r\n\tmargin-right: auto;\r\n    margin-left: auto;\r\n\tdisplay: inline-block;\r\n\tvertical-align: top;\r\n}\r\n\r\n.prama-label {\r\n\tword-break: break-word;\r\n\tfont-size: .8333rem;\r\n\tdisplay: inline-block;\r\n\twidth: 17%;\r\n\twidth: calc(20% - .5rem);\r\n\tmargin-right: .5rem;\r\n\tvertical-align: top;\r\n\tline-height: 1.2rem;\r\n\tpadding-top: .48em;\r\n\theight: 2rem;\r\n\ttext-align: right;\r\n}\r\n\r\n.prama-label + * {\r\n\tdisplay: inline-block;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama-label {\r\n\t\ttext-align: left;\r\n\t\tdisplay: block;\r\n\t\twidth: 100%;\r\n\t}\r\n\t.prama-label + * {\r\n\t\tmax-width: none;\r\n\t}\r\n\t.prama-label:empty {\r\n\t\tdisplay: none;\r\n\t}\r\n}\r\n\r\n.prama-input {\r\n\tfont-size: 1rem;\r\n}\r\n\r\n.prama-help {\r\n\tword-break: break-word;\r\n\tdisplay: inline-block;\r\n\tvertical-align: top;\r\n\twidth: 80%;\r\n\tmargin-left: 20%;\r\n\tpadding-top: .5rem;\r\n\tline-height: 1.2rem;\r\n\tfont-size: .9rem;\r\n\tcolor: #888;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama-help {\r\n\t\twidth: 100%;\r\n\t\tmargin-left: 0;\r\n\t}\r\n}\r\n\r\n.prama textarea,\r\n.prama input:not([type]),\r\n.prama input[type=\"text\"],\r\n.prama input[type=\"number\"],\r\n.prama input[type=\"range\"],\r\n.prama input[type=\"submit\"],\r\n.prama input[type=\"reset\"],\r\n.prama select,\r\n.prama button,\r\n.prama fieldset {\r\n\t-webkit-appearance: none;\r\n\t-moz-appearance: none;\r\n\tappearance: none;\r\n\tvertical-align: top;\r\n\tdisplay: inline-block;\r\n\t/*line-height: 2rem;*/\r\n\tmin-height: 2rem;\r\n\tmin-width: 2rem;\r\n\tborder: none;\r\n\tmargin: 0;\r\n\tborder-radius: 0;\r\n}\r\n\r\n.prama textarea,\r\n.prama input:not([type]),\r\n.prama input[type=\"text\"],\r\n.prama input[type=\"number\"],\r\n.prama select {\r\n\tbackground: rgb(238, 240, 242);\r\n\twidth: 80%;\r\n\tpadding: .2rem .5rem;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama textarea,\r\n\t.prama input:not([type]),\r\n\t.prama input[type=\"text\"],\r\n\t.prama input[type=\"number\"],\r\n\t.prama select {\r\n\t\twidth: 100%;\r\n\t}\r\n}\r\n\r\n\r\n.prama-input:not([type=\"range\"]):focus {\r\n\tbox-shadow: 0 0 0 2px rgb(36,37,38);\r\n\toutline: none;\r\n}\r\n\r\n.prama textarea {\r\n\tvertical-align: top;\r\n\tpadding-top: .5rem;\r\n\tline-height: 1.5;\r\n\tfont-size: 1rem;\r\n}\r\n\r\n.prama input[type=\"checkbox\"],\r\n.prama input[type=\"radio\"] {\r\n\tmargin: 0;\r\n\tcursor: pointer;\r\n\tbackground: rgb(36,37,38);\r\n\tfont-weight: bolder;\r\n\tfont-size: 1.4rem;\r\n\tline-height: 1.2rem;\r\n\twidth: 1.2rem;\r\n\theight: 1.2rem;\r\n\tvertical-align: middle;\r\n\ttext-align: center;\r\n\tmargin-top: -.2rem;\r\n}\r\n.prama input[type=\"radio\"] {\r\n\tborder-radius: 2rem;\r\n}\r\n\r\n.prama fieldset {\r\n\tpadding: 0;\r\n\theight: auto;\r\n\tbackground: none;\r\n\tvertical-align: top;\r\n\tborder: none;\r\n\twidth: 80%;\r\n\tline-height: 2rem;\r\n}\r\n.prama fieldset label {\r\n\twidth: auto;\r\n\tcursor: pointer;\r\n\tline-height: 2rem;\r\n\theight: 2rem;\r\n\tdisplay: inline-block;\r\n\tmargin-right: 1rem;\r\n\tmin-width: 35%;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama fieldset {\r\n\t\twidth: 100%;\r\n\t\tdisplay: block;\r\n\t}\r\n}\r\n\r\n.prama button,\r\n.prama input[type=\"submit\"],\r\n.prama input[type=\"reset\"] {\r\n\tbackground: rgb(36,37,38);\r\n\tcolor: white;\r\n\theight: 2.4rem;\r\n\tline-height: 2.4rem;\r\n\tpadding: 0 1rem;\r\n\tmin-width: 40%;\r\n\tfont-weight: bold;\r\n\tfont-size: 1.1rem;\r\n\tcursor: pointer;\r\n}\r\n\r\n.prama button:hover,\r\n.prama input[type=\"submit\"]:hover,\r\n.prama input[type=\"reset\"]:hover {\r\n\tbackground: rgb(238, 240, 242);\r\n\tcolor: rgb(36, 37, 38);\r\n}\r\n\r\n.prama button:active,\r\n.prama input[type=\"submit\"]:active,\r\n.prama input[type=\"reset\"]:active {\r\n\tbox-shadow: 0 0 0 2px rgb(36, 37, 38);\r\n}\r\n\r\n\r\n.prama-select-arrow {\r\n\tposition: absolute;\r\n    pointer-events: none;\r\n    right: 0rem;\r\n    width: 1.6rem;\r\n    font-size: .666rem;\r\n    text-align: center;\r\n    height: 2rem;\r\n    line-height: 2rem;\r\n    z-index: 2;\r\n}\r\n\r\n\r\n/* Hide default HTML checkbox */\r\n.prama-toggle {\r\n  position: relative;\r\n  display: inline-block;\r\n  vertical-align: top;\r\n  width: 4rem;\r\n  height: 2rem;\r\n}\r\n.prama-toggle input {\r\n\tdisplay: none;\r\n}\r\n.prama-toggle .prama-toggle-thumb {\r\n\tposition: absolute;\r\n\tcursor: pointer;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tbackground-color: rgb(238, 240, 242);\r\n\t-webkit-transition: .4s;\r\n\ttransition: .4s;\r\n}\r\n.prama-toggle .prama-toggle-thumb:before {\r\n\tposition: absolute;\r\n\tcontent: \"\";\r\n\theight: 1.2rem;\r\n\twidth: 1.2rem;\r\n\tleft: .4rem;\r\n\tbottom: .4rem;\r\n\tbackground-color: white;\r\n\t-webkit-transition: .4s;\r\n\ttransition: .4s;\r\n}\r\n.prama-toggle input:checked + .prama-toggle-thumb {\r\n\tbackground-color: rgb(36,37,38);\r\n\tbox-shadow: none;\r\n}\r\n.prama-toggle input:focus + .prama-toggle-thumb {\r\n\tbox-shadow: 0 0 1px rgb(36,37,38);\r\n}\r\n.prama-toggle input:checked + .prama-toggle-thumb:before {\r\n\t-webkit-transform: translateX(2rem);\r\n\t-ms-transform: translateX(2rem);\r\n\ttransform: translateX(2rem);\r\n\tbox-shadow: none;\r\n\tbackground-color: white;\r\n}\r\n\r\n\r\n.prama input[type=\"range\"] {\r\n\twidth: 58%;\r\n\twidth: calc(60% - .5rem);\r\n\tmargin-right: .5rem;\r\n\t-webkit-appearance: none;\r\n\t-moz-appearance: none;\r\n\tappearance: none;\r\n\t/** O_o you can’t use height for IE here */\r\n\tpadding: 0;\r\n\tmargin-top: .5rem;\r\n\tmin-height: .5rem;\r\n}\r\n.prama input[type=\"range\"] ~ input:not(.ghost) {\r\n\twidth: 20%;\r\n\tpadding-right: 0;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama input[type=\"range\"] {\r\n\t\twidth: 78%;\r\n\t\twidth: calc(80% - .5rem);\r\n\t}\r\n}\r\n\r\n.prama input[type=\"range\"]:focus {\r\n\toutline: none;\r\n}\r\n.prama input[type=\"range\"]::-webkit-slider-runnable-track {\r\n\theight: .5rem;\r\n\tcursor: pointer;\r\n\tbox-shadow: none;\r\n\tbackground: rgb(238, 240, 242);\r\n\tborder-radius: 0;\r\n\tborder: none;\r\n\tmargin: .25rem 0 .25rem;\r\n}\r\n.prama input[type=\"range\"]::-webkit-slider-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\theight: 1.6rem;\r\n\twidth: 1.6rem;\r\n\tborder-radius: 1.6rem;\r\n\tbackground: rgb(36,37,38);\r\n\tcursor: pointer;\r\n\tmargin-top: -.55rem;\r\n\t-webkit-appearance: none;\r\n}\r\n.prama input[type=\"range\"]:focus::-webkit-slider-runnable-track {\r\n\tbackground: rgb(238, 240, 242);\r\n}\r\n.prama input[type=\"range\"]::-moz-range-track {\r\n\theight: .5rem;\r\n\tcursor: pointer;\r\n\tbox-shadow: none;\r\n\tbackground: rgb(238, 240, 242);\r\n\tborder-radius: 0;\r\n\tborder: none;\r\n}\r\n.prama input[type=\"range\"]::-moz-range-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\theight: 1.6rem;\r\n\twidth: 1.6rem;\r\n\tborder-radius: 0;\r\n\tbackground: rgb(36,37,38);\r\n\tcursor: pointer;\r\n}\r\ninput[type=\"range\"]::-ms-track {\r\n\theight: .5rem;\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tcursor: pointer;\r\n\tbackground: transparent;\r\n\tborder-color: transparent;\r\n\tcolor: transparent;\r\n}\r\n\r\ninput[type=\"range\"]::-ms-fill-lower {\r\n\tbackground: rgb(238, 240, 242);\r\n\tborder: none;\r\n\tborder-radius: 0;\r\n\tbox-shadow: none;\r\n}\r\ninput[type=\"range\"]::-ms-fill-upper {\r\n\tbackground: rgb(238, 240, 242);\r\n\tborder: none;\r\n\tborder-radius: 0;\r\n\tbox-shadow: none;\r\n}\r\ninput[type=\"range\"]::-ms-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\twidth: 1.6rem;\r\n\tborder-radius: 0;\r\n\tbackground: rgb(36,37,38);\r\n\tcursor: pointer;\r\n\theight: .5rem;\r\n}\r\ninput[type=\"range\"]:focus::-ms-fill-lower {\r\n\tbackground: rgb(238, 240, 242);\r\n}\r\ninput[type=\"range\"]:focus::-ms-fill-upper {\r\n\tbackground: rgb(238, 240, 242);\r\n}\r\n\r\n\r\n\r\n\r\n/** multirange polyfill */\r\n@supports (--css: variables) {\r\n\tinput[type=\"range\"].multirange {\r\n\t\tdisplay: inline-block;\r\n\t\tvertical-align: top;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original {\r\n\t\tposition: absolute;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original::-webkit-slider-thumb {\r\n\t\tposition: relative;\r\n\t\tz-index: 2;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original::-moz-range-thumb {\r\n\t\ttransform: scale(1); /* FF doesn't apply position it seems */\r\n\t\tz-index: 1;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange::-moz-range-track {\r\n\t\tborder-color: transparent; /* needed to switch FF to \"styleable\" control */\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost {\r\n\t\tposition: relative;\r\n\t\tbackground: var(--track-background);\r\n\t\t--track-background: linear-gradient(to right,\r\n\t\t\t\ttransparent var(--low), var(--range-color) 0,\r\n\t\t\t\tvar(--range-color) var(--high), transparent 0\r\n\t\t\t) no-repeat 0 45% / 100% 40%;\r\n\t\t--range-color: rgb(36,37,38);\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost::-webkit-slider-runnable-track {\r\n\t\tbackground: var(--track-background);\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost::-moz-range-track {\r\n\t\tbackground: var(--track-background);\r\n\t}\r\n}\r\n\r\n\r\n\r\n\r\n.prama ::-webkit-input-placeholder {\r\n\tcolor: rgb(196, 198, 200);\r\n}\r\n.prama ::-moz-placeholder {\r\n\tcolor: rgb(196, 198, 200);\r\n}\r\n.prama :-ms-input-placeholder {\r\n\tcolor: rgb(196, 198, 200);\r\n}\r\n.prama :-moz-placeholder {\r\n\tcolor: rgb(196, 198, 200);\r\n}\r\n\r\n\r\n\r\n.prama-container > .prama-settings-button {\r\n\ttop: 0;\r\n\tright: 0;\r\n\twidth: 3.2rem;\r\n\theight: 3.2rem;\r\n\tline-height: 3.2rem;\r\n\ttext-align: center;\r\n\tdisplay: block;\r\n\tposition: absolute;\r\n\tz-index: 2;\r\n}\r\n\r\n.prama-settings-button i {\r\n\theight: 1.6rem;\r\n\twidth: 1.6rem;\r\n\tdisplay: inline-block;\r\n\tvertical-align: middle;\r\n}\r\n\r\n.prama-settings-button svg {\r\n\tmargin-bottom: .52rem;\r\n\tmax-width: 100%;\r\n\tmax-height: 100%;\r\n}\r\n");


/**
 * @constructor
 */
function Params (params, opts) {
	var this$1 = this;

	if (!(this instanceof Params)) return new Params(params, opts);

	extend(this, opts);

	//create content
	this.element = document.createElement('form');
	this.element.classList.add('prama');

	//ensure container, unless it is explicitly false
	if (!this.container && this.container !== false && this.container !== null) {
		this.container = document.body || document.documentElement;
	}

	if (this.container) {
		this.container.classList.add('prama-container');
	}

	//create title
	this.titleElement = document.createElement('h2');
	this.titleElement.classList.add('prama-title');

	if (this.title || this.title === '') {
		this.titleElement.innerHTML = this.title;
		this.element.appendChild(this.titleElement);
	}

	//params cache by names
	this.params = {};


	//load, if defined
	if (this.session) {
		var loadedParams = this.load();

		var saveTo;
		this.on('change', function () {
			if (saveTo) return;
			saveTo = setTimeout(function () {
				var params = this$1.getParams();
				this$1.save(params);
				saveTo = null;
			}, 100);
		});
	}

	//create params from list
	this.setParams(params, loadedParams);

	//create settings button and popup
	this.popup = createPopup(extend(this.popup, {
		content: this.element
	}));

	this.button = document.createElement('a');
	this.button.href = '#settings';
	this.button.classList.add('prama-settings-button');
	this.button.innerHTML = "<i>" + (this.icon) + "</i>";
	this.button.title = this.titleElement.textContent;
	this.button.addEventListener('click', function (e) {
		e.preventDefault();
		this$1.popup.show();
	});

	//if container is passed - place ui to it
	if (this.container) {
		this.container.appendChild(this.button);
	}
}

inherits(Params, Emitter);


//default container
Params.prototype.container;

//popup type
Params.prototype.popup = {
	type: 'modal'
};

//settings button and settings popup
Params.prototype.icon = Buffer("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4OTYiIGhlaWdodD0iMTAyNCIgdmlld0JveD0iMCAwIDg5NiAxMDI0Ij48cGF0aCBkPSJNNDQ3Ljk0IDM1NS43ODZjLTg2LjIxMiAwLTE1Ni4xNTQgNjkuOTQyLTE1Ni4xNTQgMTU2LjIxNCAwIDg2LjE4NCA2OS45NDIgMTU2LjI3NCAxNTYuMTU0IDE1Ni4yNzQgODYuMjQ0IDAgMTU1LjY3Mi03MC4wOTIgMTU1LjY3Mi0xNTYuMjc0IDAtODYuMjcyLTY5LjQyOC0xNTYuMjE0LTE1NS42NzItMTU2LjIxNHptMzEzLjA5MiAyNDUuOTUybC0yOC4xNDYgNjcuOCA1Ni44MzQgMTExLjYxNi02OS42MSA2OS42MS0xMTQuMjA2LTUzLjk0LTY3LjggMjcuODQ0LTM0LjQxNCAxMDUuMzQ4LTQuNCAxMy45ODJoLTk4LjM4OEwzNTguMzI0IDgyNS4wOWwtNjcuOC0yNy45NjQtMTExLjc2NCA1Ni41OTItNjkuNTc4LTY5LjU1IDUzLjg4LTExNC4yNjgtMjcuOTM0LTY3Ljc0Mi0xMTkuMTIyLTM4Ljg3MlY0NjQuOTZsMTE4Ljk5OC00Mi42MzggMjcuOTM2LTY3LjY4Mi01MC4wNTItOTguODA4LTYuNi0xMi45NTggNjkuNDg4LTY5LjQ4OCAxMTQuMzU4IDUzLjg1IDY3LjcxLTI3Ljk5NiAzNC4zODItMTA1LjI4OEwzOTYuNjU2IDgwaDk4LjM1OGw0Mi42MSAxMTkuMDU4IDY3LjYyMiAyNy45OTYgMTExLjkxNi01Ni43MTIgNjkuNTUgNjkuNDg4LTUzLjg4IDExNC4xNzggMjcuODQ0IDY3LjgzMiAxMTkuMzMgMzguODEydjk4LjI5OGwtMTE4Ljk3IDQyLjc5eiIvPjwvc3ZnPg==","base64");


//show/hide popup
Params.prototype.show = function () {this.popup && this.popup.show(); return this;};
Params.prototype.hide = function () {this.popup && this.popup.hide(); return this;};


/** Create params based off list */
Params.prototype.setParams = function (list, loaded) {
	var this$1 = this;

	if (isPlainObject(list)) {
		var loop = function ( name ) {
			var item = list[name];

			//function initializing param
			if (item instanceof Function) {
				this$1.once('set', function () {
					this$1.setParam(name, item.call(this$1));
				});
			}
			//
			else if (item instanceof HTMLElement) {
				item = {
					create: item
				};
			}
			else {
				item = isPlainObject(item) ? item : { value: item };
			}

			if (loaded && loaded[name] !== undefined) {
				if (item.default === undefined) {
					item.default = item.value;
				}
				item.value = loaded[name];
			}

			this$1.setParam(name, item);
		};

		for (var name in list) loop( name );
	}
	else if (Array.isArray(list)){
		list.forEach(function (item) {
			if (item instanceof Function) {
				this$1.once('set', function () {
					this$1.setParam(item.call(this$1));
				});
				return;
			}
			var name = item.name;
			if (loaded && loaded[name] !== undefined) {
				if (item.default === undefined) item.default = item.value;
				item.value = loaded[name];
			}
			this$1.setParam(item);
		});
	}

	this.emit('set');

	return this;
}

//create new param or set value of existing param
Params.prototype.setParam = function (name, param, cb) {
	var this$1 = this;

	//sort out args
	//setParam({}, ...)
	if (isPlainObject(name)) {
		cb = param;
		param = name;
		name = param.name
	}
	//setParam(_, fn)
	if (param instanceof Function) {
		cb = param;
		param = {name: name};
	}
	//setParam(_, 0.5, _)
	if (!isPlainObject(param)) {
		if (this.params[name]) return this.setParamValue(name, param);
		param = {value: param};
	}

	if (typeof name === 'string') {
		param.name = name;
	}

	if (!param.name) {
		throw Error('Define `name` for parameter ' + JSON.stringify(param));
	}

	//normalize param
	param = this.params[param.name] = extend(this.params[param.name] || {}, param);

	param.change = cb || param.change || param.onchange;

	if (!param.type) {
		if (param.values) {
			param.type = 'select';
		}
		else if (param.min || param.max || param.step || typeof param.value === 'number') {
			param.type = 'range';
		}
		else if (Array.isArray(param.value)) {
			param.type = 'multirange';
		}
		else if (typeof param.value === 'boolean') {
			param.type = 'checkbox';
		}
	}

	if (param.label === undefined) {
		if (param.create) {
			param.label = null;
		}
		else {
			param.label = param.name.slice(0,1).toUpperCase() + param.name.slice(1);
		}
	}

	var label = '';
	if (param.label != null) {
		label = "<label for=\"" + (param.name) + "\" class=\"prama-label\" title=\"" + (param.label) + "\">" + (param.label) + "</label>"
	};

	var el = document.createElement('div');
	el.classList.add('prama-param');

	//custom create
	if (param.create) {
		if (param.save == null) param.save = false;

		if (param.create instanceof Function) {
			var html = param.create.call(param, param);
		}
		else {
			var html = param.create;
		}

		el.innerHTML = label;

		if (html instanceof Element) {
			el.appendChild(html);
		}
		else {
			el.innerHTML += html;
		}
	}

	//default type
	else {
		var html = '';

		switch (param.type) {
			case 'select':
				html += "<select\n\t\t\t\t\tid=\"" + name + "\" class=\"prama-input prama-select\" title=\"" + (param.value) + "\">";

				if (Array.isArray(param.values)) {
					for (var i = 0; i < param.values.length; i++) {
						html += "<option value=\"" + (param.values[i]) + "\" " + (param.values[i] === param.value ? 'selected' : '') + ">" + (param.values[i]) + "</option>"
					}
				}
				else {
					for (var name$1 in param.values) {
						html += "<option value=\"" + (param.values[name$1]) + "\" " + (param.values[name$1] === param.value ? 'selected' : '') + ">" + name$1 + "</option>"
					}
				}
				html += "</select><span class=\"prama-select-arrow\">▼</span>";

				break;

			case 'number':
			case 'range':
			case 'multirange':
				var multiple = param.type === 'multirange';
				var value = param.value != null ? (typeof param.value === 'number' ? param.value : parseFloat(param.value)) : NaN;
				if (isNaN(value)) value = param.max ? param.max / 2 : 50;
				if (multiple) {
					if (!Array.isArray(param.value)) {
						param.value = [value, value];
					}
				} else {
					param.value = value;
				}
				param.min = param.min != null ? param.min : 0;
				param.max = param.max != null ? param.max : (multiple ? Math.max.apply(Math, param.value) : param.value) < 1 ? 1 : 100;
				param.step = param.step != null ? param.step : (multiple ? Math.max.apply(Math, param.value) : param.value) < 1 ? .01 : 1;

				html += "<input id=\"" + (param.name) + "\" type=\"range\" class=\"prama-input prama-range prama-value\" value=\"" + (param.value) + "\" min=\"" + (param.min) + "\" max=\"" + (param.max) + "\" step=\"" + (param.step) + "\" title=\"" + (param.value) + "\" " + (multiple ? 'multiple' : '') + "/>";
				if (!multiple) {
					html += "<input id=\"" + (param.name) + "-number\" value=\"" + (param.value) + "\" class=\"prama-input prama-value\" type=\"number\" min=\"" + (param.min) + "\" max=\"" + (param.max) + "\" step=\"" + (param.step) + "\" title=\"" + (param.value) + "\"/>";
				}
				else {
					html += "<input id=\"" + (param.name) + "-number\" value=\"" + (param.value) + "\" class=\"prama-input prama-value\" type=\"text\" title=\"" + (param.value) + "\"/>";
				}

				break;

			case 'checkbox':
			case 'toggle':
				param.value = param.value == null ? false : param.value;

				html += "<label class=\"prama-toggle\">\n\t\t\t\t\t<input type=\"checkbox\" id=\"" + (param.name) + "\" class=\"prama-input\" " + (param.value ? 'checked' : '') + "/>\n\t\t\t\t\t<div class=\"prama-toggle-thumb\"></div>\n\t\t\t\t</label>";

				break;

			case 'button':
				if (param.save == null) param.save = false;
				html = "<button id=\"" + (param.name) + "\" class=\"prama-input prama-button\"\n\t\t\t\t>" + (param.value) + "</button>";
				break;

			case 'submit':
			case 'reset':
				if (param.save == null) param.save = false;
				html = "<input id=\"" + (param.name) + "\" class=\"prama-input prama-button\"\n\t\t\t\tvalue=\"" + (param.value) + "\" title=\"" + (param.title) + "\" type=\"" + (param.type) + "\"/>";
				break;

			case 'radio':
			case 'switch':
			case 'multiple':
			case 'list':
				html = "<fieldset id=\"" + (param.name) + "\" class=\"prama-radio\">";

				if (Array.isArray(param.values)) {
					for (var i = 0; i < param.values.length; i++) {
						html += "<label for=\"" + (param.values[i]) + "\"><input type=\"radio\" value=\"" + (param.values[i]) + "\" " + (param.values[i] === param.value ? 'checked' : '') + " id=\"" + (param.values[i]) + "\" name=\"" + (param.name) + "\"/> " + (param.values[i]) + "</label>";
					}
				}
				else {
					for (var name$2 in param.values) {
						html += "<label for=\"" + name$2 + "\"><input type=\"radio\" value=\"" + (param.values[name$2]) + "\" " + (param.values[name$2] === param.value ? 'checked' : '') + " id=\"" + name$2 + "\" name=\"" + (param.name) + "\"/> " + (param.values[name$2]) + "</label>";
					}
				}

				html += "</fieldset>";

				break;

			case 'file':
				throw 'Unimplemented';
				break;

			case 'canvas':
			case 'output':
				throw 'Unimplemented';
				break;

			case 'textarea' :
				param.value = param.value == null ? '' : param.value;
				html += "<textarea rows=\"1\" placeholder=\"" + (param.placeholder || 'value...') + "\" id=\"" + (param.name) + "\" class=\"prama-input prama-textarea\" title=\"" + (param.value) + "\">" + (param.value) + "</textarea>\n\t\t\t\t";

				break;

			default:
				param.value = param.value == null ? '' : param.value;
				html += "<input placeholder=\"" + (param.placeholder || 'value...') + "\" id=\"" + (param.name) + "\" class=\"prama-input prama-text\" value=\"" + (param.value) + "\" title=\"" + (param.value) + "\" " + (param.type ? ("type=\"" + (param.type) + "\"") : '') + "/>\n\t\t\t\t";

				break;
		}

		if (param.help) {
			html += "<div class=\"prama-help\">" + (param.help) + "</div>";
		}

		el.innerHTML = label + html;
	}

	//if new element - just add listeners and place httm
	if (param.element) {
		param.element.parentNode.replaceChild(el, param.element);
		param.element = el;
	} else {
		param.element = el;
		this.element.appendChild(param.element);
	}

	//apply hidden
	if (param.hidden) {
		param.element.setAttribute('hidden', true);
	}
	else {
		param.element.removeAttribute('hidden');
	}

	//init autosize
	if (param.type === 'textarea') {
		var textarea = param.element.querySelector('textarea');
		textarea && autosize(textarea);
	}

	//init multirange
	if (param.type === 'multirange') {
		var input = param.element.querySelector('input');
		input && multirange(input);
	}

	//watch for change event
	var inputs = param.element.querySelectorAll('input, select, button, textarea, fieldset');

	[].forEach.call(inputs, function (input) {
		input.addEventListener('input', function (e) {
			this$1.setParamValue(param.name, e.target);
		});
		input.addEventListener('change', function (e) {
			this$1.setParamValue(param.name, e.target);
		});
		if (param.type === 'button' || param.type === 'submit') {
			input.addEventListener('click', function (e) {
				e.preventDefault();
				this$1.setParamValue(param.name, e.target);
			});
		}
		input.addEventListener('keypress', function (e) {
			if (e.which === 13) {
				this$1.setParamValue(param.name, e.target);
			}
		});
	});

	//preset style
	if (param.style) {
		for (var name$3 in param.style) {
			var v = param.style[name$3];
			if (typeof v === 'number' && !/ndex/.test(name$3)) v += 'px';
			param.element.style[name$3] = v;
		}
	}

	//set serialization
	if (param.save == null) param.save = true;

	if (param.default === undefined) param.default = param.value;

	//init param value
	if (param.type !== 'button' && param.type !== 'submit') {
		//FIXME: >:( setTimeout needed to avoid instant init (before other fields)
		//FIXME: it invokes `change`, which can affect other fields and in result init the whole form in wrong order.
		setTimeout(function () {
			this$1.setParamValue(param.name, param.value);
		});
	}

	return this;
};

//return value of defined param
Params.prototype.getParam = function (name) {
	if (arguments.length) {
		return this.params[name].value;
	}
	else {
		return this.getParams();
	}
}

//get cache of params
Params.prototype.getParams = function (whitelist) {
	var this$1 = this;

	var res = {};
	for (var name in this.params) {
		if (!whitelist || (whitelist && whitelist[name] != null)) {
			if (!this$1.params[name].save) continue;
			res[name] = this$1.params[name].value;
		}
	}
	return res;
}


//set param value/options
Params.prototype.setParamValue = function (name, value) {
	var sourceTarget;
	if (value instanceof Element) {
		sourceTarget = value;
		value = getValue(sourceTarget);
	}

	var param = this.params[name];

	param.value = value;
	param.element.title = (param.label || param.name) + ": " + (param.value);

	param.change && param.change.call(this, value, param);
	this.emit('change', param.name, param.value, param);

	//update ui
	var targets = param.element.querySelectorAll('input, select, button, textarea, fieldset');
	[].forEach.call(targets, function (target) {
		if (target === sourceTarget) return;

		if (target.type === 'radio') return;

		if (target.classList.contains('ghost')) {
			target = target.parentNode.querySelector('.original');
		}

		if (target.classList.contains('original')) {
			target.valueLow = value[0];
			target.valueHigh = value[1];
			return;
		}

		setValue(target, value);
	});
}


//reflect state in query
Params.prototype.history = false;

//save/load params to local storage
Params.prototype.session = true;

//storage key
Params.prototype.key = 'prama';

//local storage
Params.prototype.storage = self.sessionStorage || self.localStorage;

//save params state to local storage
Params.prototype.save = function (params) {
	if (!params) return false;

	if (this.session) {
		this.saveSession(params);
	}

	if (this.history) {
		this.saveHistory(params);
	}

	return true;
};

//put state into storage
Params.prototype.saveSession = function (params) {
	var this$1 = this;

	if (!this.storage) return false;

	//convert to string
	for (var name in params) {
		var value = params[name];
		if (value === this$1.params[name].default) delete params[name];
		params[name] = toString(params[name]);
		if (value === this$1.params[name].default) delete params[name];
	}

	try {
		var str = JSON.stringify(params);
	} catch (e) {
		console.error(e);
		return false;
	}

	if (!str) return false;
	this.storage.setItem(this.key, str);

	return true;
};

//put params into location
Params.prototype.saveHistory = function (params) {
	var str = this.toString(params);

	location.hash = str;

	return true;
};

//load params state from local storage
Params.prototype.load = function () {

	var values = {};

	//load session
	if (this.session) {
		values = this.loadSession();
	}

	//load history (overwrite)
	if (this.history) {
		values = extend(values, this.loadHistory());
	}

	return values;
};

//load params from session
Params.prototype.loadSession = function () {
	if (!this.storage) return {};

	var str = this.storage.getItem(this.key);
	if (!str) return {};

	try {
		var values = JSON.parse(str);
	}
	catch (e) {
		console.error(e);
		return {};
	}

	if (!values) return {};

	//convert from string
	for (var name in values) {
		values[name] = fromString(values[name]);
	}

	return values;
};

//load params from history
Params.prototype.loadHistory = function () {
	var params = qs.parse(location.hash.slice(1));

	if (!params) return {};

	for (var name in params) {
		params[name] = fromString(params[name]);
	}

	return params;
}


//convert to string
Params.prototype.toString = function (params) {
	var this$1 = this;

	params = params || this.getParams();

	//convert to string
	for (var name in params) {
		var value = params[name];
		if (value === this$1.params[name].default) delete params[name];
		params[name] = toString(params[name]);
		if (value === this$1.params[name].default) delete params[name];
	}

	var str = '';
	try {
		str = qs.stringify(params, {encode: false});
	} catch (e) {
		console.error(e);
		return '';
	}

	return str;
}



// BLOODY HELPERS

//convert value to string
function toString (value) {
	if (value === true) return '✔';
	if (value === false) return '✘';
	return value + '';
}

//get value from string
function fromString (value) {
	if (value === '✔' || value === 'true') return true;
	if (value === '✘' || value === 'false') return false;
	if (/\,/.test(value) && !/\s/.test(value)) {
		return value.split(',').map(fromString);
	}
	if (!isNaN(parseFloat(value))) return parseFloat(value);
	return value;
}


//get value from a dom element
function getValue (target) {
	var value = target.type === 'checkbox' ? target.checked : target.value;

	if (target.type === 'number' || target.type === 'range' || target.type === 'multirange' ) {
		if (target.hasAttribute('multiple')) {
			if (target.classList.contains('ghost')) {
				target = target.parentNode.querySelector('.original');
			}
			value = [target.valueLow, target.valueHigh];
		}
		else {
			value = parseFloat(target.value);
		}
	}

	if (value == null && target.type === 'button') {
		value = target.innerHTML;
	}

	return value;
}

//set value to a dom element
function setValue (target, value) {
	target.value = value;

	if (target.type === 'checkbox' || target.type === 'radio') {
		target.checked = !!value;
	}

	if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
		target.innerHTML = value;
	}

	//FIXME: seems that select gets updated by setting it’s `value`
	// if (target.tagName === 'SELECT') {
	// 	target.querySelector(`option[value=""`)
	// }

	if (target.tagName === 'FIELDSET') {
		var input = target.querySelector(("input[value=\"" + value + "\"]"));
		if (input) setValue(input, value);
	}
}



//FIXME :'( multirange copy-paste (Lea Verou, please do npm)
//https://github.com/LeaVerou/multirange
var supportsMultiple = HTMLInputElement && "valueLow" in HTMLInputElement.prototype;

var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

function multirange (input) {
	if (supportsMultiple || input.classList.contains("multirange")) {
		return;
	}

	var values = input.getAttribute("value").split(",");
	var max = +input.max || 100;
	var ghost = input.cloneNode();

	input.classList.add("multirange", "original");
	ghost.classList.add("multirange", "ghost");

	input.value = values[0] || max / 2;
	ghost.value = values[1] || max / 2;

	input.parentNode.insertBefore(ghost, input.nextSibling);

	Object.defineProperty(input, "originalValue", descriptor.get ? descriptor : {
		// Fuck you Safari >:(
		get: function() { return this.value; },
		set: function(v) { this.value = v; }
	});

	Object.defineProperties(input, {
		valueLow: {
			get: function() { return Math.min(this.originalValue, ghost.value); },
			set: function(v) { this.originalValue = v; },
			enumerable: true
		},
		valueHigh: {
			get: function() { return Math.max(this.originalValue, ghost.value); },
			set: function(v) { ghost.value = v; },
			enumerable: true
		}
	});

	if (descriptor.get) {
		// Again, fuck you Safari
		Object.defineProperty(input, "value", {
			get: function() { return this.valueLow + "," + this.valueHigh; },
			set: function(v) {
				if (typeof v === 'string') {
					v = v.split(",");
				}
				this.valueLow = v[0];
				this.valueHigh = v[1];
			},
			enumerable: true
		});
	}

	function update() {
		ghost.style.setProperty("--low", input.valueLow * 100 / max + 1 + "%");
		ghost.style.setProperty("--high", input.valueHigh * 100 / max - 1 + "%");
	}

	input.addEventListener("input", update);
	ghost.addEventListener("input", update);

	update();
}
}).call(this,require("buffer").Buffer)
},{"autosize":8,"buffer":2,"events":3,"inherits":10,"insert-css":11,"is-mobile":12,"mutype/is-object":28,"mutype/is-plain":29,"popoff":32,"qs":34,"xtend/mutable":39}],7:[function(require,module,exports){
var margins = require('mucss/margin');
var paddings = require('mucss/padding');
var offsets = require('mucss/offset');
var borders = require('mucss/border');
var isFixed = require('mucss/is-fixed');

/**
 * @module
 */
module.exports = align;
module.exports.toFloat = toFloat;


var doc = document, win = window, root = doc.documentElement;



/**
 * Align set of elements by the side
 *
 * @param {NodeList|Array} els A list of elements
 * @param {string|number|Array} alignment Alignment param
 * @param {Element|Rectangle} relativeTo An area or element to calc off
 */
function align(els, alignment, relativeTo){
	if (!els || els.length < 2) throw Error('At least one element should be passed');

	//default alignment is left
	if (!alignment) alignment = 0;

	//default key element is the first one
	if (!relativeTo) relativeTo = els[0];

	//figure out x/y
	var xAlign, yAlign;
	if (alignment instanceof Array) {
		xAlign = toFloat(alignment[0]);
		yAlign = toFloat(alignment[1]);
	}
	//catch y values
	else if (/top|middle|bottom/.test(alignment)) {
		yAlign = toFloat(alignment);
	}
	else {
		xAlign = toFloat(alignment);
	}


	//apply alignment
	var targetRect = offsets(relativeTo);
	if (relativeTo === window) {
		targetRect.top = 0;
		targetRect.left = 0;
	}

	for (var i = els.length, el, s; i--;){
		el = els[i];

		if (el === window) continue;

		//ignore self
		if (el === relativeTo) continue;

		s = getComputedStyle(el);

		//ensure element is at least relative, if it is static
		if (s.position === 'static') el.style.position = 'relative';


		//get relativeTo & parent rectangles
		if (isFixed(el)) {
			var parent = win;
		}
		else {
			var parent = el.offsetParent || win;
		}

		//include margins
		var placeeMargins = margins(el);
		var parentRect = offsets(parent);
		var parentPaddings = paddings(parent);
		var parentBorders = borders(parent);

		parentRect.top += -parentBorders.top + placeeMargins.top;
		parentRect.left += -parentBorders.left + placeeMargins.left;
		parentRect.bottom += -parentBorders.bottom + placeeMargins.bottom;
		parentRect.right += -parentBorders.right + placeeMargins.right;

		//FIXME: I don’t understand why, but for popoff and placer it is required like that
		if (parent !== doc.body) {
			parentRect.top += parentPaddings.top
			parentRect.left += parentPaddings.left;
			parentRect.bottom += parentPaddings.bottom;
			parentRect.right += parentPaddings.right;
		}

		//correct parentRect
		if (parent === window || (parent === doc.body && getComputedStyle(parent).position === 'static') || parent === root) {
			parentRect.left = 0;
			parentRect.top = 0;
		}

		alignX(els[i], targetRect, parentRect, xAlign);
		alignY(els[i], targetRect, parentRect, yAlign);
	}
}




/**
 * Place horizontally
 */
function alignX ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute left
	var desirableLeft = placerRect.left + placerRect.width*align - placee.offsetWidth*align - parentRect.left;

	placee.style.left = desirableLeft + 'px';
	placee.style.right = 'auto';
}


/**
 * Place vertically
 */
function alignY ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute top
	var desirableTop = placerRect.top + placerRect.height*align - placee.offsetHeight*align - parentRect.top;

	placee.style.top = desirableTop + 'px';
	placee.style.bottom = 'auto';
}



/**
 * @param {string|number} value Convert any value passed to float 0..1
 */
function toFloat(value){
	if (typeof value === 'string') {
		//else parse single-value
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
			case 'center':
			case 'middle':
				return 0.5;
		}
		// throw Error('Alignment ' + value + 'is weird');
		return parseFloat(value);
	}

	return value;
}
},{"mucss/border":13,"mucss/is-fixed":17,"mucss/margin":18,"mucss/offset":19,"mucss/padding":20}],8:[function(require,module,exports){
/*!
	Autosize 3.0.15
	license: MIT
	http://www.jacklmoore.com/autosize
*/
(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports', 'module'], factory);
	} else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
		factory(exports, module);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, mod);
		global.autosize = mod.exports;
	}
})(this, function (exports, module) {
	'use strict';

	var set = typeof Set === 'function' ? new Set() : (function () {
		var list = [];

		return {
			has: function has(key) {
				return Boolean(list.indexOf(key) > -1);
			},
			add: function add(key) {
				list.push(key);
			},
			'delete': function _delete(key) {
				list.splice(list.indexOf(key), 1);
			} };
	})();

	var createEvent = function createEvent(name) {
		return new Event(name);
	};
	try {
		new Event('test');
	} catch (e) {
		// IE does not support `new Event()`
		createEvent = function (name) {
			var evt = document.createEvent('Event');
			evt.initEvent(name, true, false);
			return evt;
		};
	}

	function assign(ta) {
		var _ref = arguments[1] === undefined ? {} : arguments[1];

		var _ref$setOverflowX = _ref.setOverflowX;
		var setOverflowX = _ref$setOverflowX === undefined ? true : _ref$setOverflowX;
		var _ref$setOverflowY = _ref.setOverflowY;
		var setOverflowY = _ref$setOverflowY === undefined ? true : _ref$setOverflowY;

		if (!ta || !ta.nodeName || ta.nodeName !== 'TEXTAREA' || set.has(ta)) return;

		var heightOffset = null;
		var overflowY = null;
		var clientWidth = ta.clientWidth;

		function init() {
			var style = window.getComputedStyle(ta, null);

			overflowY = style.overflowY;

			if (style.resize === 'vertical') {
				ta.style.resize = 'none';
			} else if (style.resize === 'both') {
				ta.style.resize = 'horizontal';
			}

			if (style.boxSizing === 'content-box') {
				heightOffset = -(parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
			} else {
				heightOffset = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
			}
			// Fix when a textarea is not on document body and heightOffset is Not a Number
			if (isNaN(heightOffset)) {
				heightOffset = 0;
			}

			update();
		}

		function changeOverflow(value) {
			{
				// Chrome/Safari-specific fix:
				// When the textarea y-overflow is hidden, Chrome/Safari do not reflow the text to account for the space
				// made available by removing the scrollbar. The following forces the necessary text reflow.
				var width = ta.style.width;
				ta.style.width = '0px';
				// Force reflow:
				/* jshint ignore:start */
				ta.offsetWidth;
				/* jshint ignore:end */
				ta.style.width = width;
			}

			overflowY = value;

			if (setOverflowY) {
				ta.style.overflowY = value;
			}

			resize();
		}

		function resize() {
			var htmlTop = window.pageYOffset;
			var bodyTop = document.body.scrollTop;
			var originalHeight = ta.style.height;

			ta.style.height = 'auto';

			var endHeight = ta.scrollHeight + heightOffset;

			if (ta.scrollHeight === 0) {
				// If the scrollHeight is 0, then the element probably has display:none or is detached from the DOM.
				ta.style.height = originalHeight;
				return;
			}

			ta.style.height = endHeight + 'px';

			// used to check if an update is actually necessary on window.resize
			clientWidth = ta.clientWidth;

			// prevents scroll-position jumping
			document.documentElement.scrollTop = htmlTop;
			document.body.scrollTop = bodyTop;
		}

		function update() {
			var startHeight = ta.style.height;

			resize();

			var style = window.getComputedStyle(ta, null);

			if (style.height !== ta.style.height) {
				if (overflowY !== 'visible') {
					changeOverflow('visible');
				}
			} else {
				if (overflowY !== 'hidden') {
					changeOverflow('hidden');
				}
			}

			if (startHeight !== ta.style.height) {
				var evt = createEvent('autosize:resized');
				ta.dispatchEvent(evt);
			}
		}

		var pageResize = function pageResize() {
			if (ta.clientWidth !== clientWidth) {
				update();
			}
		};

		var destroy = (function (style) {
			window.removeEventListener('resize', pageResize, false);
			ta.removeEventListener('input', update, false);
			ta.removeEventListener('keyup', update, false);
			ta.removeEventListener('autosize:destroy', destroy, false);
			ta.removeEventListener('autosize:update', update, false);
			set['delete'](ta);

			Object.keys(style).forEach(function (key) {
				ta.style[key] = style[key];
			});
		}).bind(ta, {
			height: ta.style.height,
			resize: ta.style.resize,
			overflowY: ta.style.overflowY,
			overflowX: ta.style.overflowX,
			wordWrap: ta.style.wordWrap });

		ta.addEventListener('autosize:destroy', destroy, false);

		// IE9 does not fire onpropertychange or oninput for deletions,
		// so binding to onkeyup to catch most of those events.
		// There is no way that I know of to detect something like 'cut' in IE9.
		if ('onpropertychange' in ta && 'oninput' in ta) {
			ta.addEventListener('keyup', update, false);
		}

		window.addEventListener('resize', pageResize, false);
		ta.addEventListener('input', update, false);
		ta.addEventListener('autosize:update', update, false);
		set.add(ta);

		if (setOverflowX) {
			ta.style.overflowX = 'hidden';
			ta.style.wordWrap = 'break-word';
		}

		init();
	}

	function destroy(ta) {
		if (!(ta && ta.nodeName && ta.nodeName === 'TEXTAREA')) return;
		var evt = createEvent('autosize:destroy');
		ta.dispatchEvent(evt);
	}

	function update(ta) {
		if (!(ta && ta.nodeName && ta.nodeName === 'TEXTAREA')) return;
		var evt = createEvent('autosize:update');
		ta.dispatchEvent(evt);
	}

	var autosize = null;

	// Do nothing in Node.js environment and IE8 (or lower)
	if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
		autosize = function (el) {
			return el;
		};
		autosize.destroy = function (el) {
			return el;
		};
		autosize.update = function (el) {
			return el;
		};
	} else {
		autosize = function (el, options) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], function (x) {
					return assign(x, options);
				});
			}
			return el;
		};
		autosize.destroy = function (el) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], destroy);
			}
			return el;
		};
		autosize.update = function (el) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], update);
			}
			return el;
		};
	}

	module.exports = autosize;
});
},{}],9:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],10:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],11:[function(require,module,exports){
var containers = []; // will store container HTMLElement references
var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

module.exports = function (css, options) {
    options = options || {};

    var position = options.prepend === true ? 'prepend' : 'append';
    var container = options.container !== undefined ? options.container : document.querySelector('head');
    var containerId = containers.indexOf(container);

    // first time we see this container, create the necessary entries
    if (containerId === -1) {
        containerId = containers.push(container) - 1;
        styleElements[containerId] = {};
    }

    // try to get the correponding container + position styleElement, create it otherwise
    var styleElement;

    if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
        styleElement = styleElements[containerId][position];
    } else {
        styleElement = styleElements[containerId][position] = createStyleElement();

        if (position === 'prepend') {
            container.insertBefore(styleElement, container.childNodes[0]);
        } else {
            container.appendChild(styleElement);
        }
    }

    // actually add the stylesheet
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText += css
    } else {
        styleElement.textContent += css;
    }

    return styleElement;
};

function createStyleElement() {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    return styleElement;
}

},{}],12:[function(require,module,exports){
module.exports = isMobile;

function isMobile (ua) {
  if (!ua && typeof navigator != 'undefined') ua = navigator.userAgent;
  if (ua && ua.headers && typeof ua.headers['user-agent'] == 'string') {
    ua = ua.headers['user-agent'];
  }
  if (typeof ua != 'string') return false;

  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4));
}

},{}],13:[function(require,module,exports){
/**
 * Parse element’s borders
 *
 * @module mucss/borders
 */

var Rect = require('./rect');
var parse = require('./parse-value');

/**
 * Return border widths of an element
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.borderLeftWidth),
		parse(style.borderTopWidth),
		parse(style.borderRightWidth),
		parse(style.borderBottomWidth)
	);
};
},{"./parse-value":21,"./rect":23}],14:[function(require,module,exports){
/**
 * Get or set element’s style, prefix-agnostic.
 *
 * @module  mucss/css
 */
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').lowercase;


/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}

	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */
function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}
},{"./fake-element":15,"./prefix":22}],15:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],16:[function(require,module,exports){
/**
 * Window scrollbar detector.
 *
 * @module mucss/has-scroll
 */

//TODO: detect any element scroll, not only the window
exports.x = function () {
	return window.innerHeight > document.documentElement.clientHeight;
};
exports.y = function () {
	return window.innerWidth > document.documentElement.clientWidth;
};
},{}],17:[function(require,module,exports){
/**
 * Detect whether element is placed to fixed container or is fixed itself.
 *
 * @module mucss/is-fixed
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */
module.exports = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};
},{}],18:[function(require,module,exports){
/**
 * Get margins of an element.
 * @module mucss/margins
 */

var parse = require('./parse-value');
var Rect = require('./rect');

/**
 * Return margins of an element.
 *
 * @param    {Element}   el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.marginLeft),
		parse(style.marginTop),
		parse(style.marginRight),
		parse(style.marginBottom)
	);
};
},{"./parse-value":21,"./rect":23}],19:[function(require,module,exports){
/**
 * Calculate absolute offsets of an element, relative to the document.
 *
 * @module mucss/offsets
 *
 */
var win = window;
var doc = document;
var Rect = require('./rect');
var hasScroll = require('./has-scroll');
var scrollbar = require('./scrollbar');
var isFixedEl = require('./is-fixed');
var getTranslate = require('./translate');


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl.
 */
module.exports = offsets;

function offsets (el) {
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (hasScroll.y() ? scrollbar : 0),
		result.height = win.innerHeight - (hasScroll.x() ? scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//return absolute offsets if document requested
	else if (el === doc) {
		var res = offsets(doc.documentElement);
		res.bottom = Math.max(window.innerHeight, res.bottom);
		res.right = Math.max(window.innerWidth, res.right);
		if (hasScroll.y(doc.documentElement)) res.right -= scrollbar;
		if (hasScroll.x(doc.documentElement)) res.bottom -= scrollbar;
		return res;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = isFixedEl(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	result = Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight
	);

	return result;
};
},{"./has-scroll":16,"./is-fixed":17,"./rect":23,"./scrollbar":24,"./translate":25}],20:[function(require,module,exports){
/**
 * Caclulate paddings of an element.
 * @module  mucss/paddings
 */


var Rect = require('./rect');
var parse = require('./parse-value');


/**
 * Return paddings of an element.
 *
 * @param    {Element}   el   An element to calc paddings.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.paddingLeft),
		parse(style.paddingTop),
		parse(style.paddingRight),
		parse(style.paddingBottom)
	);
};
},{"./parse-value":21,"./rect":23}],21:[function(require,module,exports){
/**
 * Returns parsed css value.
 *
 * @module mucss/parse-value
 *
 * @param {string} str A string containing css units value
 *
 * @return {number} Parsed number value
 */
module.exports = function (str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
};

//FIXME: add parsing units
},{}],22:[function(require,module,exports){
/**
 * Vendor prefixes
 * Method of http://davidwalsh.name/vendor-prefix
 * @module mucss/prefix
 */

var styles = getComputedStyle(document.documentElement, '');

if (!styles) {
	module.exports = {
		dom: '', lowercase: '', css: '', js: ''
	};
}

else {
	var pre = (Array.prototype.slice.call(styles)
		.join('')
		.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
	)[1];

	var dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

	module.exports = {
		dom: dom,
		lowercase: pre,
		css: '-' + pre + '-',
		js: pre[0].toUpperCase() + pre.substr(1)
	};
}
},{}],23:[function(require,module,exports){
/**
 * Simple rect constructor.
 * It is just faster and smaller than constructing an object.
 *
 * @module mucss/rect
 *
 * @param {number} l left
 * @param {number} t top
 * @param {number} r right
 * @param {number} b bottom
 *
 * @return {Rect} A rectangle object
 */
module.exports = function Rect (l,t,r,b) {
	if (!(this instanceof Rect)) return new Rect(l,t,r,b);

	this.left=l||0;
	this.top=t||0;
	this.right=r||0;
	this.bottom=b||0;
	this.width=Math.abs(this.right - this.left);
	this.height=Math.abs(this.bottom - this.top);
};
},{}],24:[function(require,module,exports){
/**
 * Calculate scrollbar width.
 *
 * @module mucss/scrollbar
 */

// Create the measurement node
var scrollDiv = document.createElement("div");

var style = scrollDiv.style;

style.width = '100px';
style.height = '100px';
style.overflow = 'scroll';
style.position = 'absolute';
style.top = '-9999px';

document.documentElement.appendChild(scrollDiv);

// the scrollbar width
module.exports = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
document.documentElement.removeChild(scrollDiv);
},{}],25:[function(require,module,exports){
/**
 * Parse translate3d
 *
 * @module mucss/translate
 */

var css = require('./css');
var parseValue = require('./parse-value');

module.exports = function (el) {
	var translateStr = css(el, 'transform');

	//find translate token, retrieve comma-enclosed values
	//translate3d(1px, 2px, 2) → 1px, 2px, 2
	//FIXME: handle nested calcs
	var match = /translate(?:3d)?\s*\(([^\)]*)\)/.exec(translateStr);

	if (!match) return [0, 0];
	var values = match[1].split(/\s*,\s*/);

	//parse values
	//FIXME: nested values are not necessarily pixels
	return values.map(function (value) {
		return parseValue(value);
	});
};
},{"./css":14,"./parse-value":21}],26:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'boolean' || a instanceof Boolean;
}
},{}],27:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],28:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};
},{}],29:[function(require,module,exports){
var isString = require('./is-string'),
	isNumber = require('./is-number'),
	isBool = require('./is-bool');

module.exports = function isPlain(a){
	return !a || isString(a) || isNumber(a) || isBool(a);
};
},{"./is-bool":26,"./is-number":27,"./is-string":30}],30:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],31:[function(require,module,exports){
/**
* @module  placer
*
* Places any element relative to any other element the way you define
*/

//TODO: use translate3d instead of absolute repositioning (option?)
//TODO: implement avoiding strategy (graphic editors use-case when you need to avoid placing over selected elements)
//TODO: enhance best-side strategy: choose the most closest side

var css = require('mucss/css');
var scrollbarWidth = require('mucss/scrollbar');
var isFixed = require('mucss/is-fixed');
var offsets = require('mucss/offset');
var hasScroll = require('mucss/has-scroll');
var borders = require('mucss/border');
var margins = require('mucss/margin');
var softExtend = require('soft-extend');
var align = require('aligner');
var parseValue = require('mucss/parse-value');

//shortcuts
var win = window, doc = document, root = doc.documentElement;


module.exports = place;

place.align = align;
place.toFloat = align.toFloat;

/**
 * Default options
 */
var defaults = {
	//an element to align relatively to
	//element
	target: win,

	//which side to place element
	//t/r/b/l, 'center', 'middle'
	side: 'auto',

	/**
	 * An alignment trbl/0..1/center
	 *
	 * @default  0
	 * @type {(number|string|array)}
	 */
	align: 0.5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window,

	//look for better blacement, if doesn’t fit
	auto: true
};


/**
 * Place element relative to the target by the side & params passed.
 *
 * @main
 *
 * @param {Element} element An element to place
 * @param {object} options Options object
 *
 * @return {boolean} The result of placement - whether placing succeeded
 */
function place (element, options) {
	//inherit defaults
	options = softExtend(options, defaults);

	options.target = options.target || options.to || win;

	if (!options.within) {
		options.within = options.target === win ? win : root;
	}

	//TODO: query avoidables
	// options.avoid = q(element, options.avoid, true);


	//set the same position as the target or absolute
	var elStyle = getComputedStyle(element);
	if (elStyle.position === 'static') {
		if (options.target instanceof Element && isFixed(options.target)) {
			element.style.position = 'fixed';
		}
		else {
			element.style.position = 'absolute';
		}
	}

	//force placing into DOM
	if (!document.contains(element)) (document.body || document.documentElement).appendChild(element);


	//else place according to the position
	var side = (options.auto || options.side === 'auto') ? getBestSide(element, options) : options.side;
	placeBySide[side](element, options);


	return element;
}


/**
 * Set of positioning functions
 * @enum {Function}
 * @param {Element} placee Element to place
 * @param {object} target Offsets rectangle (absolute position)
 * @param {object} ignore Sides to avoid entering (usually, already tried)
 */
var placeBySide = {
	center: function(placee, opts){
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//align centered
		var al = opts.align;
		if (!(al instanceof Array)) {
			if (/,/.test(al)) {
				al = al.split(/\s*,\s*/);
				al = [parseFloat(al[0]), parseFloat(al[1])];
			}
			else if (/top|bottom|middle/.test(al)) al = [.5, al];
			else al = [al, .5];
		}

		align([opts.target, placee], al);

		//apply limits
		//FIXME: understand this use-case when it should be called for centered view
		if (opts.within && opts.within !== window) {
			trimPositionY(placee, opts, parentRect);
			trimPositionX(placee, opts, parentRect);
		}


		//upd options
		opts.side = 'center';
	},

	left: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;

		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place left (set css right because placee width may change)
		css(placee, {
			right: parentRect.right - placerRect.left,
			left: 'auto'
		});

		//place vertically properly
		align([opts.target, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts, parentRect);


		//upd options
		opts.side = 'left';
	},

	right: function (placee, opts) {
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, borders(placee.offsetParent));


		//place right
		css(placee, {
			left: placerRect.right - parentRect.left,
			right: 'auto',
		});


		//place vertically properly
		align([opts.target, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts, parentRect);


		//upd options
		opts.side = 'right';
	},

	top: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place vertically top-side
		css(placee, {
			bottom: parentRect.bottom - placerRect.top,
			top: 'auto'
		});


		//place horizontally properly
		align([opts.target, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts, parentRect);


		//upd options
		opts.side = 'top';
	},

	bottom: function(placee, opts){
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);


		//correct borders
		contractRect(parentRect, borders(placee.offsetParent));


		//place bottom
		css(placee, {
			top: placerRect.bottom - parentRect.top,
			bottom: 'auto',
		});


		//place horizontally properly
		align([opts.target, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts, parentRect);


		//upd options
		opts.side = 'bottom';
	}
};


/**
 * Find the most appropriate side to place element
 */
function getBestSide (placee, opts) {
	var initSide = opts.side === 'auto' ? 'bottom' : opts.side;

	var withinRect = offsets(opts.within),
		placeeRect = offsets(placee),
		placerRect = offsets(opts.target);

	contractRect(withinRect, borders(opts.within));

	var placeeMargins = margins(placee);

	//rect of "hot" area (available spaces from placer to container)
	var hotRect = {
		top: placerRect.top - withinRect.top,
		bottom: withinRect.bottom - placerRect.bottom,
		left: placerRect.left - withinRect.left,
		right: withinRect.right - placerRect.right
	};

	//rect of available spaces
	var availSpace = {
		top: hotRect.top - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
		bottom: hotRect.bottom - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
		left: hotRect.left - placeeRect.width - placeeMargins.left - placeeMargins.right,
		right: hotRect.right - placeeRect.width - placeeMargins.left - placeeMargins.right
	};

	//TODO: if avoidable el is within the hot area - specify the side limits


	//if fits initial side, return it
	if (availSpace[initSide] >= 0) return initSide;

	//if none of sides fit, return center
	if (availSpace.top < 0 && availSpace.bottom < 0 && availSpace.left < 0 && availSpace.right < 0) return 'center';

	//else find the most free side within others
	var maxSide = initSide, maxSpace = availSpace[maxSide];
	for (var side in availSpace) {
		if (availSpace[side] > maxSpace) {
			maxSide = side; maxSpace = availSpace[maxSide];
		}
	}

	return maxSide;
}



/** contract rect 1 with rect 2 */
function contractRect(rect, rect2){
	//correct rect2
	rect.left += rect2.left;
	rect.right -= rect2.right;
	rect.bottom -= rect2.bottom;
	rect.top += rect2.top;
	return rect;
}


/** Apply limits rectangle to the position of an element */
function trimPositionY(placee, opts, parentRect){
	var within = opts.within;

	var placeeRect = offsets(placee);
	var withinRect = offsets(within);
	var placeeMargins = margins(placee);

	if (within === window && isFixed(placee)) {
		withinRect.top = 0;
		withinRect.left = 0;
	}

	contractRect(withinRect, borders(within));

	//shorten withinRect by the avoidable elements
	//within the set of avoidable elements find the ones
	if (opts.avoid) {

	}

	if (withinRect.top > placeeRect.top - placeeMargins.top) {
		css(placee, {
			top: withinRect.top - parentRect.top,
			bottom: 'auto'
		});
	}

	else if (withinRect.bottom < placeeRect.bottom + placeeMargins.bottom) {
		css(placee, {
			top: 'auto',
			bottom: parentRect.bottom - withinRect.bottom
		});
	}
}
function trimPositionX(placee, opts, parentRect){
	var within = opts.within;

	var placeeRect = offsets(placee);
	var withinRect = offsets(within);
	var placeeMargins = margins(placee);

	if (within === window && isFixed(placee)) {
		withinRect.top = 0;
		withinRect.left = 0;
	}

	contractRect(withinRect, borders(within));

	if (withinRect.left > placeeRect.left - placeeMargins.left) {
		css(placee, {
			left: withinRect.left - parentRect.left,
			right: 'auto'
		});
	}

	else if (withinRect.right < placeeRect.right + placeeMargins.right) {
		css(placee, {
			left: 'auto',
			right: parentRect.right - withinRect.right
		});
	}
}


/**
 * Return offsets rectangle for an element/array/any target passed.
 * I. e. normalize offsets rect
 *
 * @param {*} el Element, selector, window, document, rect, array
 *
 * @return {object} Offsets rectangle
 */
function getParentRect (target) {
	var rect;

	//handle special static body case
	if (target == null || target === window || (target === doc.body && getComputedStyle(target).position === 'static') || target === root) {
		rect = {
			left: 0,
			right: win.innerWidth - (hasScroll.y() ? scrollbarWidth : 0),
			width: win.innerWidth,
			top: 0,
			bottom: win.innerHeight - (hasScroll.x() ? scrollbarWidth : 0),
			height: win.innerHeight
		};
	}
	else {
		rect = offsets(target);
	}

	return rect;
}
},{"aligner":7,"mucss/border":13,"mucss/css":14,"mucss/has-scroll":16,"mucss/is-fixed":17,"mucss/margin":18,"mucss/offset":19,"mucss/parse-value":21,"mucss/scrollbar":24,"soft-extend":38}],32:[function(require,module,exports){
/**
 * @module  popup
 */

var Emitter = require('events');
var place = require('placer');
var extend = require('xtend/mutable');
var uid = require('get-uid');
var inherits = require('inherits');
var createOverlay = require('./overlay');
var insertCss = require('insert-css');
var sb = require('mucss/scrollbar');
var hasScroll = require('mucss/has-scroll');


insertCss(".popoff-overlay {\r\n\tposition: fixed;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\topacity: 0;\r\n\tbackground-color: rgba(65,65,65,.85);\r\n\tbackground: linear-gradient(160deg, rgba(93, 88, 95, 0.75), rgba(63, 60, 72, 0.75));\r\n\t-webkit-transition: opacity .33s;\r\n\t-moz-transition: opacity .33s;\r\n\ttransition: opacity .33s;\r\n\tz-index: 5;\r\n}\r\n.popoff-closable {\r\n\tcursor: pointer;\r\n}\r\n\r\n.popoff-popup {\r\n\tz-index: 9;\r\n\tposition: absolute;\r\n\toverflow: hidden;\r\n\tmargin: auto;\r\n\tmin-width: 4rem;\r\n\tmin-height: 1rem;\r\n\tbackground: white;\r\n\topacity: 1;\r\n\tvisibility: visible;\r\n\tbackface-visibility: hidden;\r\n\tbox-sizing: border-box;\r\n\t-webkit-transform-origin: center center;\r\n\t-moz-transform-origin: center center;\r\n\ttransform-origin: center center;\r\n\t-webkit-transform: scale(1) rotate(0deg);\r\n\t-moz-transform: scale(1) rotate(0deg);\r\n\t-ms-transform: scale(1) rotate(0deg);\r\n\ttransform: scale(1) rotate(0deg);\r\n}\r\n.popoff-popup-tip {\r\n\tmargin: 1rem;\r\n}\r\n\r\n.popoff-animate {\r\n\t-webkit-transition: opacity .333s, transform .25s ease-out;\r\n\t-moz-transition: opacity .333s, transform .25s ease-out;\r\n\ttransition: opacity .333s, transform .25s ease-out;\r\n}\r\n.popoff-hidden {\r\n\topacity: 0;\r\n\tdisplay: none;\r\n\tpointer-events: none;\r\n\tvisibility: hidden;\r\n}\r\n.popoff-visible {\r\n\topacity: 1;\r\n}\r\n\r\n\r\n.popoff-container {\r\n}\r\n.popoff-container-overflow {\r\n\toverflow: hidden;\r\n\theight: 100%;\r\n}\r\n\r\n.popoff-overflow {\r\n\tposition: fixed;\r\n\toverflow: hidden;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tz-index: 10;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n}\r\n.popoff-overflow.popoff-overflow-tall {\r\n\toverflow-y: scroll;\r\n\tdisplay: block;\r\n}\r\n.popoff-overflow .popoff-popup {\r\n\tposition: relative;\r\n}\r\n\r\n.popoff-overflow-tall .popoff-popup {\r\n\tmargin: 2rem auto;\r\n}\r\n@media (max-width: 42rem) {\r\n\t.popoff-overflow-tall .popoff-popup {\r\n\t\tmargin: 0 auto;\r\n\t}\r\n}\r\n\r\n/* Close button */\r\n.popoff-close {\r\n\tposition: absolute;\r\n\tright: 0;\r\n\ttop: 0;\r\n\twidth: 3.333rem;\r\n\theight: 3.333rem;\r\n\tcursor: pointer;\r\n\tline-height: 3.333rem;\r\n\ttext-align: center;\r\n\tfont-size: 1.333rem;\r\n\tcolor: rgb(40,40,40);\r\n\tbackground: transparent;\r\n}\r\n.popoff-close:after {\r\n\tcontent: '✕';\r\n}\r\n.popoff-close:hover{\r\n\tbackground: black;\r\n\tcolor: white;\r\n}\r\n\r\n\r\n/* Types */\r\n.popoff-modal,\r\n.popoff-dialog,\r\n.popoff-confirm,\r\n.popoff-alert,\r\n.popoff-sidebar {\r\n\tposition: fixed;\r\n\tmax-width: 660px;\r\n\tmin-width: 320px;\r\n\tpadding: 1.6rem 2rem;\r\n\tbox-shadow: 0 .666vh 3.333vw -.333vh rgba(19, 16, 27, 0.45);\r\n}\r\n@media (max-width: 42rem) {\r\n\t.popoff-modal,\r\n\t.popoff-dialog,\r\n\t.popoff-confirm,\r\n\t.popoff-alert {\r\n\t\tmax-width: 80%;\r\n\t}\r\n}\r\n.popoff-dropdown,\r\n.popoff-tooltip {\r\n\tmax-width: 320px;\r\n\tpadding: 1rem 1.2rem;\r\n\tbox-shadow: 0 1px 4px rgba(19, 16, 27, 0.25);\r\n}\r\n\r\n\r\n\r\n/** Special sidebar settings */\r\n.popoff-sidebar {\r\n\tmargin: 0;\r\n\tmax-width: none;\r\n\tmin-width: 0;\r\n\tmax-height: none;\r\n\toverflow-y: auto;\r\n\topacity: 1;\r\n\tpadding: 1.2rem;\r\n}\r\n.popoff-sidebar[data-side=\"top\"] {\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: auto;\r\n\tmax-height: 160px;\r\n}\r\n.popoff-sidebar[data-side=\"bottom\"] {\r\n\tbottom: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\ttop: auto;\r\n\tmax-height: 160px;\r\n}\r\n.popoff-sidebar[data-side=\"right\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tright: 0;\r\n\tleft: auto;\r\n\tmax-width: 240px;\r\n}\r\n.popoff-sidebar[data-side=\"left\"] {\r\n\tbottom: 0;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: auto;\r\n\tmax-width: 240px;\r\n}\r\n\r\n\r\n\r\n/* Tip */\r\n.popoff-tip {\r\n\twidth: 30px;\r\n\theight: 30px;\r\n\tposition: absolute;\r\n\tz-index: 10;\r\n\toverflow: hidden;\r\n}\r\n.popoff-tip:after {\r\n\tcontent: '';\r\n\tborder-top-left-radius: 1px;\r\n\tposition: absolute;\r\n\tbackground: white;\r\n\tbox-shadow: 0 0px 3px rgba(19, 16, 27, 0.25);\r\n\t-webkit-transform-origin: center;\r\n\t-moz-transform-origin: center;\r\n\ttransform-origin: center;\r\n\t-webkit-transform: rotate(45deg);\r\n\t-moz-transform: rotate(45deg);\r\n\ttransform: rotate(45deg);\r\n\twidth: 30px;\r\n\theight: 30px;\r\n}\r\n.popoff-tip[data-side=\"top\"],\r\n.popoff-tip[data-side=\"bottom\"] {\r\n\theight: 20px;\r\n}\r\n.popoff-tip[data-side=\"top\"]:after {\r\n\tbottom: auto;\r\n\ttop: 17px;\r\n}\r\n.popoff-tip[data-side=\"bottom\"]:after {\r\n\tbottom: 17px;\r\n\ttop: auto;\r\n}\r\n.popoff-tip[data-side=\"left\"],\r\n.popoff-tip[data-side=\"right\"] {\r\n\twidth: 20px;\r\n}\r\n.popoff-tip[data-side=\"left\"]:after {\r\n\tleft: 17px;\r\n\tright: auto;\r\n}\r\n.popoff-tip[data-side=\"right\"]:after {\r\n\tleft: auto;\r\n\tright: 17px;\r\n}\r\n\r\n\r\n\r\n/* Basic fade */\r\n.popoff-effect-fade {\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n/* Effect 1: Fade in and scale up */\r\n.popoff-effect-scale {\r\n\t-webkit-transform: scale(0.7);\r\n\t-moz-transform: scale(0.7);\r\n\t-ms-transform: scale(0.7);\r\n\ttransform: scale(0.7);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 2: Slide from the right */\r\n.popoff-effect-slide {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-right {\r\n\t-webkit-transform: translateX(20%);\r\n\t-moz-transform: translateX(20%);\r\n\t-ms-transform: translateX(20%);\r\n\ttransform: translateX(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-bottom {\r\n\t-webkit-transform: translateY(20%);\r\n\t-moz-transform: translateY(20%);\r\n\t-ms-transform: translateY(20%);\r\n\ttransform: translateY(20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-left {\r\n\t-webkit-transform: translateX(-20%);\r\n\t-moz-transform: translateX(-20%);\r\n\t-ms-transform: translateX(-20%);\r\n\ttransform: translateX(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n.popoff-effect-slide-top {\r\n\t-webkit-transform: translateY(-20%);\r\n\t-moz-transform: translateY(-20%);\r\n\t-ms-transform: translateY(-20%);\r\n\ttransform: translateY(-20%);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n\r\n\r\n/* Effect 4: Newspaper */\r\n.popoff-effect-newspaper {\r\n\t-webkit-transform: scale(0) rotate(720deg);\r\n\t-moz-transform: scale(0) rotate(720deg);\r\n\t-ms-transform: scale(0) rotate(720deg);\r\n\ttransform: scale(0) rotate(720deg);\r\n\t-webkit-transition: all 0.5s;\r\n\t-moz-transition: all 0.5s;\r\n\ttransition: all 0.5s;\r\n\topacity: 0;\r\n}\r\n\r\n\r\n/* Effect 11: Super scaled */\r\n.popoff-effect-super-scaled {\r\n\t-webkit-transform: scale(2);\r\n\t-moz-transform: scale(2);\r\n\t-ms-transform: scale(2);\r\n\ttransform: scale(2);\r\n\topacity: 0;\r\n\t-webkit-transition: all 0.3s;\r\n\t-moz-transition: all 0.3s;\r\n\ttransition: all 0.3s;\r\n}\r\n");

module.exports = Popup;


/**
 * @class  Popup
 *
 * @constructor
 *
 * @param {Object} options Showing options
 *
 * @return {Popup} A popup controller
 */
function Popup (opts) {
	var this$1 = this;

	if (!(this instanceof Popup)) return new Popup(opts);

	var typeOpts = this.types[opts.type || this.type] || {};

	//hook up type events and options events
	if (typeOpts.onInit) this.on('init', typeOpts.onInit);
	if (typeOpts.onShow) this.on('show', typeOpts.onShow);
	if (typeOpts.onHide) this.on('hide', typeOpts.onHide);
	if (typeOpts.onAfterShow) this.on('afterShow', typeOpts.onAfterShow);
	if (typeOpts.onAfterHide) this.on('afterHide', typeOpts.onAfterHide);
	if (opts.onInit) this.on('init', opts.onInit);
	if (opts.onShow) this.on('show', opts.onShow);
	if (opts.onHide) this.on('hide', opts.onHide);
	if (opts.onAfterShow) this.on('afterShow', opts.onAfterShow);
	if (opts.onAfterHide) this.on('afterHide', opts.onAfterHide);


	//generate unique id
	this.id = uid();

	//FIXME: :'(
	this.update = this.update.bind(this);

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popoff-popup');
	this.element.classList.add('popoff-hidden');

	//take over type’s options.
	//should be after element creation to init `content` property
	extend(this, typeOpts, opts);

	this.element.classList.add(("popoff-" + (this.type)));

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}
	this.container.classList.add('popoff-container');

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('popoff-close');
	if (this.closable) {
		this.closeElement.addEventListener('click', function (e) {
			this$1.hide();
		});
		this.element.appendChild(this.closeElement);
	}

	//create tip
	this.tipElement = document.createElement('div');
	this.tipElement.classList.add('popoff-tip');
	this.tipElement.classList.add('popoff-hidden');
	if (this.tip) {
		this.container.appendChild(this.tipElement);
		this.element.classList.add('popoff-popup-tip');
	}

	//apply custom style
	if (this.style) {
		for (var name in this.style) {
			var value = this$1.style[name];
			if (typeof value === 'number' && !/z/.test(name)) value += 'px';
			this$1.element.style[name] = value;
		}
	}

	//create overflow for tall content
	this.overflowElement = document.createElement('div');
	this.overflowElement.classList.add('popoff-overflow');

	this.container.appendChild(this.element);

	if (this.escapable) {
		document.addEventListener('keyup', function (e) {
			if (!this$1.isVisible) return;
			if (e.which === 27) {
				this$1.hide();
			}
		});
	}

	//init proper target
	if (typeof this.target === 'string') {
		this.target = document.querySelector(this.target);
	}

	//update on resize
	window.addEventListener('resize', function () {
		this$1.update();
	});

	this.emit('init');
}

inherits(Popup, Emitter);

extend(Popup.prototype, {
	/** Show overlay, will be detected based off type */
	overlay: true,

	/** Show close button */
	closable: true,

	/** Close by escape */
	escapable: true,

	/** Show tip */
	tip: false,

	/** Place popup relative to the element, like dropdown */
	target: window,

	/** Whether to show only one popup */
	single: true,

	/** A target to bind default placing */
	container: document.body || document.documentElement,

	/** Animation effect, can be a list */
	effect: 'fade',

	/** Default module type to take over the options */
	type: 'modal',

	/** Placing settings */
	side: 'center',
	align: 'center',

	//default anim fallback
	animTimeout: 1000,

	//detect tall content
	wrap: false,

	//shift content
	shift: true
});

//FIXME: hope it will not crash safari
Object.defineProperties(Popup.prototype, {
	content: {
		get: function () {
			return this.element;
		},
		set: function (content) {
			if (!this.element) throw Error('Content element is undefined');

			if (this.closeElement) this.element.removeChild(this.closeElement);

			if (content instanceof HTMLElement) {
				this.element.innerHTML = '';
				this.element.appendChild(content);
			}
			else if (typeof content === 'string') {
				this.element.innerHTML = content;
			}

			if (this.closeElement) this.element.appendChild(this.closeElement);
		}
	}
});


/** Type of default interactions */
Popup.prototype.types = {
	modal: {
		overlay: true,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'center',
		align: 'center',
		target: null,
		wrap: true,
		effect: 'fade',
		update: function () {},
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return;

					return this$1.show();
				});
			}
			else {
				this.target = window;
			}
		}
	},

	dropdown: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'bottom',
		align: 'center',
		effect: 'fade',
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return this$1.hide();
					else return this$1.show();
				});
			}

			//hide on unfocus
			document.addEventListener('click', function (e) {
				if (!this$1.isVisible) {
					return;
				}

				//ignore contain clicks
				if (this$1.element.contains(e.target)) {
					return;
				}

				//ignore self clicks
				this$1.hide();
			});
		}
	},

	tooltip: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'right',
		align: 'center',
		effect: 'fade',
		timeout: 500,
		onInit: function () {
			var this$1 = this;

			var that = this;

			if (this.target) {
				this.target.addEventListener('mouseenter', function (e) {
					if (this$1._leave) {
						clearTimeout(this$1._leave);
						this$1._leave = null;
					}
					if (this$1.isVisible) return;
					this$1.show();
					setTimeout(function () {
						this$1._leave = setTimeout(function () {
							this$1.hide();
						}, this$1.timeout + 1000);
					});
				});
				this.target.addEventListener('mousemove', function (e) {
					if (this$1._leave) {
						clearTimeout(this$1._leave);
						this$1._leave = null;
					}
				});
				this.target.addEventListener('mouseleave', function (e) {
					if (!this$1.isVisible) return;
					this$1._leave = setTimeout(function () {
						this$1.hide();
					}, this$1.timeout);
				});
			}

			this.element.addEventListener('mouseenter', function (e) {
				if (!this$1.isVisible) return;
				this$1._leave && clearTimeout(this$1._leave);
			});
			this.element.addEventListener('mouseleave', function (e) {
				if (!this$1.isVisible) return;
				this$1._leave = setTimeout(function () {
					this$1.hide();
				}, this$1.timeout);
			});
		}
	},

	sidebar: {
		overlay: false,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'bottom',
		align: .5,
		target: null,
		effect: 'slide',
		shift: true,
		update: function () {},
		onInit: function () {
			var this$1 = this;

			//define shift
			if (this.shift === true) {
				this.shift = 100;
			}

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return;

					return this$1.show();
				});
			}
			else {
				this.target = window;
			}
			this.container.parentNode.appendChild(this.element);
		},
		onShow: function () {
			if (!/top|left|bottom|right/.test(this.side)) this.side = this.types.sidebar.side;
			this.element.setAttribute('data-side', this.side);
			this.effect = 'slide-' + this.side;

			if (this.shift) {
				this.container.classList.add('popoff-animate');
				var value = typeof this.shift === 'number' ? (this.shift + 'px') : this.shift;
				if (/top|bottom/.test(this.side)) {
					this.container.style.transform = "translateY(" + ((this.side === 'top' ? '' : '-') + value) + ")";
				}
				else {
					this.container.style.transform = "translateX(" + ((this.side === 'left' ? '' : '-') + value) + ")";
				}
			}
		},
		onHide: function () {
			if (this.shift) this.container.style.transform = null;
		},
		onAfterHide: function () {
			this.shift && this.container.classList.remove('popoff-animate');
		}
	}
};


/**
 * Show popup near to the target
 */
Popup.prototype.show = function (target, cb) {
	var this$1 = this;

	if (this.isVisible) return this;

	if (target instanceof Function) {
		this.currentTarget = this.target;
		cb = target;
	}
	else {
		this.currentTarget = target || this.target;
	}

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.add('popoff-active');
	this.element.classList.remove('popoff-hidden');
	this.tipElement.classList.remove('popoff-hidden');

	this.emit('show', this.currentTarget);

	//ensure effects classes
	this.element.classList.add(("popoff-effect-" + (this.effect)));
	this.tipElement.classList.add(("popoff-effect-" + (this.effect)));

	var elHeight = this.element.offsetHeight;

	//apply overflow on body for tall content
	if (this.wrap) {
		if (elHeight > window.innerHeight) {
			this.isTall = true;
			this.overflowElement.classList.add('popoff-overflow-tall');
		}
		if (hasScroll.y()) {
			this._border = this.container.style.borderRight;
			this.container.style.borderRight = sb + 'px solid transparent';
		}
		this.container.classList.add('popoff-container-overflow');
		this.container.appendChild(this.overflowElement);
		this.overflowElement.appendChild(this.element);
	}

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');

	//in some way it needs to be called in timeout with some delay, otherwise animation fails
	setTimeout(function () {
		this$1.element.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.tipElement.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.isVisible = true;
		this$1.update();
	}, 10);

	if (this.overlay) {
		this._overlay = createOverlay({
			closable: true,
			container: this.wrap ? this.overflowElement : this.container
		})
		.on('hide', function (e) {
			this$1._overlay = null;
			this$1.hide();
		})
		.show();
	}

	this.isAnimating = true;
	this.animend(function (e) {
		//in case if something happened with content during the animation
		// this.update();
		this$1.isAnimating = false;
		this$1.tipElement.classList.remove('popoff-animate');
		this$1.element.classList.remove('popoff-animate');
		this$1.element.classList.add('popoff-visible');
		this$1.tipElement.classList.add('popoff-visible');

		this$1.emit('afterShow');
		cb && cb.call(this$1);
	});

	return this;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function (cb) {
	var this$1 = this;

	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.remove('popoff-active');

	this.emit('hide');


	this.element.classList.add(("popoff-effect-" + (this.effect)));
	this.tipElement.classList.add(("popoff-effect-" + (this.effect)));

	this.isAnimating = true;

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');
	this.element.classList.remove('popoff-visible');
	this.tipElement.classList.remove('popoff-visible');


	this.animend(function () {
		this$1.isVisible = false;
		this$1.isAnimating = false;
		this$1._overlay = null;
		this$1.tipElement.classList.remove('popoff-animate');
		this$1.element.classList.remove('popoff-animate');
		this$1.element.classList.add('popoff-hidden');
		this$1.tipElement.classList.add('popoff-hidden');

		this$1.element.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.tipElement.classList.remove(("popoff-effect-" + (this$1.effect)));

		if (this$1.wrap) {
			this$1.isTall = false;
			this$1.overflowElement.classList.remove('popoff-overflow-tall');
			this$1.container.classList.remove('popoff-container-overflow');
			this$1.container.style.borderRight = this$1._border || null;
			this$1._border = null;
			this$1.container.removeChild(this$1.overflowElement);
			this$1.container.appendChild(this$1.element);
		}

		this$1.emit('afterHide');
		cb && cb.call(this$1);
	});

	return this;
}


/** Place popup next to the target */
Popup.prototype.update = function (how) {
	if (!this.isVisible) return this;

	//wrapped modals are placed via css
	if (this.wrap) return this;

	how = extend({
		target: this.currentTarget || this.target,
		side: this.side,
		align: this.align,
		within: window
	}, how);

	this.emit('update', how);

	place(this.element, how);

	if (this.tip) {
		var side = 'top';
		switch (how.side) {
			case 'top':
				side = 'bottom';
				break;
			case 'bottom':
				side = 'top';
				break;
			case 'left':
				side = 'right';
				break;
			case 'right':
				side = 'left';
				break;
			default:
				side = 'center';
		}

		this.tipElement.setAttribute('data-side', side);
		place(this.tipElement, {
			target: this.element,
			side: side,
			align: 'center',
			within: null
		});
	}

	return this;
}


/** Trigger callback once on anim end */
Popup.prototype.animend = function (cb) {
	var this$1 = this;

	var to = setTimeout(function () {
		cb.call(this$1);
	}, this.animTimeout);

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);

	var that = this;
	function end () {
		clearTimeout(to);

		// that.element.removeEventListener('animationend', end);
		// that.element.removeEventListener('mozAnimationEnd', end);
		// that.element.removeEventListener('webkitAnimationEnd', end);
		// that.element.removeEventListener('oanimationend', end);
		// that.element.removeEventListener('MSAnimationEnd', end);
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);

		cb.call(that);
	}
}
},{"./overlay":33,"events":3,"get-uid":9,"inherits":10,"insert-css":11,"mucss/has-scroll":16,"mucss/scrollbar":24,"placer":31,"xtend/mutable":39}],33:[function(require,module,exports){
/**
 * @module  popoff/overlay
 *
 * Because overlay-component is hopelessly out of date.
 * This is modern rewrite.
 */

var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var extend = require('xtend/mutable');


module.exports = Overlay;


/**
 * Initialize a new `Overlay`.
 *
 * @param {Object} options
 * @api public
 */

function Overlay(options) {
	var this$1 = this;

	if (!(this instanceof Overlay)) return new Overlay(options);

	Emitter.call(this);

	extend(this, options);

	if (!this.container) {
		this.container = document.body || document.documentElement;
	}

	//create overlay element
	this.element = document.createElement('div');
	this.element.classList.add('popoff-overlay');

	if (this.closable) {
		this.element.addEventListener('click', function (e) {
			this$1.hide();
		});
		this.element.classList.add('popoff-closable');
	}
}

inherits(Overlay, Emitter);


//close overlay by click
Overlay.prototype.closable = true;


/**
 * Show the overlay.
 *
 * Emits "show" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.show = function () {
	var this$1 = this;

	this.emit('show');

	this.container.appendChild(this.element);

	//class removed in a timeout to save animation
	setTimeout( function () {
		this$1.element.classList.add('popoff-visible');
		this$1.emit('afterShow');
	}, 10);

	return this;
};


/**
 * Hide the overlay.
 *
 * Emits "hide" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.hide = function () {
	this.emit('hide');

	this.element.classList.remove('popoff-visible');

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, 1000);

	var that = this;
	function end () {
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);
		clearInterval(to);

		that.container.removeChild(that.element);
		that.emit('afterHide');
	}

	return this;
};
},{"events":3,"inherits":10,"xtend/mutable":39}],34:[function(require,module,exports){
'use strict';

var Stringify = require('./stringify');
var Parse = require('./parse');

module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":35,"./stringify":36}],35:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var defaults = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false,
    allowDots: false,
    decoder: Utils.decode
};

var parseValues = function parseValues(str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[options.decoder(part)] = '';

            if (options.strictNullHandling) {
                obj[options.decoder(part)] = null;
            }
        } else {
            var key = options.decoder(part.slice(0, pos));
            var val = options.decoder(part.slice(pos + 1));

            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = [].concat(obj[key]).concat(val);
            } else {
                obj[key] = val;
            }
        }
    }

    return obj;
};

var parseObject = function parseObject(chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = parseObject(chain, val, options);
        }
    }

    return obj;
};

var parseKeys = function parseKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":37}],36:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var defaults = {
    delimiter: '&',
    strictNullHandling: false,
    skipNulls: false,
    encode: true,
    encoder: Utils.encode
};

var stringify = function stringify(object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = obj.toISOString();
    } else if (obj === null) {
        if (strictNullHandling) {
            return encoder ? encoder(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || Utils.isBuffer(obj)) {
        if (encoder) {
            return [encoder(prefix) + '=' + encoder(obj)];
        }
        return [prefix + '=' + String(obj)];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots));
        } else {
            values = values.concat(stringify(obj[key], prefix + (allowDots ? '.' + key : '[' + key + ']'), generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = encode ? (typeof options.encoder === 'function' ? options.encoder : defaults.encoder) : null;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var objKeys;
    var filter;

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(stringify(obj[key], key, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots));
    }

    return keys.join(delimiter);
};

},{"./utils":37}],37:[function(require,module,exports){
'use strict';

var hexTable = (function () {
    var array = new Array(256);
    for (var i = 0; i < 256; ++i) {
        array[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (obj[i] && typeof obj[i] === 'object') {
                compacted.push(exports.compact(obj[i], refs));
            } else if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; ++j) {
        var key = keys[j];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}],38:[function(require,module,exports){
/**
 * Append all not-existing props to the initial object
 *
 * @return {[type]} [description]
 */
module.exports = function(){
	var args = [].slice.call(arguments);
	var res = args[0];
	var l = args.length;

	if (typeof res !== 'object') throw  Error('Bad argument');

	for (var i = 1, l = args.length, obj; i < l; i++) {
		obj = args[i];
		if (typeof obj === 'object') {
			for (var prop in obj) {
				if (res[prop] === undefined) res[prop] = obj[prop];
			}
		}
	}

	return res;
};
},{}],39:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    var arguments$1 = arguments;

    for (var i = 1; i < arguments.length; i++) {
        var source = arguments$1[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],40:[function(require,module,exports){
var extend = require('xtend/mutable');
var createParams = require('./');
var insertCSS = require('insert-css');

//prepare body
var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);

insertCSS("\n\tbody {\n\t\tmargin: 0;\n\t}\n\tbody > .prama {\n\t\tmax-width: 900px;\n\t\t/* background: rgb(251, 250, 249); */\n\t\tborder-radius: .5rem;\n\t\tpadding: 1rem;\n\t}\n\t.prama-title {\n\t\ttext-align: center;\n\t\tletter-spacing: -.05ex;\n\t}\n");

//prepare demo params
var demoParams = createParams([
], {
	title: 'Settings',
	popup: {
		type: 'sidebar',
		side: 'right',
		shift: 100
	}
});

//create main form
var params = createParams({
	type: {
		type: 'list',
		label: 'Type',
		values: ['text', 'number', 'multirange', 'textarea', 'toggle', 'select', 'switch', 'button'],
		value: 'text',
		change: function (value) {
			if (value === 'number' || value === 'range') {
				params.setParam('value', {
					type: 'number'
				});
			}
			else {
				params.setParam('value', {
					type: 'text',
					placeholder: 'value...'
				});
			}
			//show values list
			if (value === 'select' || value === 'switch') {
				params.setParam('values', {
					hidden: false
				});
			}
			else {
				params.setParam('values', {
					hidden: true
				});
			}
			//show placeholder
			if (value === 'text' || value === 'textarea') {
				params.setParam('placeholder', {
					hidden: false
				});
			}
			else {
				params.setParam('placeholder', {
					hidden: true
				});
			}
			params.setParam('example', {
				type: value
			});
		}
	},
	label: {
		label: 'Label',
		value: 'Field',
		placeholder: 'Field name...',
		change: function (value) {
			this.setParam('example', {
				label: value
			});
		}
	},
	values: {
		label: 'Values',
		value: ['a', 'b', 'c'],
		hidden: true,
		type: 'textarea',
		placeholder: 'option 1, option 2, option 3, ...',
		change: function (v) {
			var values = Array.isArray(v) ? v : v.split(/\s*,\s*|\n/);
			params.setParam('example', {
				values: values
			});
		}
	},
	value: {
		label: 'Value',
		value: '',
		change: function (v) {
			if (params.params.example.type === 'multirange') {
				v =  Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\s*,\s*|\n/) : [v, v];
			}

			params.setParam('example', v);
		}
	},
	help: {
		label: 'Help text',
		placeholder: 'Help text here...',
		type: 'textarea',
		change: function (v) {
			params.setParam('example', {help: v});
		}
	},
	placeholder: {
		label: 'Placeholder',
		placeholder: 'Placeholder...',
		type: 'text',
		change: function (v) {
			params.setParam('example', {placeholder: v});
		}
	},
	//TODO: make dependent on multirange/range type
	// sampleRange: {
	// 	label: 'Range',
	// 	value: [11, 22]
	// },
	isHidden: {
		label: 'Hidden',
		value: false,
		change: function (value) { return params.setParam('example', {hidden: value}); }
	},
	// isDisabled: {
	// 	label: 'Disabled',
	// 	value: false,
	// 	change: value => params.setParam('example', {hidden: value})
	// },
	save: {
		label: '',
		type: 'button',
		value: '+ Add field',
		// style: {minWidth: '50%', textAlign: 'center'},
		change: function (v) {
			var p = extend({}, params.params.example);
			p.element = null;
			demoParams.setParam('example-' + Object.keys(demoParams.params).length, {
				save: false,
				type: params.getParam('type'),
				label: params.getParam('label'),
				value: params.getParam('value'),
				values: params.getParam('values'),
				hidden: params.getParam('isHidden'),
				help: params.getParam('help')
			});
			params.setParam('label', {
				value: ''
			});
		}
	},
	previewTitle: {
		label: null,
		style: {
			textAlign: 'center',
			columnSpan: 'all',
			display: 'block'
		},
		create: function () {
			//return an html element with bound events
			return '<h3>It looks like that:</h3>'
		}
	},
	example: function () {
		return {
			save: false,
			type: this.getParam('type'),
			label: this.getParam('label'),
			value: this.getParam('value'),
			values: this.getParam('values'),
			hidden: this.getParam('isHidden'),
			help: this.getParam('help')
		};
	},
	// previewBtn: {
	// 	style: {textAlign: 'center', minWidth: '100%'},
	// 	create: () => demoParams.button,
	// }
}, {
	title: 'Create a new field',
	container: null
});


document.body.appendChild(params.element);
},{"./":6,"insert-css":11,"xtend/mutable":39}]},{},[40]);
