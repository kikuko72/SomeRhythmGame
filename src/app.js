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
      placeholder : { label : 'なし'         , value: 0, class: 'placeholder'}
    , single      : { label : '単独ノーツ'    , value: 1, class: 'normal'     }
    , large       : { label : '単独ノーツ(大)', value: 2, class: 'large'      }     
    , right       : { label : '右フリック'    , value: 3, class: 'right'      }
    , left        : { label : '左フリック'    , value: 4, class: 'left'       }
    , up          : { label : '上フリック'    , value: 5, class: 'up'         }
    , linked      : { label : '連結ノーツ'    , value: 6, class: 'normal'     }
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

const difficultyState = difficulty.MM;
const initialLines = 8;
const basicNoteDiameter = 32
const smallNoteSize = 0.8 * basicNoteDiameter / 3;
const largeNoteSize = 1.3 * basicNoteDiameter / 3;

const state = {
    difficulty: difficultyState
  , lines: initialLines
  , notes: initNotes(difficultyState.columns, initialLines)
  , editType: noteType.single
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
        return { notes: updateNotes(state.notes, state.editType, x, y) };
  }
}

const calculateCX = x => basicNoteDiameter * (x * 2 + 1);
const calculateCY = y => basicNoteDiameter * (y + 1);
const calculateSvgWith = () => calculateCX(state.difficulty.columns);
const calculateSvgHeight = () => calculateCY(state.lines);

const Note = ({x, y, type, size}) => (
    <circle cx={calculateCX(x)} 
        cy={calculateCY(y)}
        r={size}
        class={type.class}
        />
);
const getHandler = (x, y, actions) => (e => actions.setNoteType({x : x, y: y}));

const Placeholder = ({x, y, type, actions}) => (
    <circle id={'x:' + x +'-y:' + y}
        cx={calculateCX(x)} 
        cy={calculateCY(y)}
        r={basicNoteDiameter / 2}
        class={type.class}
        onclick={getHandler(x, y, actions)}/>
);

const SingleNote = ({x, y, type, actions}) => (
    <g onclick={getHandler(x, y, actions)}>
      <Note x={x}
        y={y} 
        type={type}
        size={smallNoteSize} />
    </g>
);

const LargeNote = ({x, y, type, actions}) => (
    <g onclick={getHandler(x, y, actions)}>
      <Note x={x}
        y={y} 
        type={type}
        actions={actions}
        size={largeNoteSize} />
    </g>
);

const RightNote = ({x, y, type, actions}) => (
    <g onclick={getHandler(x, y, actions)}>
      <Note x={x}
        y={y} 
        type={type}
        size={largeNoteSize} />
      <line x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x) + largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
      <line x1={calculateCX(x) + largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) - largeNoteSize * 0.7}/>
      <line x1={calculateCX(x) + largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) + largeNoteSize * 0.7}/>
    </g>
);
const LeftNote = ({x, y, type, actions}) => (
    <g onclick={getHandler(x, y, actions)}>
      <Note x={x}
        y={y} 
        type={type}
        size={largeNoteSize} />
      <line x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x) + largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
      <line x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) - largeNoteSize * 0.7}/>
      <line x1={calculateCX(x) - largeNoteSize * 0.7}
        y1={calculateCY(y)}
        x2={calculateCX(x)}
        y2={calculateCY(y) + largeNoteSize * 0.7}/>
    </g>
);
const UpNote = ({x, y, type, actions}) => (
    <g onclick={getHandler(x, y, actions)}>
      <Note x={x}
        y={y} 
        type={type}
        size={largeNoteSize} />
      <line x1={calculateCX(x)}
        y1={calculateCY(y) - largeNoteSize * 0.7}
        x2={calculateCX(x)}
        y2={calculateCY(y) + largeNoteSize * 0.7}/>
      <line x1={calculateCX(x)}
        y1={calculateCY(y) - largeNoteSize * 0.7}
        x2={calculateCX(x) + largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
      <line x1={calculateCX(x)}
        y1={calculateCY(y) - largeNoteSize * 0.7}
        x2={calculateCX(x) - largeNoteSize * 0.7}
        y2={calculateCY(y)}/>
    </g>
);

const renderNote = (point, actions) => {
    switch(point.type.value) {
        case noteType.single.value:
            return (
            <SingleNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        case noteType.large.value:
            return (
            <LargeNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        case noteType.right.value:
            return (
            <RightNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        case noteType.left.value:
            return (
            <LeftNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        case noteType.up.value:
            return (
            <UpNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        default: 
            return (
            <Placeholder x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
    }
};

const view = (state, actions) => (
  <div>
    <svg id="score" class={state.showPlaceholder ? 'showPlaceholder' : ''} width={calculateSvgWith()} height={calculateSvgHeight()} viewBox={'0 0 ' + calculateSvgWith() + ' ' + calculateSvgHeight()}
         xmlns="http://www.w3.org/2000/svg" version="1.1">
         {state.notes.map(columns => columns.map(point => renderNote(point, actions)))}
    </svg>
    <select id="editType" onchange={actions.changeEditType} value={state.editType.value}>
      {noteTypes.map(note => <option value={note.value}>{note.label}</option>)}
    </select>
    <input id="showPlaceholderCheck" type="checkbox" defaultChecked={state.showPlaceholder} onchange={actions.togglePlaceholderVisibility}/>
    <label for="showPlaceholderCheck">ノーツが無い場所にプレースホルダーを表示する</label>
  </div>
);

app(state, actions, view, document.body)