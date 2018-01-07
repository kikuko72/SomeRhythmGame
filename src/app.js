function h(name, props) {
    var node
    var children = []
  
    for (var stack = [], i = arguments.length; i-- > 2; ) {
      stack.push(arguments[i])
    }
  
    while (stack.length) {
      if (Array.isArray((node = stack.pop()))) {
        for (var i = node.length; i--; ) {
          stack.push(node[i])
        }
      } else if (node == null || node === true || node === false) {
      } else {
        children.push(node)
      }
    }
  
    return typeof name === "string"
      ? {
          name: name,
          props: props || {},
          children: children
        }
      : name(props || {}, children)
  }
  
function app(state, actions, view, container) {
    var patchLock
    var lifecycle = []
    var root = container && container.children[0]
    var node = vnode(root, [].map)
  
    repaint(init([], (state = copy(state)), (actions = copy(actions))))
  
    return actions
  
    function vnode(element, map) {
      return (
        element && {
          name: element.nodeName.toLowerCase(),
          props: {},
          children: map.call(element.childNodes, function(element) {
            return element.nodeType === 3
              ? element.nodeValue
              : vnode(element, map)
          })
        }
      )
    }
  
    function render(next) {
      patchLock = !patchLock
      next = view(state, actions)
  
      if (container && !patchLock) {
        root = patch(container, root, node, (node = next))
      }
  
      while ((next = lifecycle.pop())) next()
    }
  
    function repaint() {
      if (!patchLock) {
        patchLock = !patchLock
        setTimeout(render)
      }
    }
  
    function copy(a, b) {
      var target = {}
  
      for (var i in a) target[i] = a[i]
      for (var i in b) target[i] = b[i]
  
      return target
    }
  
    function set(path, value, source, target) {
      if (path.length) {
        target[path[0]] =
          path.length > 1 ? set(path.slice(1), value, source[path[0]], {}) : value
        return copy(source, target)
      }
      return value
    }
  
    function get(path, source) {
      for (var i = 0; i < path.length; i++) {
        source = source[path[i]]
      }
      return source
    }
  
    function init(path, slice, actions) {
      for (var key in actions) {
        typeof actions[key] === "function"
          ? (function(key, action) {
              actions[key] = function(data) {
                slice = get(path, state)
  
                if (typeof (data = action(data)) === "function") {
                  data = data(slice, actions)
                }
  
                if (data && data !== slice && !data.then) {
                  repaint((state = set(path, copy(slice, data), state, {})))
                }
  
                return data
              }
            })(key, actions[key])
          : init(
              path.concat(key),
              (slice[key] = slice[key] || {}),
              (actions[key] = copy(actions[key]))
            )
      }
    }
  
    function getKey(node) {
      return node && node.props ? node.props.key : null
    }
  
    function setElementProp(element, name, value, isSVG, oldValue) {
      if (name === "key") {
      } else if (name === "style") {
        for (var i in copy(oldValue, value)) {
          element[name][i] = value == null || value[i] == null ? "" : value[i]
        }
      } else {
        if (typeof value === "function" || (name in element && !isSVG)) {
          element[name] = value == null ? "" : value
        } else if (value != null && value !== false) {
          element.setAttribute(name, value)
        }
  
        if (value == null || value === false) {
          element.removeAttribute(name)
        }
      }
    }
  
    function createElement(node, isSVG) {
      var element =
        typeof node === "string" || typeof node === "number"
          ? document.createTextNode(node)
          : (isSVG = isSVG || node.name === "svg")
            ? document.createElementNS("http://www.w3.org/2000/svg", node.name)
            : document.createElement(node.name)
  
      if (node.props) {
        if (node.props.oncreate) {
          lifecycle.push(function() {
            node.props.oncreate(element)
          })
        }
  
        for (var i = 0; i < node.children.length; i++) {
          element.appendChild(createElement(node.children[i], isSVG))
        }
  
        for (var name in node.props) {
          setElementProp(element, name, node.props[name], isSVG)
        }
      }
  
      return element
    }
  
    function updateElement(element, oldProps, props, isSVG) {
      for (var name in copy(oldProps, props)) {
        if (
          props[name] !==
          (name === "value" || name === "checked"
            ? element[name]
            : oldProps[name])
        ) {
          setElementProp(element, name, props[name], isSVG, oldProps[name])
        }
      }
  
      if (props.onupdate) {
        lifecycle.push(function() {
          props.onupdate(element, oldProps)
        })
      }
    }
  
    function removeChildren(element, node, props) {
      if ((props = node.props)) {
        for (var i = 0; i < node.children.length; i++) {
          removeChildren(element.childNodes[i], node.children[i])
        }
  
        if (props.ondestroy) {
          props.ondestroy(element)
        }
      }
      return element
    }
  
    function removeElement(parent, element, node, cb) {
      function done() {
        parent.removeChild(removeChildren(element, node))
      }
  
      if (node.props && (cb = node.props.onremove)) {
        cb(element, done)
      } else {
        done()
      }
    }
  
    function patch(parent, element, oldNode, node, isSVG, nextSibling) {
      if (node === oldNode) {
      } else if (oldNode == null) {
        element = parent.insertBefore(createElement(node, isSVG), element)
      } else if (node.name && node.name === oldNode.name) {
        updateElement(
          element,
          oldNode.props,
          node.props,
          (isSVG = isSVG || node.name === "svg")
        )
  
        var oldElements = []
        var oldKeyed = {}
        var newKeyed = {}
  
        for (var i = 0; i < oldNode.children.length; i++) {
          oldElements[i] = element.childNodes[i]
  
          var oldChild = oldNode.children[i]
          var oldKey = getKey(oldChild)
  
          if (null != oldKey) {
            oldKeyed[oldKey] = [oldElements[i], oldChild]
          }
        }
  
        var i = 0
        var j = 0
  
        while (j < node.children.length) {
          var oldChild = oldNode.children[i]
          var newChild = node.children[j]
  
          var oldKey = getKey(oldChild)
          var newKey = getKey(newChild)
  
          if (newKeyed[oldKey]) {
            i++
            continue
          }
  
          if (newKey == null) {
            if (oldKey == null) {
              patch(element, oldElements[i], oldChild, newChild, isSVG)
              j++
            }
            i++
          } else {
            var recyledNode = oldKeyed[newKey] || []
  
            if (oldKey === newKey) {
              patch(element, recyledNode[0], recyledNode[1], newChild, isSVG)
              i++
            } else if (recyledNode[0]) {
              patch(
                element,
                element.insertBefore(recyledNode[0], oldElements[i]),
                recyledNode[1],
                newChild,
                isSVG
              )
            } else {
              patch(element, oldElements[i], null, newChild, isSVG)
            }
  
            j++
            newKeyed[newKey] = newChild
          }
        }
  
        while (i < oldNode.children.length) {
          var oldChild = oldNode.children[i]
          if (getKey(oldChild) == null) {
            removeElement(element, oldElements[i], oldChild)
          }
          i++
        }
  
        for (var i in oldKeyed) {
          if (!newKeyed[oldKeyed[i][1].props.key]) {
            removeElement(element, oldKeyed[i][0], oldKeyed[i][1])
          }
        }
      } else if (node.name === oldNode.name) {
        element.nodeValue = node
      } else {
        element = parent.insertBefore(
          createElement(node, isSVG),
          (nextSibling = element)
        )
        removeElement(parent, nextSibling, oldNode)
      }
      return element
    }
  }

