const MAX_CHAR = 20;

function removeWhitespace(str) {
  return `${str}`.replace(/\s*/g, "");
}

function bodyTextWithoutWhitespace() {
  return removeWhitespace(document.body.textContent);
}

function process(node, p, i) {
  if (
    null === node ||
    "object" !== typeof node ||
    !node.nodeType ||
    node.nodeType !== Node.TEXT_NODE
  ) {
    return null;
  }
  /** @type {!DocumentFragment} */
  var oParent = document.createDocumentFragment();
  /** @type {!Element} */
  var a = document.createElement("readify");
  return (
    p > 0 &&
      oParent.appendChild(
        document.createTextNode(node.textContent.substring(0, p))
      ),
    (a.textContent = node.textContent.substring(p, i)),
    oParent.appendChild(a),
    i > 0 &&
      oParent.appendChild(
        document.createTextNode(
          node.textContent.substring(i, node.textContent.length)
        )
      ),
    removeWhitespace(a.textContent).length > 0 &&
      "" !== a.textContent.trim() &&
      node.parentNode.replaceChild(oParent, node),
    a.textContent.length
  );
}

function beginHighlight(data) {
  var line = data.prev + data.core + data.next;
  var obj = (function () {
    var textNodeList = [];
    var textList = [];
    var treeWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    for (; treeWalker.nextNode(); ) {
      textNodeList.push(treeWalker.currentNode);
      textList.push(treeWalker.currentNode.textContent);
    }
    return {
      textNodeList,
      textList,
    };
  })();

  var index = bodyTextWithoutWhitespace().indexOf(removeWhitespace(line));
  var j = -1;
  var length = 0;

  if (index === -1) return false;

  for (; index >= length; ) {
    j++;
    length = length + removeWhitespace(obj.textList[j]).length;
  }

  var match = [];
  var textArr = [];
  var sentenceWithoutSpace = removeWhitespace(line);

  do {
    match.push(obj.textNodeList[j]);
    textArr.push(obj.textList[j]);
    j++;
  } while (
    removeWhitespace(textArr.join("")).indexOf(sentenceWithoutSpace) < 0
  );

  var phraseLength = data.core.length;
  var options = (function (vector, matchIdx) {
    var i = 0;
    var iIndex = 0;

    if (matchIdx === -1) {
      return {
        index: i,
        offset: -1,
      };
    }

    console.log(line);

    for (; i < vector.length && iIndex + vector[i].length < matchIdx; i++) {
      iIndex += vector[i].length;
    }
    return {
      index: i,
      offset: matchIdx - iIndex,
    };
  })(
    textArr,
    (function (flags, mode) {
      const idx = flags.join("").indexOf(mode);
      if (idx === -1) return idx;
      return idx + data.prev.length;
    })(textArr, line)
  );

  if (options.offset === -1) return false;

  for (; phraseLength > 0 && options.index < match.length; ) {
    var size = 0;
    var num = ((index = options.offset), 0);

    if (index + phraseLength < match[options.index].length) {
      num = index + phraseLength;
      size = phraseLength;
    } else {
      size = match[options.index].length - index;
      num = match[options.index].length;
    }

    process(match[options.index], index, num);

    options.index++;

    phraseLength = phraseLength - size;

    options.offset = 0;
  }
  return true;
}

function highlight(e) {
  e.preventDefault();
  const input = e.target.querySelector("input");
  const value = input.value;
  try {
    console.log(JSON.parse(value));
    beginHighlight(JSON.parse(value));
    input.value = "";
  } catch (error) {
    return;
  }
}

function removeWhiteSpace(str) {
  return `${str}`.replace(/\s*/g, "");
}

function getText() {
  const result = {
    prev: "",
    core: "",
    next: "",
  };
  const selection = document.getSelection();
  if (selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  // get core
  result.core = selection.getRangeAt(0).toString();

  const { startOffset, startContainer, endContainer, endOffset } = range;

  // get prev
  treeWalker.currentNode = startContainer;
  if (startContainer.nodeType !== Node.TEXT_NODE) return;

  result.prev = treeWalker.currentNode.textContent.substring(0, startOffset);

  while (
    removeWhiteSpace(result.prev).length < MAX_CHAR &&
    null !== treeWalker.currentNode
  ) {
    result.prev = treeWalker.previousNode().textContent + result.prev;
  }

  // get next
  treeWalker.currentNode = endContainer;
  if (endContainer.nodeType !== Node.TEXT_NODE) return;

  result.next = treeWalker.currentNode.textContent.substring(
    endOffset,
    treeWalker.currentNode.textContent.length
  );

  while (
    removeWhiteSpace(result.next).length < MAX_CHAR &&
    null !== treeWalker.currentNode
  ) {
    result.next = result.next + treeWalker.nextNode().textContent;
  }

  result.prev.trimLeft();
  result.next.trimRight();

  console.clear();
  alert(JSON.stringify(result));
  return true;
}

document.querySelector("#form").addEventListener("submit", highlight);
