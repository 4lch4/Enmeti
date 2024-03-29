const vscode = require('vscode')
const Window = vscode.window
const Range = vscode.Range

/**
 * Replaces the currently selected text with the properly formatted Markdown
 * text to reference a link using the provided reference number, thereby
 * inserting a link reference in place of your currently selected text.
 *
 * @async
 *
 * @param {Selection[]} selections The selections to replace with a link reference.
 * @param {Link} reference The reference number to be used for the link.
 *
 * @returns {Promise<boolean>} Did the edit succeed?
 */
const insertLinkReferenceText = (selections, reference, ogText = undefined) => {
  return new Promise((resolve, reject) => {
    Window.activeTextEditor
      .edit(builder => {
        for (let x = 0; x < selections.length; x++) {
          let selection = selections[x]

          // The OG text to begin with
          if (ogText === undefined) {
            ogText = Window.activeTextEditor.document.getText(
              new Range(selection.start, selection.end)
            )
          }

          // The New School text to replace it with
          let nsText = `[${ogText}][${reference.index}]`

          // Perform the actual replacement
          builder.replace(selection, nsText)
        }
      })
      .then(
        fulfilled => resolve(fulfilled),
        err => reject(err)
      )
  })
}

/**
 * Replaces the currently selected text with the properly formatted Markdown
 * text to reference an image using the provided reference number, thereby
 * inserting an image reference in place of your currently selected text.
 *
 * @param {Selection} selection The text to replace with an image reference.
 * @param {Link} reference The reference number to be used for the image.
 *
 * @returns {Promise<boolean>} Did the edit succeed?
 */
const insertImageReferenceText = (selection, reference, ogText = undefined) => {
  return new Promise((resolve, reject) => {
    Window.activeTextEditor
      .edit(builder => {
        // The OG text to begin with
        if (ogText === undefined) {
          ogText = Window.activeTextEditor.document.getText(
            new Range(selection.start, selection.end)
          )
        }

        // The New School text to replace it with
        let nsText = `![${ogText}][${reference.index}]`

        // Perform the actual replacement
        builder.replace(selection, nsText)
      })
      .then(
        fulfilled => resolve(fulfilled),
        err => {
          if (err) reject(err)
        }
      )
  })
}

/**
 * Inserts a Markdown formatted line for referencing a link by index to the
 * currently active text editor. For example:
 *
 * [0]: https//unsplash.com
 *
 * @param {Link} reference The link/reference to add to the end of the file.
 *
 * @returns {Promise<boolean>} Did the edit succeed?
 */
const insertReferenceToFile = reference => {
  return new Promise((resolve, reject) => {
    Window.activeTextEditor
      .edit(builder => {
        // The position for the actual url to go
        let position = new vscode.Position(reference.lineNum, 0)

        // The formatted string containing the index and url
        let content = `[${reference.index}]: ${reference.url}\n`

        // Insert the url reference at the bottom of the file
        builder.insert(position, content)
      })
      .then(
        fulfilled => resolve(fulfilled),
        err => {
          if (err) reject(err)
        }
      )
  })
}

const Doc = Window.activeTextEditor.document

/**
 * Gets the last line in the document that is a reference link. This is to help
 * avoid adding lines at the end of a file if there's a group of links followed
 * by a blank line.
 *
 * @param {Doc} doc
 */
const getLastReferenceLine = doc => {
  let lastLine = -1

  for (let x = 0; x < doc.lineCount; x++) {
    let line = doc.lineAt(x)
    if (line.text.match(/^\[\d+\]:/)) lastLine = x
  }

  if (lastLine === -1) return doc.lineCount + 1
  else return lastLine + 1
}

module.exports.getLastReferenceLine = getLastReferenceLine
module.exports.insertReferenceToFile = insertReferenceToFile
module.exports.insertLinkReferenceText = insertLinkReferenceText
module.exports.insertImageReferenceText = insertImageReferenceText