/** @jsx h */

const difficulty = {
    MM : { columns : 6}
}

const noteType = {
      placeholder : { label : 'なし(削除)'    , value: 0, class: 'placeholder'}
    , single      : { label : '単独ノーツ'    , value: 1, class: 'normal'     }
    , large       : { label : '単独ノーツ(大)', value: 2, class: 'large'      }     
    , right       : { label : '右フリック'    , value: 3, class: 'right'      }
    , left        : { label : '左フリック'    , value: 4, class: 'left'       }
    , up          : { label : '上フリック'    , value: 5, class: 'up'         }
}

const noteTypes = Object.keys(noteType).map(key => noteType[key]);

const initNotes = (columns, lines) => {
    let notes = [];
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        notes[columnIndex] = [];
        for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
            notes[columnIndex][lineIndex] = {
                type : noteType.placeholder
                , x : columnIndex
                , y : lineIndex
            }
        }
    }
    return notes;
}

const initLinkNotes = (columns, lines) => {
    let notes = [];
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        notes[columnIndex] = [];
        for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
            notes[columnIndex][lineIndex] = null;
        }
    }
    return notes;
}

const updateNotes = (notes, editType, x, y) => notes.map((columns, columnIndex) => columns.map(
    (point, lineIndex) => {
        if (columnIndex === x && lineIndex === y) {
            return {
                type : editType
                , x : columnIndex
                , y : lineIndex
            }
        }
        return point;
    }
));

