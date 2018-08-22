// Used for JSDocs
const Window = require('vscode').window

/** A regex statement to test if the string starts with a link reference. */
const urlStarterRegex = /\[\d+\]: /

/** A regex statement to test if the string is a valid url. */
const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,15}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/

/**
 * Parses the provided document for any existing links by testing each line,
 * starting from the last line and moving up, to see if it matches the
 * "\[\d*\]: " regex statement. If so, it's added to the links collection.
 *
 * @param {Doc} doc
 *
 * @returns {Reference[]} A collection of links found in the document
 */
const parseExistingLinks = doc => {
  let links = []

  try {
    for (let x = doc.lineCount - 1; x >= 0; x--) {
      let lineText = doc.lineAt(x).text

      if (urlStarterRegex.test(lineText)) {
        links.push({
          index: getLinkIndex(lineText),
          url: getLinkUrl(lineText),
          lineNum: x
        })
      }
    }
  } catch (err) {
    console.error(`An error has occured while trying to parse existing links: ${err.message}`)
    return []
  }

  return links
}

module.exports.parseExistingLinks = parseExistingLinks

/**
 * Gets the url of the link referenced in the provided string.
 *
 * @param {string} text The line containing the link
 */
const getLinkUrl = text => {
  let start = text.indexOf(']: ') + 3

  return text.substring(start)
}

/**
 * Gets the link index, or number between the brackets, of the provided string.
 *
 * @param {string} text The line containing the link
 */
const getLinkIndex = text => {
  let start = text.indexOf('[') + 1
  let end = text.indexOf(']')

  return text.substring(start, end)
}

/**
 * Parse the given collection of links and determine the highest number value
 * for the reference index and returns that number plus 1. For example, if the
 * last number currently used for an index is 10, then 11 is returned for use as
 * the next references index.
 *
 * @param {Reference[]} links The collection of links to parse
 *
 * @returns {number} The highest current reference index plus 1
 */
const getMaxIndex = links => {
  /** The maximum index currently known to have been used */
  let maxIndex = -1

  links.forEach(link => {
    // I use this ridiculous condition because I ran into a condition where
    // Node was saying 9 > 11 == true...
    if ((link.index - maxIndex) > 0) maxIndex = link.index
  })

  // Add one so it can be used for the next reference index
  maxIndex++

  return maxIndex
}

module.exports.getMaxIndex = getMaxIndex

/**
 * Displays an InputBox to the user and asks them a question in order to obtain
 * the URL for the link they're working with. If no prompt argument is provided
 * the default of "What is the URL this link should point to?" is used.
 *
 * @param {String} [prompt] The question to display when asking for the URL
 *
 * @returns {Promise<String>} The URL returned via a Promise
 */
const getLinkUrlFromUser = (prompt = 'What is the URL this link should point to?') => {
  return new Promise((resolve, reject) => {
    Window.showInputBox({
      placeHolder: 'https://hasslefree.solutions',
      prompt: prompt,
      validateInput: val => {
        if (urlRegex.test(val)) return null
        else return 'Please provide a value url.'
      },
      ignoreFocusOut: true
    }).then(res => resolve(res), err => { if (err) reject(err) })
  })
}

module.exports.getLinkUrlFromUser = getLinkUrlFromUser

/**
 * Checks the currently stored references to see if the provided URL has already
 * been stored as a URL for another reference.
 *
 * @param {String} url The url you wish to check if it has been stored
 *
 * @param {Reference[]} references The currently stored references
 */
const getNewLink = (url, doc) => {
  let references = parseExistingLinks(doc)

  return new Promise((resolve, reject) => {
    for (let x = 0; x < references.length; x++) {
      if (references[x].url === url) {
        references[x].existed = true
        resolve(references[x])
      }
    }

    resolve({
      existed: false,
      index: getMaxIndex(references),
      url: url,
      lineNum: Window.activeTextEditor.document.lineCount
    })
  })
}

module.exports.getNewReference = getNewLink

/**
   * @typedef {Object} Reference
   * @prop {number} index The reference number used for the inline link
   * @prop {string} url The url the link points to
   * @prop {number} lineNum The line number the link resides on
   */