const createLink = (linkNotes, x1, y1, x2, y2) => linkNotes.map((columns, columnIndex) => columns.map(
    (point, lineIndex) => {
        if (columnIndex === x1 && lineIndex === y1) {
            return {
                refX: x2
                , refY: y2
                , isStart: true
            }
        } else if (columnIndex === x2 && lineIndex === y2) {
            return {
                refX: x1
                , refY: y1
                , isStart: false
            }
        }
        return point;
    }
));

const deleteLink = (linkNotes, x, y) => {
    const refPoint = linkNotes[x][y];
    if (refPoint === null) {
        return linkNotes;
    }
    const refX = refPoint.refX;
    const refY = refPoint.refY;
    return linkNotes.map((columns, columnIndex) => columns.map(
        (point, lineIndex) => {
            if (columnIndex === x && lineIndex === y) {
                return null;
            } else if (columnIndex === refX && lineIndex === refY) {
                return null;
            }
            return point;
        }
    ));
};

const extendNotes = (notes, increaseLinesCount) => {
    return notes.map((columns, columnIndex) => {
        let newColumns = columns.slice(0);
        for (let lineIndex = columns.length; lineIndex < columns.length + increaseLinesCount; lineIndex++) {
            newColumns[lineIndex] = {
                type : noteType.placeholder
                , x : columnIndex
                , y : lineIndex
            }
        } 
        return newColumns; 
    });
}

const extendLinkNotes = (linkNotes, increaseLinesCount) => {
    return linkNotes.map(columns => {
        let newColumns = columns.slice(0);
        for (let lineIndex = columns.length; lineIndex < columns.length + increaseLinesCount; lineIndex++) {
            newColumns[lineIndex] = null;
        }  
        return newColumns;
    });
}

const shrinkNotes = (notes, decreaseLinesCount) => {
    return notes.map(columns => {
        return columns.slice(0, columns.length - decreaseLinesCount);
    });
}

const shrinkLinkNotes = (linkNotes, decreaseLinesCount) => {
    const newLineLength = linkNotes[0].length - decreaseLinesCount;
    return linkNotes.map(columns => {
        let newColumns = columns.slice(0, newLineLength);
        for(let lineIndex = 0; lineIndex < newColumns.length; lineIndex++) {
            const point = newColumns[lineIndex];
            if (point !== null && point.refY >= newLineLength) {
                newColumns[lineIndex] = null;
            }
        }
        return newColumns;
    });
}

const difficultyState = difficulty.MM;
const initialLines = 8;
const basicNoteDiameter = 32
const smallNoteSize = 0.8 * basicNoteDiameter / 3;
const largeNoteSize = 1.3 * basicNoteDiameter / 3;

const state = {
    difficulty: difficultyState
  , lines: initialLines
  , notes: initNotes(difficultyState.columns, initialLines)
  , linkNotes: initLinkNotes(difficultyState.columns, initialLines)
  , editType: noteType.single
  , linkEdit: {isEditting: false, startPoint: null} 
  , showPlaceholder: true
}

const actions = {
  changeEditType: event => state => {
        const value = parseInt(event.target.value);
        return {editType: noteTypes.filter(note => note.value === value)[0]}
    }
  , togglePlaceholderVisibility: () => state => {
        return { showPlaceholder: !state.showPlaceholder };
  }
  , setNoteType: ({x, y}) => state => {
        return { notes: updateNotes(state.notes, state.editType, x, y), linkNotes: deleteLink(state.linkNotes, x, y) };
  }
  , startLinkEdit: () => state => {
        return { linkEdit: {isEditting: true, startPoint: null} };
  }
  , abortLinkEdit: () => state => {
        return { linkEdit: {isEditting: false, startPoint: null} };
  }
  , setLinkStartPoint: ({x, y}) => state => {
        return { linkEdit: {isEditting: true, startPoint: {x, y}} };
  }
  , finishLinkEdit: ({x1, y1, x2, y2}) => state => {
        if (y1 === y2) {
            return {};
        }
        return { linkNotes: createLink(state.linkNotes, x1, y1, x2, y2), linkEdit: {isEditting: false, startPoint: null} };
  }
  , changeLines: ({beforeLinesCount, afterLinesCount}) => state => {
      if(beforeLinesCount === afterLinesCount) {
          return {};
      }
      if (beforeLinesCount < afterLinesCount) {
          const increaseLinesCount = afterLinesCount - beforeLinesCount;
          return { lines:afterLinesCount, notes: extendNotes(state.notes, increaseLinesCount), linkNotes: extendLinkNotes(state.linkNotes, increaseLinesCount)};
      }
      const decreaseLinesCount = beforeLinesCount - afterLinesCount;
      return { lines:afterLinesCount, notes: shrinkNotes(state.notes, decreaseLinesCount), linkNotes: shrinkLinkNotes(state.linkNotes, decreaseLinesCount)};
  }
}

const calculateCX = x => basicNoteDiameter * (x * 2 + 1);
const calculateCY = y => basicNoteDiameter * (y + 1);
const calculateSvgWith = (state) => calculateCX(state.difficulty.columns);
const calculateSvgHeight = (state) => calculateCY(state.lines);

const Note = ({x, y, type, size}) => (
    <circle cx={calculateCX(x)} 
        cy={calculateCY(y)}
        r={size}
        class={type.class}
        />
);
const getHandler = (x, y, actions, state) => {
    if (!state.linkEdit.isEditting) {
        return e => actions.setNoteType({x: x, y: y});
    }
    if (state.linkEdit.startPoint === null) {
        return e => actions.setLinkStartPoint({x: x, y: y});
    }
    return e=> actions.finishLinkEdit({x1: state.linkEdit.startPoint.x, y1: state.linkEdit.startPoint.y, x2: x, y2: y});
}

const Placeholder = ({x, y, type, actions}) => (
    <circle id={'x:' + x +'-y:' + y}
        fill="#fff"
        fill-opacity="0"
        cx={calculateCX(x)} 
        cy={calculateCY(y)}
        r={basicNoteDiameter / 2}
        class={type.class}
        onclick={(e => actions.setNoteType({x: x, y: y}))}/>
);

const SingleNote = ({x, y, type, actions, state}) => (
    <g onclick={getHandler(x, y, actions, state)}
      fill="#f66"
      stroke="#000"
      stroke-width="1px">
      <Note x={x}
        y={y} 
        type={type}
        size={smallNoteSize} />
    </g>
);

const LargeNote = ({x, y, type, actions, state}) => (
    <g onclick={getHandler(x, y, actions, state)}
      fill="#f66"
      stroke="#000"
      stroke-width="2px">
      <Note x={x}
        y={y} 
        type={type}
        actions={actions}
        size={largeNoteSize} />
    </g>
);

const RightNote = ({x, y, type, actions, state}) => (
    <g onclick={getHandler(x, y, actions, state)}
      fill="#da0"
      stroke="#000"
      stroke-width="2px">
      <Note x={x}
        y={y} 
        type={type}
        size={largeNoteSize} />
      <line 
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x) + largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
      <line 
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x) + largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) - largeNoteSize * 0.7}/>
      <line 
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x) + largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) + largeNoteSize * 0.7}/>
    </g>
);
const LeftNote = ({x, y, type, actions, state}) => (
    <g onclick={getHandler(x, y, actions, state)}
      fill="#0ad"
      stroke="#000"
      stroke-width="2px">
      <Note x={x}
        y={y} 
        type={type}
        size={largeNoteSize} />
      <line
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x) + largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
      <line
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) - largeNoteSize * 0.7}/>
      <line
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) + largeNoteSize * 0.7}/>
    </g>
);
const UpNote = ({x, y, type, actions, state}) => (
    <g onclick={getHandler(x, y, actions, state)}
      fill="#494"
      stroke="#000"
      stroke-width="2px">
      <Note x={x}
        y={y} 
        type={type}
        size={largeNoteSize} />
      <line 
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x)}
        y1={calculateCY(y) - largeNoteSize * 0.7}
        x2={calculateCX(x)}
        y2={calculateCY(y) + largeNoteSize * 0.7}/>
      <line
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x)}
        y1={calculateCY(y) - largeNoteSize * 0.7}
        x2={calculateCX(x) + largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
      <line 
        stroke="#fff"
        stroke-width="3px"
        stroke-linecap="round"
        x1={calculateCX(x)}
        y1={calculateCY(y) - largeNoteSize * 0.7}
        x2={calculateCX(x) - largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
    </g>
);

const renderNote = (point, actions, state) => {
    switch(point.type.value) {
        case noteType.single.value:
            return (
            <SingleNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} 
                state={state}
                />
            );
        case noteType.large.value:
            return (
            <LargeNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} 
                state={state}
                />
            );
        case noteType.right.value:
            return (
            <RightNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} 
                state={state}
                />
            );
        case noteType.left.value:
            return (
            <LeftNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} 
                state={state}
                />
            );
        case noteType.up.value:
            return (
            <UpNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} 
                state={state}
                />
            );
        default: 
            return (
            <Placeholder x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} 
                />
            );
    }
};

const renderLink = (x, y, point) => {
    if(point === null || !point.isStart) {
        return null;
    }
    return <line class="longNotes"
        stroke="rgb(218, 221, 51)"
        stroke-width="15px"
        stroke-linecap="round"
        x1={calculateCX(x)}
        y1={calculateCY(y)}
        x2={calculateCX(point.refX)}
        y2={calculateCY(point.refY)}/>
};

const LinkEditButton = ({isEditting, actions}) => {
    if(isEditting) {
        return <button onclick={actions.abortLinkEdit}>長押しの作成をやめる</button>    
    }
    return <button onclick={actions.startLinkEdit}>長押しの作成</button>    
};
const LinkEditMessage = ({isEditting, isStart}) => {
    if(!isEditting) {
        return null;
    }
    if(isEditting && isStart) {
        return <div>長押しの始点となるノーツを指定してください</div>
    }
    return <div>長押しの終点となるノーツを指定してください</div>
};

const downloadAsImage = () => {
    const svg = document.getElementById('score');
    const svgData = new XMLSerializer().serializeToString(svg);
    let canvas = document.createElement("canvas");
    canvas.width = svg.width.baseVal.value;
    canvas.height = svg.height.baseVal.value;

    const ctx = canvas.getContext("2d");
    let image = new Image;
    image.onload = function(){
        ctx.drawImage( image, 0, 0 );
        let a = document.getElementById('download');
        const data = canvas.toDataURL("image/png");
        console.log(data);
        a.href = data;
    }
    const src = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgData)));
    image.src = src;
};

const view = (state, actions) => (
  <div>
    <div id="editPanel">
      <div id="downloadArea">
        <a id="download" download="image.png">画像のダウンロード</a>
      </div>
      <div>
        <input id="showPlaceholderCheck" type="checkbox" defaultChecked={state.showPlaceholder} onchange={actions.togglePlaceholderVisibility}/>
        <label for="showPlaceholderCheck">ノーツが無い場所にプレースホルダーを表示する</label>
      </div>
      <div>
        <span>作成するノーツの種類：</span>
        <select id="editType" onchange={actions.changeEditType} value={state.editType.value}>
          {noteTypes.map(note => <option value={note.value}>{note.label}</option>)}
        </select>
      </div>
      <div>
        <span>譜面の行数</span>
        <input type="number" value={state.lines} onchange={e => actions.changeLines({beforeLinesCount: state.lines, afterLinesCount: parseInt(e.target.value)})}/>
      </div>
      <div>
        <LinkEditButton isEditting={state.linkEdit.isEditting} actions={actions} />
        <LinkEditMessage isEditting={state.linkEdit.isEditting} isStart={state.linkEdit.startPoint === null} />
      </div>
    </div>
    <svg id="score" class={state.showPlaceholder ? 'showPlaceholder' : ''} width={calculateSvgWith(state)} height={calculateSvgHeight(state)} viewBox={'0 0 ' + calculateSvgWith(state) + ' ' + calculateSvgHeight(state)}
         xmlns="http://www.w3.org/2000/svg" version="1.1"
         onupdate={(element, oldProps) => downloadAsImage()}>
         {state.linkNotes.map((columns, columnIndex) => columns.map((point, lineIndex) => renderLink(columnIndex, lineIndex, point)))}
         {state.notes.map(columns => columns.map(point => renderNote(point, actions, state)))}
    </svg>
  </div>
);

app(state, actions, view, document.body)